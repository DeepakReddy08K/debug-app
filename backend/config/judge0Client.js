import axios from 'axios';
import log from './logger.js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const JUDGE0_BASE = process.env.JUDGE0_BASE_URL;
const JUDGE0_KEY = process.env.JUDGE0_API_KEY;
const JUDGE0_HOST = process.env.JUDGE0_API_HOST;

// Judge0 language IDs
export const JUDGE0_LANGUAGE_IDS = {
  cpp: 54,        // C++ (GCC 9.2.0)
  python: 71,     // Python 3.8.1
  java: 62,       // Java OpenJDK 13
  javascript: 63, // JavaScript Node.js 12.14.0
};

const judge0Headers = {
  'content-type': 'application/json',
  'X-RapidAPI-Key': JUDGE0_KEY,
  'X-RapidAPI-Host': JUDGE0_HOST,
};

// Submit a batch of (code + stdin) pairs, get back tokens
export const submitBatch = async (submissions) => {
  log.step('judge0Client', '1', `Submitting batch of ${submissions.length} to Judge0`);
  const response = await axios.post(
    `${JUDGE0_BASE}/submissions/batch?base64_encoded=false`,
    { submissions },
    { headers: judge0Headers }
  );
  return response.data; // array of { token }
};

// Poll batch results using tokens
export const getBatchResults = async (tokens) => {
  log.step('judge0Client', '2', `Polling batch results for ${tokens.length} tokens`);
  const tokenStr = tokens.join(',');
  const response = await axios.get(
    `${JUDGE0_BASE}/submissions/batch?tokens=${tokenStr}&base64_encoded=false&fields=stdout,stderr,status,compile_output`,
    { headers: judge0Headers }
  );
  return response.data.submissions; // array of results
};

// Wait until all submissions in batch are done processing (poll with delay)
export const pollUntilComplete = async (tokens, maxAttempts = 10, delayMs = 2000) => {
  for (let i = 0; i < maxAttempts; i++) {
    const results = await getBatchResults(tokens);
    const allDone = results.every(r => r.status.id !== 1 && r.status.id !== 2); // 1=queued, 2=processing
    if (allDone) {
      log.success('judge0Client', 'All submissions completed');
      return results;
    }
    log.step('judge0Client', '3', `Attempt ${i + 1}: still processing, waiting...`);
    await new Promise(resolve => setTimeout(resolve, delayMs));
  }
  throw new Error('Judge0 batch polling timed out');
};
