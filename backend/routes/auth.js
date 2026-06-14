import express from 'express';
import passport from '../config/passport.js';
import { register, login, logout, verifyEmail,declineEmail, googleCallback, getMe } from '../controllers/authController.js';
import { authLimiter } from '../config/rateLimiter.js';
import { isAuthenticated } from '../middleware/authMiddleware.js';

const router = express.Router();

// Traditional auth routes — protected by authLimiter
router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/logout', isAuthenticated, logout);
router.get('/verify/:token', verifyEmail);
router.get('/decline/:token', declineEmail);
// Get current logged in user — protected route
router.get('/me', isAuthenticated, getMe);

// Google OAuth routes
router.get('/google', passport.authenticate('google', {
  scope: ['profile', 'email'], // request profile and email from Google
}));

router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: '/login?error=google_failed' }),
  googleCallback
);

export default router;