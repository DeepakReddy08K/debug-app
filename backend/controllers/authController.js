import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { createUser, findByEmail, verifyUserEmail, deleteUnverifiedUser, findById } from '../models/userModel.js';
import log from '../config/logger.js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Nodemailer transporter — uses Gmail SMTP
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

// Verify transporter on startup
transporter.verify((err, success) => {
  if (err) log.error('nodemailer', 'Mail transporter failed', err);
  else log.success('nodemailer', 'Mail transporter ready');
});
// Register new user with email and password
export const register = async (req, res) => {
  log.step('authController', '1', 'Register request received');
  const { name, email, password } = req.body;

  try {
    // Validate fields
    if (!name || !email || !password) {
      log.warn('authController', 'Missing fields in register');
      return res.status(400).json({ error: 'All fields are required.' });
    }

    if (password.length < 6) {
      log.warn('authController', 'Password too short');
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    // Check if email already exists
    log.step('authController', '2', 'Checking if email exists');
    const existingUser = await findByEmail(email);
    if (existingUser) {
      log.warn('authController', `Email already registered: ${email}`);
      return res.status(409).json({ error: 'Email already registered.' });
    }

    // Hash password
    log.step('authController', '3', 'Hashing password');
    const hashedPassword = await bcrypt.hash(password, 12);

    // Generate verification token
    log.step('authController', '4', 'Generating verification token');
    const verificationToken = crypto.randomBytes(32).toString('hex');

    // Save user to DB
    log.step('authController', '5', 'Saving user to DB');
    const user = await createUser(name, email, hashedPassword, verificationToken);

    // Send verification email
    log.step('authController', '6', 'Sending verification email');
    const verifyUrl = `${process.env.APP_URL}/api/auth/verify/${verificationToken}`;
    await transporter.sendMail({
      from: `"Debug App" <${process.env.MAIL_USER}>`,
      to: email,
      subject: 'Verify your Debug App account',
      html: `
  <!DOCTYPE html>
  <html>
    <body style="font-family: Arial, sans-serif; background: #f4f4f4; padding: 30px;">
      <div style="max-width: 500px; margin: auto; background: white; border-radius: 10px; padding: 30px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        
        <h2 style="color: #1a1a1a;">Welcome to Debug App, ${name}! 👋</h2>
        <p style="color: #555;">Thanks for registering. Please verify your email address to activate your account.</p>
        
        <div style="background: #f9f9f9; border-radius: 8px; padding: 15px; margin: 20px 0;">
          <p style="margin: 0; color: #333;"><strong>Email:</strong> ${email}</p>
        </div>

        <p style="color: #555;">Click <strong>Accept</strong> to verify your account or <strong>Decline</strong> to cancel registration.</p>

        <div style="text-align: center; margin: 30px 0; display: flex; flex-direction: column; align-items: center; gap: 15px;">
  <a href="${verifyUrl}" 
    style="background: #22c55e; color: white; padding: 12px 0; border-radius: 6px; text-decoration: none; font-weight: bold; width: 80%; display: block; text-align: center;">
    ✅ Accept
  </a>
  <a href="${process.env.APP_URL}/api/auth/decline/${verificationToken}" 
    style="background: #ef4444; color: white; padding: 12px 0; border-radius: 6px; text-decoration: none; font-weight: bold; width: 80%; display: block; text-align: center;">
    ❌ Decline
  </a>
</div>

        <p style="color: #999; font-size: 12px; text-align: center;">This link expires in 24 hours. If you didn't register, ignore this email.</p>
      </div>
    </body>
  </html>
`,
    });

    log.success('authController', `User registered: ${email}`);
    res.status(201).json({
      message: 'Registration successful. Please check your email to verify your account.',
    });

  } catch (err) {
    log.error('authController', 'Register failed', err);
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
};
// Verify email using token from email link
export const verifyEmail = async (req, res) => {
  log.step('authController', '1', 'Email verification request received');
  const { token } = req.params;

  try {
    if (!token) {
      log.warn('authController', 'No token provided');
      return res.status(400).json({ error: 'Invalid verification link.' });
    }

    // Find user by token and mark as verified
    log.step('authController', '2', 'Verifying token in DB');
    const user = await verifyUserEmail(token);
    if (!user) {
      log.warn('authController', 'Invalid or expired token');
      return res.status(400).json({ error: 'Invalid or expired verification link.' });
    }

    log.success('authController', `Email verified for: ${user.email}`);
    // Redirect to frontend login page after verification
    res.redirect(`${process.env.CLIENT_URL}/login?verified=true`);

  } catch (err) {
    log.error('authController', 'Email verification failed', err);
    res.status(500).json({ error: 'Verification failed. Please try again.' });
  }
};

// Login with email and password
export const login = async (req, res) => {
  log.step('authController', '1', 'Login request received');
  const { email, password } = req.body;

  try {
    // Validate fields
    if (!email || !password) {
      log.warn('authController', 'Missing fields in login');
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    // Find user by email
    log.step('authController', '2', `Finding user: ${email}`);
    const user = await findByEmail(email);
    if (!user) {
      log.warn('authController', `User not found: ${email}`);
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Check if user registered via Google — no password set
    if (!user.password) {
      log.warn('authController', 'Google user tried traditional login');
      return res.status(401).json({ error: 'This account uses Google login. Please sign in with Google.' });
    }

    // Check if email is verified
    if (!user.is_verified) {
      log.warn('authController', `Unverified login attempt: ${email}`);
      return res.status(403).json({ error: 'Please verify your email before logging in.' });
    }

    // Compare password
    log.step('authController', '3', 'Comparing password');
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      log.warn('authController', `Wrong password for: ${email}`);
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Create session
    log.step('authController', '4', 'Creating session');
    req.session.userId = user.id;
    req.session.email = user.email;

    log.success('authController', `User logged in: ${email}`);
    res.status(200).json({
      message: 'Login successful.',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar_url: user.avatar_url,
      },
    });

  } catch (err) {
    log.error('authController', 'Login failed', err);
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
};
// Logout — destroy session and clear cookie
export const logout = async (req, res) => {
  log.step('authController', '1', 'Logout request received');

  try {
    req.session.destroy((err) => {
      if (err) {
        log.error('authController', 'Session destroy failed', err);
        return res.status(500).json({ error: 'Logout failed. Please try again.' });
      }
      res.clearCookie('connect.sid'); // default session cookie name
      log.success('authController', 'User logged out successfully');
      res.status(200).json({ message: 'Logged out successfully.' });
    });
  } catch (err) {
    log.error('authController', 'Logout failed', err);
    res.status(500).json({ error: 'Logout failed. Please try again.' });
  }
};

// Google OAuth callback — called after Google redirects back
export const googleCallback = async (req, res) => {
  log.step('authController', '1', 'Google OAuth callback received');

  try {
    // Passport already handled user creation via passport.js strategy
    // req.user is set by passport deserializeUser
    if (!req.user) {
      log.warn('authController', 'No user from Google OAuth');
      return res.redirect(`${process.env.CLIENT_URL}/login?error=google_failed`);
    }

    // Create session for Google user
    req.session.userId = req.user.id;
    req.session.email = req.user.email;

    log.success('authController', `Google user session created: ${req.user.email}`);
    res.redirect(`${process.env.CLIENT_URL}/dashboard?login=success`);

  } catch (err) {
    log.error('authController', 'Google callback failed', err);
    res.redirect(`${process.env.CLIENT_URL}/login?error=google_failed`);
  }
};

// Get current logged in user from session
export const getMe = async (req, res) => {
  log.step('authController', '1', 'getMe request received');
  try {
    // Get user from session userId instead of req.user
    const user = await findById(req.session.userId);
    if (!user) {
      log.warn('authController', 'User not found in getMe');
      return res.status(404).json({ error: 'User not found.' });
    }
    log.success('authController', `getMe success: ${user.email}`);
    res.status(200).json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar_url: user.avatar_url,
      },
    });
  } catch (err) {
    log.error('authController', 'getMe failed', err);
    res.status(500).json({ error: 'Failed to get user.' });
  }
};

// Decline — delete unverified user
export const declineEmail = async (req, res) => {
  log.step('authController', '1', 'Decline request received');
  const { token } = req.params;
  try {
    const user = await deleteUnverifiedUser(token);
    if (!user) {
      log.warn('authController', 'Invalid decline token');
      return res.status(400).json({ error: 'Invalid or expired link.' });
    }
    log.success('authController', `User declined and deleted: ${user.email}`);
    res.redirect(`${process.env.CLIENT_URL}/login?declined=true`);
  } catch (err) {
    log.error('authController', 'Decline failed', err);
    res.status(500).json({ error: 'Something went wrong.' });
  }
};