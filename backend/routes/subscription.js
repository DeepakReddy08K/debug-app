// backend/routes/subscription.js
import express from 'express';
import {
  getPlans,
  getMyPlan,
  createOrder,
  verifyPayment,
} from '../controllers/subscriptionController.js';
import { isAuthenticated } from '../middleware/authMiddleware.js';
import { aiLimiter, paymentLimiter } from '../config/rateLimiter.js';

const router = express.Router();

router.get('/plans',          aiLimiter,                            getPlans);
router.get('/me',             isAuthenticated, aiLimiter,           getMyPlan);
router.post('/create-order',  isAuthenticated, paymentLimiter,      createOrder);
router.post('/verify-payment',isAuthenticated, paymentLimiter,      verifyPayment);

export default router;