import log from '../config/logger.js';

// Middleware to check if user is authenticated via session
export const isAuthenticated = (req, res, next) => {
  log.step('authMiddleware', '1', 'Checking session authentication');

  if (req.session && req.session.userId) {
    log.success('authMiddleware', `User ${req.session.userId} authenticated`);
    next();
  } else {
    log.warn('authMiddleware', 'Unauthenticated request blocked');
    res.status(401).json({ error: 'You must be logged in to access this.' });
  }
};