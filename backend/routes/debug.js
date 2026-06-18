import express from 'express';
import { analyzeProblem, checkSyntax, generateTestCases, executeTestCases, diagnoseBug, runFullPipeline, runSingleTest} from '../controllers/debugController.js';
import { isAuthenticated } from '../middleware/authMiddleware.js';
import { aiLimiter, executionLimiter  } from '../config/rateLimiter.js';

const router = express.Router();

router.post('/analyze',isAuthenticated, aiLimiter, analyzeProblem);
router.post('/syntax',isAuthenticated, aiLimiter, checkSyntax);
router.post('/generate-tests',isAuthenticated, aiLimiter, generateTestCases);
router.post('/execute',isAuthenticated, executionLimiter, executeTestCases);
router.post('/diagnose',isAuthenticated, aiLimiter, diagnoseBug);
router.post('/run',isAuthenticated, executionLimiter, runFullPipeline);
router.post('/run-single',isAuthenticated, executionLimiter, runSingleTest);
export default router;