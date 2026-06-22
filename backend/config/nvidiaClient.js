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

// DeepSeek call — non-streaming, used for syntax check and diagnosis
export const callDeepSeek = async (prompt, maxTokens = 4096) => {
  log.step('nvidiaClient', '1', 'Calling DeepSeek model');
  try {
    const response = await axios.post(
      `${BASE_URL}/chat/completions`,
      {
        model: process.env.MODEL_FAST,
        messages: [{ role: 'user', content: prompt }],
        temperature: 1,
        top_p: 0.95,
        max_tokens: maxTokens,
        extra_body: { chat_template_kwargs: { thinking: true, reasoning_effort: 'high' } },
        stream: false,
      },
      { headers: { Authorization: `Bearer ${API_KEY}` } }
    );
    const content = response.data.choices[0].message.content;
    log.success('nvidiaClient', 'DeepSeek call successful');
    return content;
  } catch (err) {
    log.error('nvidiaClient', 'DeepSeek call failed', err.response?.data || err);
    throw new Error('AI request failed (DeepSeek)');
  }
};

// Nemotron call — streaming, used for analyze-problem and generate-test-cases
export const callNemotron = async (prompt, maxTokens = 16384) => {
  log.step('nvidiaClient', '2', 'Calling Nemotron model (streaming)');
  try {
    const response = await axios.post(
      `${BASE_URL}/chat/completions`,
      {
        model: process.env.MODEL_REASONING,
        messages: [{ role: 'user', content: prompt }],
        temperature: 1,
        top_p: 1,
        max_tokens: maxTokens,
        //extra_body: { reasoning_budget: 16384 }, //nvidia changed the request pattern and extra body is no longer accepting
        stream: true,
      },
      {
        headers: { Authorization: `Bearer ${API_KEY}` },
        responseType: 'stream',
      }
    );

    return new Promise((resolve, reject) => {
      let fullContent = '';
      let rawBuffer = ''; // collect everything for error debugging

      response.data.on('data', (chunk) => {
        const chunkStr = chunk.toString();
        rawBuffer += chunkStr;
        const lines = chunkStr.split('\n').filter(line => line.trim().startsWith('data:'));
        for (const line of lines) {
          const data = line.replace('data: ', '').trim();
          if (data === '[DONE]') continue;
          try {
            const parsed = JSON.parse(data);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) fullContent += delta;
          } catch (e) {
            // ignore partial JSON chunks
          }
        }
      });
      response.data.on('end', () => {
        if (!fullContent && rawBuffer) {
          log.error('nvidiaClient', 'Nemotron returned empty content, raw response:', rawBuffer.slice(0, 500));
        }
        log.success('nvidiaClient', 'Nemotron stream completed');
        resolve(fullContent);
      });
      response.data.on('error', (err) => {
        log.error('nvidiaClient', 'Nemotron stream error', err);
        reject(err);
      });
    });

  } catch (err) {
    // For streaming errors, read the response body properly
    if (err.response) {
      const status = err.response.status;
      let errorBody = '';
      try {
        await new Promise((resolve) => {
          err.response.data.on('data', chunk => errorBody += chunk.toString());
          err.response.data.on('end', resolve);
        });
      } catch (e) {
        errorBody = 'Could not read error body';
      }
      log.error('nvidiaClient', `Nemotron HTTP ${status} error body:`, errorBody);
    } else {
      log.error('nvidiaClient', 'Nemotron call failed', err.message);
    }
    throw new Error('AI request failed (Nemotron)');
  }
};