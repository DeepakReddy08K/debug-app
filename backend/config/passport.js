import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { findOrCreateGoogleUser, findById } from '../models/userModel.js';
import log from './logger.js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Store user id in session
passport.serializeUser((user, done) => {
  log.step('passport', '1', `Serializing user: ${user.id}`);
  done(null, user.id);
});

// Retrieve user from session using id
passport.deserializeUser(async (id, done) => {
  log.step('passport', '2', `Deserializing user: ${id}`);
  try {
    const user = await findById(id);
    done(null, user);
  } catch (err) {
    log.error('passport', 'Deserialize failed', err);
    done(err, null);
  }
});

// Google OAuth strategy
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: process.env.GOOGLE_CALLBACK_URL,
}, async (accessToken, refreshToken, profile, done) => {
  log.step('passport', '3', `Google OAuth callback for: ${profile.emails[0].value}`);
  try {
    const user = await findOrCreateGoogleUser(
      profile.id,
      profile.emails[0].value,
      profile.displayName,
      profile.photos[0]?.value || null
    );
    log.success('passport', `Google user authenticated: ${user.email}`);
    done(null, user);
  } catch (err) {
    log.error('passport', 'Google strategy failed', err);
    done(err, null);
  }
}));

export default passport;