// backend/middleware/usageMiddleware.js
import { checkQuota, ensureFreePlan } from '../models/subscriptionModel.js';
import log from '../config/logger.js';

export const checkUsageLimit = async (req, res, next) => {
  const userId = req.session.userId;

  try {
    // Ensure user has a plan row (handles brand new users)
    await ensureFreePlan(userId);

    const { allowed, reason, planSlug, modelTier, needsReset, effectiveUsed, limit } = await checkQuota(userId);

    if (!allowed) {
      log.warn('usageMiddleware', `User ${userId} hit quota — plan: ${planSlug}`);
      return res.status(429).json({
        error: 'quota_exceeded',
        message: reason,
        planSlug,
        limit,
        used: effectiveUsed,
      });
    }

    // Attach to request so debugController can read it after run completes
    req.usageMeta = { planSlug, modelTier };

    log.success('usageMiddleware', `User ${userId} quota OK — plan: ${planSlug}, used: ${effectiveUsed ?? 0}/${limit ?? '∞'}`);
    next();

  } catch (err) {
    log.error('usageMiddleware', 'Quota check failed', err.message);
    return res.status(500).json({ error: 'Failed to check usage quota' });
  }
};