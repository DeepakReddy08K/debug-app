import log from '../config/logger.js';
//To handle any terminal or server crahses safely and give user a clean response
export const errorHandler = (err, req, res, next) => {
  log.error('server', 'Unhandled error caught by global handler', err.message || err);
  
  // Handle specific known error types
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Invalid JSON in request body.' });
  }

  if (err.code === 'ECONNREFUSED') {
    return res.status(503).json({ error: 'Database connection failed. Please try again.' });
  }

  res.status(err.status || 500).json({
    error: err.message || 'Something went wrong. Please try again.',
  });
};