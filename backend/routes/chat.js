import express from 'express';
import { chatAboutRun } from '../controllers/debugController.js';
import { isAuthenticated } from '../middleware/authMiddleware.js';
import { chatLimiter } from '../config/rateLimiter.js';

const router=express.Router();

router.post('/', isAuthenticated, chatLimiter, chatAboutRun);

export default router;