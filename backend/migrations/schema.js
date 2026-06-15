import pool from '../config/db.js';

const migrate = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255),
        is_verified BOOLEAN DEFAULT FALSE,
        verification_token VARCHAR(255),
        google_id VARCHAR(255),
        avatar_url TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✓ users table created');
      await pool.query(`
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS otp VARCHAR(6),
        ADD COLUMN IF NOT EXISTS otp_expires TIMESTAMP;
      `);
console.log('✓ OTP columns added to users table');
await pool.query(`
  ALTER TABLE users
  ADD COLUMN IF NOT EXISTS total_runs INTEGER DEFAULT 0;
`);
console.log('✓ total_runs column added to users table');

// Runs table
await pool.query(`
  CREATE TABLE IF NOT EXISTS runs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    buggy_code TEXT NOT NULL,
    correct_code TEXT NOT NULL,
    language VARCHAR(20) NOT NULL,
    is_class_based BOOLEAN DEFAULT FALSE,
    constraints_json JSONB,
    syntax_check JSONB,
    ai_diagnosis JSONB,
    ai_model_used VARCHAR(100),
    failing_input TEXT,
    output_buggy TEXT,
    output_correct TEXT,
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW()
  );
`);
console.log('✓ runs table created');

// Test cases table
await pool.query(`
  CREATE TABLE IF NOT EXISTS test_cases (
    id SERIAL PRIMARY KEY,
    run_id INTEGER REFERENCES runs(id) ON DELETE CASCADE,
    input_data TEXT NOT NULL,
    output_buggy TEXT,
    output_correct TEXT,
    is_failing BOOLEAN DEFAULT FALSE,
    batch_number INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT NOW()
  );
`);
console.log('✓ test_cases table created');

// Chat messages table
await pool.query(`
  CREATE TABLE IF NOT EXISTS chat_messages (
    id SERIAL PRIMARY KEY,
    run_id INTEGER REFERENCES runs(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(10) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
  );
`);
console.log('✓ chat_messages table created');

    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  }
};

migrate();