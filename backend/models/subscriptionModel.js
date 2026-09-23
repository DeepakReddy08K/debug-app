// backend/models/subscriptionModel.js
import pool from '../config/db.js';

const FREE_PLAN_SLUG = 'free';

// ── Get user's current plan + usage ─────────────────────────────────────────
export const getUserPlanAndUsage = async (userId) => {
  // Get subscription (join with plan)
  const subResult = await pool.query(`
    SELECT
      us.id AS subscription_id,
      us.status,
      us.current_period_end,
      sp.slug,
      sp.name,
      sp.monthly_test_limit,
      sp.ai_model_tier
    FROM user_subscriptions us
    JOIN subscription_plans sp ON sp.id = us.plan_id
    WHERE us.user_id = $1
  `, [userId]);

  // Get usage tracking row
  const usageResult = await pool.query(`
    SELECT monthly_runs_used, period_reset_at
    FROM usage_tracking
    WHERE user_id = $1
  `, [userId]);

  return {
    subscription: subResult.rows[0] || null,
    usage: usageResult.rows[0] || null,
  };
};

// ── Ensure user has a free plan row (called on first run) ───────────────────
export const ensureFreePlan = async (userId) => {
  // Get free plan id
  const planResult = await pool.query(`
    SELECT id FROM subscription_plans WHERE slug = $1
  `, [FREE_PLAN_SLUG]);

  const freePlanId = planResult.rows[0]?.id;
  if (!freePlanId) throw new Error('Free plan not found in DB — run migrations');

  // Insert subscription row if not exists
  await pool.query(`
    INSERT INTO user_subscriptions (user_id, plan_id, status)
    VALUES ($1, $2, 'active')
    ON CONFLICT (user_id) DO NOTHING
  `, [userId, freePlanId]);

  // Insert usage tracking row if not exists
  await pool.query(`
    INSERT INTO usage_tracking (user_id, monthly_runs_used, period_reset_at)
    VALUES ($1, 0, DATE_TRUNC('month', NOW()))
    ON CONFLICT (user_id) DO NOTHING
  `, [userId]);
};

// ── Check quota: returns { allowed, reason, planSlug, modelTier } ────────────
export const checkQuota = async (userId) => {
  const { subscription, usage } = await getUserPlanAndUsage(userId);

  // No subscription row yet → treat as free
  if (!subscription) {
    await ensureFreePlan(userId);
    const fresh = await getUserPlanAndUsage(userId);
    return _evaluate(fresh.subscription, fresh.usage);
  }

  return _evaluate(subscription, usage);
};

const _evaluate = (subscription, usage) => {
  const slug = subscription.slug;
  const limit = subscription.monthly_test_limit; // NULL = unlimited
  const used = usage?.monthly_runs_used ?? 0;

  // Check if period needs reset (new month)
  const resetAt = usage?.period_reset_at ? new Date(usage.period_reset_at) : null;
  const now = new Date();
  const needsReset = resetAt && (
    now.getFullYear() > resetAt.getFullYear() ||
    now.getMonth() > resetAt.getMonth()
  );

  // Unlimited plan
  if (limit === null) {
    return { allowed: true, reason: null, planSlug: slug, modelTier: subscription.ai_model_tier, needsReset };
  }

  // Within limit (accounting for pending reset)
  const effectiveUsed = needsReset ? 0 : used;
  if (effectiveUsed < limit) {
    return { allowed: true, reason: null, planSlug: slug, modelTier: subscription.ai_model_tier, needsReset, effectiveUsed, limit };
  }

  // Limit hit
  return {
    allowed: false,
    reason: slug === 'free'
      ? `You've used all ${limit} free runs this month. Upgrade to Pro for more.`
      : `Monthly limit of ${limit} runs reached. Upgrade to Premium for unlimited.`,
    planSlug: slug,
    modelTier: subscription.ai_model_tier,
    needsReset: false,
    effectiveUsed: used,
    limit,
  };
};

// ── Increment usage after a successful run ───────────────────────────────────
export const incrementUsage = async (userId, planSlug, modelTier) => {
  // Reset period if new month
  await pool.query(`
    UPDATE usage_tracking
    SET
      monthly_runs_used = CASE
        WHEN DATE_TRUNC('month', period_reset_at) < DATE_TRUNC('month', NOW())
        THEN 1
        ELSE monthly_runs_used + 1
      END,
      period_reset_at = CASE
        WHEN DATE_TRUNC('month', period_reset_at) < DATE_TRUNC('month', NOW())
        THEN DATE_TRUNC('month', NOW())
        ELSE period_reset_at
      END,
      updated_at = NOW()
    WHERE user_id = $1
  `, [userId]);

  // Audit log
  await pool.query(`
    INSERT INTO usage_events (user_id, plan_slug, model_tier)
    VALUES ($1, $2, $3)
  `, [userId, planSlug, modelTier]);
};

// ── Get all plans (for pricing page) ────────────────────────────────────────
export const getAllPlans = async () => {
  const result = await pool.query(`
    SELECT slug, name, description, price_paise, currency,
           billing_period, monthly_test_limit, ai_model_tier, sort_order
    FROM subscription_plans
    WHERE is_active = TRUE
    ORDER BY sort_order ASC
  `);
  return result.rows;
};