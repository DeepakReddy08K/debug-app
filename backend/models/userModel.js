import pool from '../config/db.js';
import log from '../config/logger.js';

// Create a new user (traditional registration)
export const createUser = async (name, email, hashedPassword, verificationToken) => {
  log.step('userModel', '1', `Creating user: ${email}`);
  const result = await pool.query(
    `INSERT INTO users (name, email, password, verification_token)
     VALUES ($1, $2, $3, $4) RETURNING id, name, email, is_verified`,
    [name, email, hashedPassword, verificationToken]
  );
  return result.rows[0];
};

// Find user by email
export const findByEmail = async (email) => {
  log.step('userModel', '2', `Finding user by email: ${email}`);
  const result = await pool.query(
    `SELECT * FROM users WHERE email = $1`,
    [email]
  );
  return result.rows[0] || null;
};

// Find user by ID
export const findById = async (id) => {
  log.step('userModel', '3', `Finding user by id: ${id}`);
  const result = await pool.query(
    `SELECT id, name, email, is_verified, avatar_url FROM users WHERE id = $1`,
    [id]
  );
  return result.rows[0] || null;
};
// Delete unverified user if they decline
export const deleteUnverifiedUser = async (token) => {
  log.step('userModel', '6', 'Deleting unverified user');
  const result = await pool.query(
    `DELETE FROM users WHERE verification_token = $1 AND is_verified = FALSE RETURNING email`,
    [token]
  );
  return result.rows[0] || null;
};
// Verify user email using token
export const verifyUserEmail = async (token) => {
  log.step('userModel', '4', 'Verifying email token');
  const result = await pool.query(
    `UPDATE users SET is_verified = TRUE, verification_token = NULL
     WHERE verification_token = $1 RETURNING id, email`,
    [token]
  );
  return result.rows[0] || null;
};

// Find or create Google OAuth user
export const findOrCreateGoogleUser = async (googleId, email, name, avatarUrl) => {
  log.step('userModel', '5', `Google OAuth user: ${email}`);
  
  // Check if user exists by google_id or email
  const existing = await pool.query(
    `SELECT * FROM users WHERE google_id = $1 OR email = $2`,
    [googleId, email]
  );

  if (existing.rows[0]) {
    // Update google_id if user registered traditionally before
    await pool.query(
      `UPDATE users SET google_id = $1, avatar_url = $2 WHERE email = $3`,
      [googleId, avatarUrl, email]
    );
    return existing.rows[0];
  }

  // Create new Google user (no password, already verified)
  const result = await pool.query(
    `INSERT INTO users (name, email, google_id, avatar_url, is_verified)
     VALUES ($1, $2, $3, $4, TRUE) RETURNING id, name, email, is_verified`,
    [name, email, googleId, avatarUrl]
  );
  return result.rows[0];
};