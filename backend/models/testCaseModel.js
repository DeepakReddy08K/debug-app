import pool from '../config/db.js';
import log from '../config/logger.js';

// Save a batch of test cases for a run
export const saveTestCases = async (runId, testCases, batchNumber) => {
  log.step('testCaseModel', '1', `Saving batch ${batchNumber} for run: ${runId}`);
  
  const savedCases = [];
  for (const tc of testCases) {
    const result = await pool.query(
      `INSERT INTO test_cases (run_id, input_data, batch_number)
       VALUES ($1, $2, $3) RETURNING id, input_data, batch_number`,
      [runId, tc.input, batchNumber]
    );
    savedCases.push(result.rows[0]);
  }
  return savedCases;
};

// Update test case with execution results
export const updateTestCaseResult = async (testCaseId, outputBuggy, outputCorrect, isFailing) => {
  log.step('testCaseModel', '2', `Updating result for test case: ${testCaseId}`);
  const result = await pool.query(
    `UPDATE test_cases SET output_buggy = $1, output_correct = $2, is_failing = $3
     WHERE id = $4 RETURNING id`,
    [outputBuggy, outputCorrect, isFailing, testCaseId]
  );
  return result.rows[0] || null;
};

// Get all test cases for a run
export const getTestCasesByRun = async (runId) => {
  log.step('testCaseModel', '3', `Getting test cases for run: ${runId}`);
  const result = await pool.query(
    `SELECT * FROM test_cases WHERE run_id = $1 ORDER BY batch_number, created_at`,
    [runId]
  );
  return result.rows;
};

// Get only failing test cases for a run
export const getFailingTestCases = async (runId) => {
  log.step('testCaseModel', '4', `Getting failing test cases for run: ${runId}`);
  const result = await pool.query(
    `SELECT * FROM test_cases WHERE run_id = $1 AND is_failing = TRUE`,
    [runId]
  );
  return result.rows;
};