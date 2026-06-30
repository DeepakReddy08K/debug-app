import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
import authRoutes from './routes/auth.js';
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import passport from './config/passport.js';
import './config/db.js';
import pool from './config/db.js';
import debugRoutes from './routes/debug.js';
import log from './config/logger.js';
import { generalLimiter } from './config/rateLimiter.js';
import chatRoutes from './routes/chat.js';
import historyRoutes from './routes/history.js';
import { errorHandler } from './middleware/errorHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
const PgSession = connectPgSimple(session);

// Allow frontend to talk to backend with credentials
app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true,
}));

// Parse incoming JSON
app.use(express.json());

// Session setup — stores sessions in PostgreSQL
app.use(session({
  store: new PgSession({
    pool,
    tableName: 'session',
    createTableIfMissing: true,
  }),
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  },
}));

// Initialize passport and session
app.use(passport.initialize());
app.use(passport.session());

// Apply general rate limiter to all routes
app.use(generalLimiter);

// Health check
app.get('/', (req, res) => {
  log.info('server', 'Health check hit');
  res.json({ message: 'Debug App API running' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/debug', debugRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/history', historyRoutes);

// Error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  log.success('server', `Server running on port ${PORT}`);
});