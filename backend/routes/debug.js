import express from 'express';
import { analyzeProblem } from '../controllers/debugController.js';
import { isAuthenticated } from '../middleware/authMiddleware.js';
import { aiLimiter } from '../config/rateLimiter.js';

const router = express.Router();

router.post('/analyze', isAuthenticated, aiLimiter, analyzeProblem);

export default router;