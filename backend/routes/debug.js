import express from 'express';
import { analyzeProblem, checkSyntax, generateTestCases } from '../controllers/debugController.js';
import { isAuthenticated } from '../middleware/authMiddleware.js';
import { aiLimiter } from '../config/rateLimiter.js';

const router = express.Router();

router.post('/analyze', isAuthenticated, aiLimiter, analyzeProblem);
router.post('/syntax', isAuthenticated, aiLimiter, checkSyntax);
router.post('/generate-tests', isAuthenticated, aiLimiter, generateTestCases);
export default router;