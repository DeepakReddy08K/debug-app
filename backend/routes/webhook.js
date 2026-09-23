// backend/routes/webhook.js
import express from 'express';
import { handleRazorpayWebhook } from '../controllers/webhookController.js';

const router = express.Router();

// No auth, no rate limiter — Razorpay calls this directly
// Signature verification inside controller handles security
router.post('/razorpay', handleRazorpayWebhook);

export default router;