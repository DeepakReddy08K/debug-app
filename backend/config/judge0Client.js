import axios from 'axios';
import log from './logger.js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const RAPIDAPI_BASE = process.env.JUDGE0_BASE_URL;
const RAPIDAPI_KEY = process.env.JUDGE0_API_KEY;
const RAPIDAPI_HOST = process.env.JUDGE0_API_HOST;
const FALLBACK_BASE = process.env.JUDGE0_FALLBACK_URL;

export const JUDGE0_LANGUAGE_IDS = {
  cpp: 54,
  python: 71,
  java: 62,
  javascript: 63,
};

// Cooldown state — once RapidAPI fails, skip it for 1 hour
let isRapidApiOnCooldown = false;
let cooldownTimer = null;

const triggerCooldown = () => {
  isRapidApiOnCooldown = true;
  log.warn('judge0Client', 'RapidAPI on cooldown for 1 hour');
  if (cooldownTimer) clearTimeout(cooldownTimer);
  cooldownTimer = setTimeout(() => {
    isRapidApiOnCooldown = false;
    log.info('judge0Client', 'Cooldown expired, retrying RapidAPI next request');
  }, 60 * 60 * 1000); // 1 hour
};

// Submit batch — tries RapidAPI first, falls back to ce.judge0.com on 429/403/network error
export const submitBatch = async (submissions) => {
  const useFallback = isRapidApiOnCooldown;
  const targetUrl = useFallback
    ? `${FALLBACK_BASE}/submissions/batch?base64_encoded=false`
    : `${RAPIDAPI_BASE}/submissions/batch?base64_encoded=false`;

  const headers = { 'content-type': 'application/json' };
  if (!useFallback) {
    headers['X-RapidAPI-Key'] = RAPIDAPI_KEY;
    headers['X-RapidAPI-Host'] = RAPIDAPI_HOST;
  }

  log.step('judge0Client', '1', `Submitting batch of ${submissions.length} via ${useFallback ? 'public fallback' : 'RapidAPI'}`);

  try {
    const response = await axios.post(targetUrl, { submissions }, { headers });
    return response.data;
  } catch (err) {
    const status = err.response?.status;
    if (!useFallback && (status === 429 || status === 403)) {
      log.warn('judge0Client', `RapidAPI quota hit (${status}), switching to public instance`);
      triggerCooldown();
      return submitBatch(submissions); // retry immediately via fallback
    }
    if (!useFallback) {
      log.warn('judge0Client', 'RapidAPI network error, switching to public instance', err.message);
      triggerCooldown();
      return submitBatch(submissions);
    }
    // Already on fallback and it failed too — propagate error to trigger OnlineCompiler.io
    log.error('judge0Client', 'Public Judge0 instance also failed', err.message);
    throw err;
  }
};

// Poll batch results — uses same endpoint logic (cooldown state) as submitBatch
export const getBatchResults = async (tokens) => {
  const useFallback = isRapidApiOnCooldown;
  const baseUrl = useFallback ? FALLBACK_BASE : RAPIDAPI_BASE;
  const tokenStr = tokens.join(',');

  const headers = { 'content-type': 'application/json' };
  if (!useFallback) {
    headers['X-RapidAPI-Key'] = RAPIDAPI_KEY;
    headers['X-RapidAPI-Host'] = RAPIDAPI_HOST;
  }

  log.step('judge0Client', '2', `Polling batch results via ${useFallback ? 'public fallback' : 'RapidAPI'}`);
  const response = await axios.get(
    `${baseUrl}/submissions/batch?tokens=${tokenStr}&base64_encoded=false&fields=stdout,stderr,status,compile_output`,
    { headers }
  );
  return response.data.submissions;
};

// Wait until all submissions are done processing
export const pollUntilComplete = async (tokens, maxAttempts = 10, delayMs = 2000) => {
  for (let i = 0; i < maxAttempts; i++) {
    const results = await getBatchResults(tokens);
    const allDone = results.every(r => r.status.id !== 1 && r.status.id !== 2);
    if (allDone) {
      log.success('judge0Client', 'All submissions completed');
      return results;
    }
    log.step('judge0Client', '3', `Attempt ${i + 1}: still processing, waiting...`);
    await new Promise(resolve => setTimeout(resolve, delayMs));
  }
  throw new Error('Judge0 batch polling timed out');
};