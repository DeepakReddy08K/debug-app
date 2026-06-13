// Rate limiting

import rateLimit from 'express-rate-limit';

// General API — applied to all routes in server.js
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,                  // 100 requests per IP per 15 min
  message: { error: 'Too many requests, slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Auth routes 
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,                   // only 10 auth attempts per IP per 15 min
  message: { error: 'Too many auth attempts, try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// AI routes 
export const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,                   // 20 AI requests per IP per hour
  message: { error: 'AI rate limit reached. Try again in an hour.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Judge0 execution 
export const executionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 200,
  message: { error: 'Execution limit reached. Try again in an hour.' },
  standardHeaders: true,
  legacyHeaders: false,
});