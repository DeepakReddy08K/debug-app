// Rate limiting — prevents abuse and reduces load on AI and Judge0 services

import { rateLimit, ipKeyGenerator } from 'express-rate-limit';
import log from './logger.js';

// General API — applied to all routes in server.js
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    log.warn('rateLimiter', `General limit exceeded: ${req.ip}`);
    res.status(429).json({ error: 'Too many requests, slow down.' });
  },
});

// Auth routes — prevents brute force
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    log.warn('rateLimiter', `Auth limit exceeded: ${req.ip}`);
    res.status(429).json({ error: 'Too many auth attempts, try again later.' });
  },
});

// AI routes — expensive, limit heavily
export const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    log.warn('rateLimiter', `AI limit exceeded: ${req.ip}`);
    res.status(429).json({ error: 'AI rate limit reached. Try again in an hour.' });
  },
});

// Judge0 execution — high limit because each run makes many calls
export const executionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    log.warn('rateLimiter', `Execution limit exceeded: ${req.ip}`);
    res.status(429).json({ error: 'Execution limit reached. Try again in an hour.' });
  },
});

//ai chat limiter
export const chatLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 15,
  message: 'Too many chat messages. Please wait before sending more.',
  handler: (req, res) => {
    log.warn('rateLimiter', 'Chat limiter hit', `IP: ${req.ip}`);
    res.status(429).json({ error: 'Too many chat messages. Please wait an hour before sending more.' });
  },
  keyGenerator: (req) => ipKeyGenerator(req.ip),
});