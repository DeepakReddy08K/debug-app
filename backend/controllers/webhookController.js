// backend/controllers/webhookController.js
import crypto from 'crypto';
import pool from '../config/db.js';
import log from '../config/logger.js';

// Verify Razorpay webhook signature
const verifyWebhookSignature = (rawBody, signature) => {
  const expected = crypto
    .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
    .update(rawBody)
    .digest('hex');
  return expected === signature;
};

// POST /api/webhook/razorpay
export const handleRazorpayWebhook = async (req, res) => {
  const signature = req.headers['x-razorpay-signature'];
  const rawBody = req.rawBody;

  // Verify signature
  if (!verifyWebhookSignature(rawBody, signature)) {
    log.warn('webhookController', 'Invalid webhook signature');
    return res.status(400).json({ error: 'Invalid signature' });
  }

  const event = req.body;
  const eventId = event.id;
  const eventType = event.event;

  try {
    // Idempotency check — ignore already processed events
    const existing = await pool.query(
      `SELECT id FROM webhook_events WHERE razorpay_event_id = $1`,
      [eventId]
    );
    if (existing.rows[0]) {
      log.warn('webhookController', `Duplicate event ignored: ${eventId}`);
      return res.json({ status: 'already_processed' });
    }

    // Save event first (audit trail)
    await pool.query(`
      INSERT INTO webhook_events (razorpay_event_id, event_type, payload)
      VALUES ($1, $2, $3)
    `, [eventId, eventType, JSON.stringify(event)]);

    // Handle event types
    switch (eventType) {

      case 'payment.captured': {
        const payment = event.payload.payment.entity;
        const orderId = payment.order_id;

        // Mark transaction paid
        await pool.query(`
          UPDATE payment_transactions
          SET
            razorpay_payment_id = $1,
            status              = 'paid',
            updated_at          = NOW()
          WHERE razorpay_order_id = $2
        `, [payment.id, orderId]);

        log.success('webhookController', `payment.captured: ${payment.id}`);
        break;
      }

      case 'subscription.activated': {
        const sub = event.payload.subscription.entity;
        const razorpaySubId = sub.id;
        const customerId = sub.customer_id;

        // Find user by razorpay_subscription_id or customer_id
        const userResult = await pool.query(`
          SELECT user_id FROM user_subscriptions
          WHERE razorpay_subscription_id = $1
             OR razorpay_customer_id = $2
          LIMIT 1
        `, [razorpaySubId, customerId]);

        if (userResult.rows[0]) {
          const userId = userResult.rows[0].user_id;
          await pool.query(`
            UPDATE user_subscriptions
            SET status    = 'active',
                updated_at = NOW()
            WHERE user_id = $1
          `, [userId]);
          log.success('webhookController', `subscription.activated for user ${userId}`);
        }
        break;
      }

      case 'subscription.cancelled': {
        const sub = event.payload.subscription.entity;
        const razorpaySubId = sub.id;

        // Downgrade user to free plan
        const freePlan = await pool.query(
          `SELECT id FROM subscription_plans WHERE slug = 'free'`
        );
        const freePlanId = freePlan.rows[0]?.id;

        if (freePlanId) {
          await pool.query(`
            UPDATE user_subscriptions
            SET plan_id    = $1,
                status     = 'cancelled',
                updated_at = NOW()
            WHERE razorpay_subscription_id = $2
          `, [freePlanId, razorpaySubId]);
          log.success('webhookController', `subscription.cancelled: ${razorpaySubId} — downgraded to free`);
        }
        break;
      }

      case 'payment.failed': {
        const payment = event.payload.payment.entity;
        const orderId = payment.order_id;

        await pool.query(`
          UPDATE payment_transactions
          SET status         = 'failed',
              failure_reason = $1,
              updated_at     = NOW()
          WHERE razorpay_order_id = $2
        `, [payment.error_description || 'payment_failed', orderId]);

        log.warn('webhookController', `payment.failed: order ${orderId}`);
        break;
      }

      default:
        log.warn('webhookController', `Unhandled event type: ${eventType}`);
    }

    // Mark event as processed
    await pool.query(`
      UPDATE webhook_events
      SET processed_at = NOW()
      WHERE razorpay_event_id = $1
    `, [eventId]);

    return res.json({ status: 'ok' });

  } catch (err) {
    log.error('webhookController', `Webhook processing failed: ${err.message}`);

    // Save error against event
    await pool.query(`
      UPDATE webhook_events
      SET processing_error = $1
      WHERE razorpay_event_id = $2
    `, [err.message, eventId]).catch(() => {});

    return res.status(500).json({ error: 'Webhook processing failed' });
  }
};