import pool from '../config/db.js';
import log from '../config/logger.js';
import crypto from 'crypto';


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
  await pool.query(
    `UPDATE users SET google_id = $1, avatar_url = $2, is_verified = TRUE WHERE email = $3`,
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

// Find user by ID
export const findById = async (id) => {
  log.step('userModel', '3', `Finding user by id: ${id}`);
  const result = await pool.query(
    `SELECT id, name, email, is_verified, avatar_url FROM users WHERE id = $1`,
    [id]
  );
  return result.rows[0] || null;
};

// Save OTP and expiry to user
export const saveOTP = async (email, otp) => {
  log.step('userModel', '7', `Saving OTP for: ${email}`);
  const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  const result = await pool.query(
    `UPDATE users SET otp = $1, otp_expires = $2 WHERE email = $3 RETURNING id, email`,
    [otp, otpExpires, email]
  );
  return result.rows[0] || null;
};

// Verify OTP and clear it
// Verify OTP, clear it, and issue a one-time reset token
export const verifyOTP = async (email, otp) => {
  log.step('userModel', '8', `Verifying OTP for: ${email}`);
  const result = await pool.query(
    `SELECT * FROM users WHERE email = $1 AND otp = $2 AND otp_expires > NOW()`,
    [email, otp]
  );
  if (!result.rows[0]) return null;

  // Generate one-time reset token valid for 10 minutes
  const resetToken = crypto.randomBytes(32).toString('hex');
  const resetTokenExpires = new Date(Date.now() + 10 * 60 * 1000);

  await pool.query(
    `UPDATE users SET otp = NULL, otp_expires = NULL, reset_token = $1, reset_token_expires = $2 WHERE email = $3`,
    [resetToken, resetTokenExpires, email]
  );
  return { id: result.rows[0].id, email: result.rows[0].email, resetToken };
};

// Update password
export const updatePassword = async (email, hashedPassword) => {
  log.step('userModel', '9', `Updating password for: ${email}`);
  const result = await pool.query(
    `UPDATE users SET password = $1 WHERE email = $2 RETURNING id, email`,
    [hashedPassword, email]
  );
  return result.rows[0] || null;
};

// Verify reset token and clear it (used right before password update)
export const verifyResetToken = async (email, resetToken) => {
  log.step('userModel', '10', `Verifying reset token for: ${email}`);
  const result = await pool.query(
    `SELECT * FROM users WHERE email = $1 AND reset_token = $2 AND reset_token_expires > NOW()`,
    [email, resetToken]
  );
  return result.rows[0] || null;
};

// Clear reset token after successful password update
export const clearResetToken = async (email) => {
  log.step('userModel', '11', `Clearing reset token for: ${email}`);
  await pool.query(
    `UPDATE users SET reset_token = NULL, reset_token_expires = NULL WHERE email = $1`,
    [email]
  );
};


