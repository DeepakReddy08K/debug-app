import axios from 'axios';
import log from './logger.js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const BASE_URL = process.env.NVIDIA_BASE_URL;
const API_KEY = process.env.NVIDIA_API_KEY;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const RETRYABLE = [408, 429, 500, 502, 503, 504];

// primary model first, then MODEL_FALLBACKS from .env (comma separated), no duplicates
const buildModelList = (primary) => {
  const fallbacks = (process.env.MODEL_FALLBACKS || '').split(',').map((s) => s.trim());
  return [primary, ...fallbacks].filter((m, i, a) => m && a.indexOf(m) === i);
};

// Reads the error body whether it is a normal object or a stream
const readErrorBody = async (err) => {
  const data = err.response?.data;
  if (!data) return err.message;
  if (typeof data.on !== 'function') return data;
  let body = '';
  await new Promise((resolve) => {
    data.on('data', (c) => (body += c.toString()));
    data.on('end', resolve);
    data.on('error', resolve);
  });
  return body;
};

// Runs fn(model) with 2 attempts per model, then moves to the next model
const withFallback = async (primary, label, fn) => {
  const models = buildModelList(primary);
  for (const model of models) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      log.step('nvidiaClient', label, `Calling ${model} (attempt ${attempt})`);
      try {
        const content = await fn(model);
        if (content) {
          log.success('nvidiaClient', `${model} call successful`);
          return content;
        }
        log.error('nvidiaClient', `${model} returned empty content`);
      } catch (err) {
        const status = err.response?.status;
        const body = await readErrorBody(err);
        log.error('nvidiaClient', `${model} failed (${status || 'no status'})`, body);
        if (status && !RETRYABLE.includes(status)) break; // 404/410/401: skip to next model
      }
      await sleep(1500 * attempt);
    }
  }
  throw new Error('AI request failed');
};

// Non-streaming call: syntax check, diagnosis, chat
export const callDeepSeek = async (prompt, maxTokens = 4096, temperature = 1, model = process.env.MODEL_FAST) => {
  return withFallback(model, '1', async (m) => {
    const response = await axios.post(
      `${BASE_URL}/chat/completions`,
      {
        model: m,
        messages: [{ role: 'user', content: prompt }],
        temperature,
        top_p: 0.95,
        max_tokens: maxTokens,
        stream: false,
      },
      { headers: { Authorization: `Bearer ${API_KEY}` }, timeout: 90000 }
    );
    return response.data.choices?.[0]?.message?.content;
  });
};

// Streaming call: analyze-problem and generate-test-cases
// Analyze-problem and generate-test-cases (non-streaming; streaming was hanging)
export const callNemotron = async (prompt, maxTokens = 8192) => {
  return withFallback(process.env.MODEL_REASONING, '2', async (m) => {
    const response = await axios.post(
      `${BASE_URL}/chat/completions`,
      {
        model: m,
        messages: [{ role: 'user', content: prompt }],
        temperature: 1,
        top_p: 1,
        max_tokens: maxTokens,
        stream: false,
      },
      { headers: { Authorization: `Bearer ${API_KEY}` }, timeout: 120000 }
    );
    return response.data.choices?.[0]?.message?.content;
  });
};