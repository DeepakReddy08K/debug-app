// Database configuration — creates a connection pool to PostgreSQL
// Pool manages multiple connections automatically, better than single Client for web apps

import pg from 'pg';
import dotenv from 'dotenv';
import log from './logger.js';

// Load environment variables from .env file
dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,   
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME, 
});

pool.connect()
  .then(() => log.success('db', 'PostgreSQL connected successfully'))
  .catch(err => log.error('db', 'PostgreSQL connection failed', err));

export default pool;