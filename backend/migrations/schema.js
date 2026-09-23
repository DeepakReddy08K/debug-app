// backend/migrations/schema.js
import pool from '../config/db.js';

const migrate = async () => {
  try {

    // ── Users (already exists, just add missing columns safely) ──
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS otp VARCHAR(6)`);
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS otp_expires TIMESTAMP`);
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS total_runs INTEGER DEFAULT 0`);
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token VARCHAR(255)`);
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token_expires TIMESTAMP`);
    console.log('✓ users columns ensured');

    // ── Runs (already exists, skip) ──
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
    console.log('✓ runs table ensured');

    // ── Test cases ──
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
    console.log('✓ test_cases table ensured');

    // ── Chat messages ──
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
    console.log('✓ chat_messages table ensured');

    // ── Subscription plans ──
    await pool.query(`
      CREATE TABLE IF NOT EXISTS subscription_plans (
        id SERIAL PRIMARY KEY,
        slug VARCHAR(30) UNIQUE NOT NULL,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        price_paise INTEGER NOT NULL DEFAULT 0,
        currency VARCHAR(10) NOT NULL DEFAULT 'INR',
        billing_period VARCHAR(20) NOT NULL DEFAULT 'monthly',
        monthly_test_limit INTEGER,
        ai_model_tier VARCHAR(20) NOT NULL DEFAULT 'free',
        razorpay_plan_id VARCHAR(100),
        is_active BOOLEAN DEFAULT TRUE,
        sort_order INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    await pool.query(`
      INSERT INTO subscription_plans
        (slug, name, description, price_paise, monthly_test_limit, ai_model_tier, sort_order)
      VALUES
        ('free',    'Free',    '5 free runs every month on free AI models',      0,     5,    'free',    0),
        ('pro',     'Pro',     '200 runs/month with premium AI models',      49900,   200,  'premium',   1),
        ('premium', 'Premium', 'Unlimited runs/month with premium AI models',99900,  NULL,  'premium',   2)
      ON CONFLICT (slug) DO UPDATE
        SET monthly_test_limit = EXCLUDED.monthly_test_limit,
            description        = EXCLUDED.description,
            updated_at         = NOW();
    `);
    console.log('✓ subscription_plans seeded');

    // ── User subscriptions ──
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_subscriptions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
        plan_id INTEGER NOT NULL REFERENCES subscription_plans(id),
        status VARCHAR(20) NOT NULL DEFAULT 'active',
        razorpay_customer_id VARCHAR(100),
        razorpay_subscription_id VARCHAR(100),
        current_period_start TIMESTAMP,
        current_period_end TIMESTAMP,
        cancel_at_period_end BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_user_subscriptions_razorpay
        ON user_subscriptions(razorpay_subscription_id);
    `);
    console.log('✓ user_subscriptions table created');

    // ── Payment transactions ──
    await pool.query(`
      CREATE TABLE IF NOT EXISTS payment_transactions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        plan_id INTEGER NOT NULL REFERENCES subscription_plans(id),
        razorpay_order_id VARCHAR(100) NOT NULL UNIQUE,
        razorpay_payment_id VARCHAR(100),
        razorpay_signature VARCHAR(255),
        amount_paise INTEGER NOT NULL,
        currency VARCHAR(10) NOT NULL DEFAULT 'INR',
        status VARCHAR(20) NOT NULL DEFAULT 'created',
        failure_reason TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_payment_transactions_user
        ON payment_transactions(user_id);
    `);
    console.log('✓ payment_transactions table created');

    // ── Usage tracking (one row per user, resets monthly) ──
    await pool.query(`
      CREATE TABLE IF NOT EXISTS usage_tracking (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
        monthly_runs_used INTEGER NOT NULL DEFAULT 0,
        period_reset_at TIMESTAMP NOT NULL DEFAULT DATE_TRUNC('month', NOW()),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✓ usage_tracking table created');

    // ── Usage events (audit log per run) ──
    await pool.query(`
      CREATE TABLE IF NOT EXISTS usage_events (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        plan_slug VARCHAR(30) NOT NULL,
        model_tier VARCHAR(20) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_usage_events_user
        ON usage_events(user_id, created_at DESC);
    `);
    console.log('✓ usage_events table created');

    // ── Webhook events (Razorpay idempotency) ──
    await pool.query(`
      CREATE TABLE IF NOT EXISTS webhook_events (
        id SERIAL PRIMARY KEY,
        razorpay_event_id VARCHAR(150) NOT NULL UNIQUE,
        event_type VARCHAR(100) NOT NULL,
        payload JSONB NOT NULL,
        processed_at TIMESTAMP,
        processing_error TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✓ webhook_events table created');

    console.log('\n✅ All migrations complete — existing data untouched');
    process.exit(0);

  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  }
};

// Fix usage_tracking column name if old schema was applied
await pool.query(`
  ALTER TABLE usage_tracking 
  RENAME COLUMN period_tests_used TO monthly_runs_used;
`).catch(() => {}); // ignore if already correct name

await pool.query(`
  ALTER TABLE usage_tracking
  ADD COLUMN IF NOT EXISTS monthly_runs_used INTEGER NOT NULL DEFAULT 0;
`).catch(() => {});

// Remove old column if exists
await pool.query(`
  ALTER TABLE usage_tracking
  DROP COLUMN IF EXISTS lifetime_free_tests_used;
`).catch(() => {});

await pool.query(`
  ALTER TABLE usage_tracking
  DROP COLUMN IF EXISTS period_tests_used;
`).catch(() => {});

console.log('✓ usage_tracking columns fixed');

migrate();