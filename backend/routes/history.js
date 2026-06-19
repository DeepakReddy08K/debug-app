import express from 'express';
import { getHistory, getRunDetail } from '../controllers/historyController.js';
import { isAuthenticated } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', isAuthenticated, getHistory);
router.get('/:runId', isAuthenticated, getRunDetail);

export default router;