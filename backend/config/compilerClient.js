import axios from 'axios';
import log from './logger.js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const COMPILER_BASE = process.env.ONLINECOMPILER_BASE_URL;
const COMPILER_KEY = process.env.ONLINECOMPILER_API_KEY;

// OnlineCompiler.io compiler identifiers
export const COMPILER_IDS = {
  cpp: 'g++-15',
  python: 'python-3.14',
  java: 'openjdk-25',
  javascript: 'typescript-deno', // closest match, runs JS too
};

// Run a single code + input pair synchronously
export const runCodeSync = async (code, input, language) => {
  log.step('compilerClient', '1', `Running code on OnlineCompiler.io (${language})`);
  try {
    const response = await axios.post(
      `${COMPILER_BASE}/api/run-code-sync/`,
      {
        compiler: COMPILER_IDS[language] || COMPILER_IDS.cpp,
        code,
        input,
      },
      { headers: { Authorization: COMPILER_KEY } }
    );
    log.success('compilerClient', 'OnlineCompiler.io execution successful');
    return response.data; // { output, error, status, exit_code, ... }
  } catch (err) {
    log.error('compilerClient', 'OnlineCompiler.io execution failed', err.response?.data || err);
    throw new Error('Code execution failed (OnlineCompiler.io)');
  }
};

// Run multiple test cases with concurrency limit of 4 (their hard limit)
export const runBatchWithConcurrencyLimit = async (testCases, code, language, concurrency = 4) => {
  log.step('compilerClient', '2', `Running batch of ${testCases.length} with concurrency ${concurrency}`);
  const results = [];
  for (let i = 0; i < testCases.length; i += concurrency) {
    const chunk = testCases.slice(i, i + concurrency);
    const chunkResults = await Promise.all(
      chunk.map(tc => runCodeSync(code, tc.input, language))
    );
    results.push(...chunkResults);
  }
  log.success('compilerClient', 'Batch execution completed');
  return results;
};