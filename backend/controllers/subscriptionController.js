// backend/controllers/subscriptionController.js
import Razorpay from 'razorpay';
import crypto from 'crypto';
import pool from '../config/db.js';
import {
  getAllPlans,
  getUserPlanAndUsage,
  ensureFreePlan,
} from '../models/subscriptionModel.js';
import log from '../config/logger.js';

const getRazorpay = () => {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || keyId.includes('placeholder') || keyId.includes('xxx')) {
    return null;
  }

  return new Razorpay({ key_id: keyId, key_secret: keySecret });
};
// GET /api/subscription/plans
export const getPlans = async (req, res) => {
  try {
    const plans = await getAllPlans();
    return res.json({ plans });
  } catch (err) {
    log.error('subscriptionController', 'getPlans failed', err.message);
    return res.status(500).json({ error: 'Failed to fetch plans' });
  }
};

// GET /api/subscription/me
export const getMyPlan = async (req, res) => {
  const userId = req.session.userId;
  try {
    await ensureFreePlan(userId);
    const { subscription, usage } = await getUserPlanAndUsage(userId);

    const resetAt = usage?.period_reset_at ? new Date(usage.period_reset_at) : null;
    const now = new Date();
    const isNewMonth = resetAt && (
      now.getFullYear() > resetAt.getFullYear() ||
      now.getMonth() > resetAt.getMonth()
    );
    const used = isNewMonth ? 0 : (usage?.monthly_runs_used ?? 0);
    const limit = subscription?.monthly_test_limit ?? 5;

    return res.json({
      plan: {
        slug: subscription?.slug ?? 'free',
        name: subscription?.name ?? 'Free',
        modelTier: subscription?.ai_model_tier ?? 'free',
        monthlyLimit: limit,
      },
      usage: {
        used,
        limit,
        remaining: limit === null ? null : Math.max(0, limit - used),
        resetAt: isNewMonth ? now : resetAt,
      },
    });
  } catch (err) {
    log.error('subscriptionController', 'getMyPlan failed', err.message);
    return res.status(500).json({ error: 'Failed to fetch plan info' });
  }
};

// POST /api/subscription/create-order
export const createOrder = async (req, res) => {
  const userId = req.session.userId;
  const { planSlug } = req.body;

  if (!planSlug) {
    return res.status(400).json({ error: 'planSlug is required' });
  }

  try {
    // Get plan from DB
    const planResult = await pool.query(
      `SELECT * FROM subscription_plans WHERE slug = $1 AND is_active = TRUE`,
      [planSlug]
    );
    const plan = planResult.rows[0];

    if (!plan) {
      return res.status(404).json({ error: 'Plan not found' });
    }
    if (plan.price_paise === 0) {
      return res.status(400).json({ error: 'Free plan does not require payment' });
    }

    // Check if Razorpay keys are configured
    if (!process.env.RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID.includes('xxx')) {
      return res.status(503).json({ error: 'Payment gateway not configured yet. Coming soon.' });
    }
    const razorpay = getRazorpay();
    if (!razorpay) {
      return res.status(503).json({ error: 'Payment gateway not configured yet. Coming soon.' });
    }
    // Create Razorpay order
    const order = await razorpay.orders.create({
      amount: plan.price_paise,
      currency: plan.currency,
      receipt: `receipt_${userId}_${Date.now()}`,
      notes: {
        userId: String(userId),
        planSlug: plan.slug,
      },
    });

    // Save to payment_transactions
    await pool.query(`
      INSERT INTO payment_transactions
        (user_id, plan_id, razorpay_order_id, amount_paise, currency, status)
      VALUES ($1, $2, $3, $4, $5, 'created')
    `, [userId, plan.id, order.id, plan.price_paise, plan.currency]);

    log.success('subscriptionController', `Order created: ${order.id} for user ${userId}`);

    return res.json({
      orderId: order.id,
      amount: plan.price_paise,
      currency: plan.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
      planName: plan.name,
    });

  } catch (err) {
    log.error('subscriptionController', 'createOrder failed', err.message);
    return res.status(500).json({ error: 'Failed to create payment order' });
  }
};

// POST /api/subscription/verify-payment
export const verifyPayment = async (req, res) => {
  const userId = req.session.userId;
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, planSlug } = req.body;
  const razorpay = getRazorpay();
  if (!razorpay) {
    return res.status(503).json({ error: 'Payment gateway not configured yet. Coming soon.' });
  }
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !planSlug) {
    return res.status(400).json({ error: 'Missing payment verification fields' });
  }

  try {
    // Verify signature
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      log.warn('subscriptionController', `Invalid signature for order ${razorpay_order_id}`);

      // Mark transaction as failed
      await pool.query(`
        UPDATE payment_transactions
        SET status = 'failed', failure_reason = 'signature_mismatch', updated_at = NOW()
        WHERE razorpay_order_id = $1
      `, [razorpay_order_id]);

      return res.status(400).json({ error: 'Payment verification failed. Invalid signature.' });
    }

    // Get plan
    const planResult = await pool.query(
      `SELECT * FROM subscription_plans WHERE slug = $1`,
      [planSlug]
    );
    const plan = planResult.rows[0];
    if (!plan) return res.status(404).json({ error: 'Plan not found' });

    // Mark transaction as paid
    await pool.query(`
      UPDATE payment_transactions
      SET
        razorpay_payment_id = $1,
        razorpay_signature  = $2,
        status              = 'paid',
        updated_at          = NOW()
      WHERE razorpay_order_id = $3 AND user_id = $4
    `, [razorpay_payment_id, razorpay_signature, razorpay_order_id, userId]);

    // Upgrade user subscription
    const periodStart = new Date();
    const periodEnd = new Date();
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    await pool.query(`
      INSERT INTO user_subscriptions
        (user_id, plan_id, status, current_period_start, current_period_end)
      VALUES ($1, $2, 'active', $3, $4)
      ON CONFLICT (user_id) DO UPDATE
        SET plan_id              = EXCLUDED.plan_id,
            status               = 'active',
            current_period_start = EXCLUDED.current_period_start,
            current_period_end   = EXCLUDED.current_period_end,
            updated_at           = NOW()
    `, [userId, plan.id, periodStart, periodEnd]);

    // Reset usage for new plan period
    await pool.query(`
      UPDATE usage_tracking
      SET monthly_runs_used = 0,
          period_reset_at   = DATE_TRUNC('month', NOW()),
          updated_at        = NOW()
      WHERE user_id = $1
    `, [userId]);

    log.success('subscriptionController', `Payment verified, user ${userId} upgraded to ${planSlug}`);

    return res.json({
      success: true,
      message: `Successfully upgraded to ${plan.name}`,
      plan: {
        slug: plan.slug,
        name: plan.name,
        monthlyLimit: plan.monthly_test_limit,
      },
    });

  } catch (err) {
    log.error('subscriptionController', 'verifyPayment failed', err.message);
    return res.status(500).json({ error: 'Payment verification error' });
  }
};