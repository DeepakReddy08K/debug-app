import pool from '../config/db.js';
import log from '../config/logger.js';

// Create a new run
export const createRun = async (userId, buggyCode, correctCode, language, isClassBased, aiModelUsed) => {
  log.step('runModel', '1', `Creating run for user: ${userId}`);
  const result = await pool.query(
    `INSERT INTO runs (user_id, buggy_code, correct_code, language, is_class_based, ai_model_used, status)
     VALUES ($1, $2, $3, $4, $5, $6, 'pending') RETURNING id, status, created_at`,
    [userId, buggyCode, correctCode, language, isClassBased, aiModelUsed]
  );
  // Increment total_runs for user
  await pool.query(
    `UPDATE users SET total_runs = total_runs + 1 WHERE id = $1`,
    [userId]
  );
  return result.rows[0];
};

// Update run with Branch 1 constraints
export const updateConstraints = async (runId, constraintsJson) => {
  log.step('runModel', '2', `Updating constraints for run: ${runId}`);
  const result = await pool.query(
    `UPDATE runs SET constraints_json = $1, status = 'running' WHERE id = $2 RETURNING id`,
    [constraintsJson, runId]
  );
  return result.rows[0] || null;
};

// Update run with Branch 2a syntax check
export const updateSyntaxCheck = async (runId, syntaxCheck) => {
  log.step('runModel', '3', `Updating syntax check for run: ${runId}`);
  const result = await pool.query(
    `UPDATE runs SET syntax_check = $1, status = 'running' WHERE id = $2 RETURNING id`,
    [syntaxCheck, runId]
  );
  return result.rows[0] || null;
};

// Update run with final diagnosis and failing test
export const updateDiagnosis = async (runId, aiDiagnosis, failingInput, outputBuggy, outputCorrect) => {
  log.step('runModel', '4', `Updating diagnosis for run: ${runId}`);
  const result = await pool.query(
    `UPDATE runs SET ai_diagnosis = $1, failing_input = $2, output_buggy = $3, 
     output_correct = $4, status = 'completed' WHERE id = $5 RETURNING id`,
    [aiDiagnosis, failingInput, outputBuggy, outputCorrect, runId]
  );
  return result.rows[0] || null;
};

// Update run status
export const updateRunStatus = async (runId, status) => {
  log.step('runModel', '5', `Updating status for run: ${runId} to ${status}`);
  const result = await pool.query(
    `UPDATE runs SET status = $1 WHERE id = $2 RETURNING id`,
    [status, runId]
  );
  return result.rows[0] || null;
};

// Get run by ID
export const getRunById = async (runId) => {
  log.step('runModel', '6', `Getting run: ${runId}`);
  const result = await pool.query(
    `SELECT * FROM runs WHERE id = $1`,
    [runId]
  );
  return result.rows[0] || null;
};

// Get all runs for a user (last 3 months) with test case counts and verdict
export const getRunsByUser = async (userId) => {
  log.step('runModel', '7', `Getting runs for user: ${userId}`);
  const result = await pool.query(
    `SELECT 
      r.id,
      r.language,
      r.is_class_based,
      r.status,
      r.failing_input,
      r.output_buggy,
      r.output_correct,
      r.ai_diagnosis,
      r.created_at,
      LEFT(r.buggy_code, 100) AS code_preview,
      COUNT(tc.id) AS total_tests,
      COUNT(CASE WHEN tc.is_failing = true THEN 1 END) AS failing_tests
    FROM runs r
    LEFT JOIN test_cases tc ON tc.run_id = r.id
    WHERE r.user_id = $1
      AND r.created_at > NOW() - INTERVAL '3 months'
    GROUP BY r.id
    ORDER BY r.created_at DESC`,
    [userId]
  );
  return result.rows;
};