//First started with local postgress but during deployment we need a live servar so used neon database for further tasks
//we need to configure SSL for neon cunnection this makes data transfer from neon and backend server encrypted and neon fails to connect without ssl configuration

import pg from 'pg';
import dotenv from 'dotenv';
import log from './logger.js';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: { rejectUnauthorized: false }//required for neon cloud postgress
});

pool.connect()
  .then(() => log.success('db', 'PostgreSQL connected successfully'))
  .catch(err => log.error('db', 'PostgreSQL connection failed', err));

export default pool;