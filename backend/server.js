// Entry point — sets up express, applies middleware, mounts routes, starts server

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import './config/db.js'; 
import log from './config/logger.js';
import { generalLimiter } from './config/rateLimiter.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();

// Allow frontend to talk to backend
app.use(cors());

// Parse incoming JSON request bodies
app.use(express.json());

// Apply general rate limiter to all routes
app.use(generalLimiter);

// Health check route
app.get('/', (req, res) => {
  log.info('server', 'Health check hit');
  res.json({ message: 'Debug App API running' });
});
// Routes will be mounted here as we build them
// app.use('/api/auth', authRoutes);
// app.use('/api/debug', debugRoutes);
// app.use('/api/chat', chatRoutes);
// app.use('/api/history', historyRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  log.success('server', `Server running on port ${PORT}`);
});