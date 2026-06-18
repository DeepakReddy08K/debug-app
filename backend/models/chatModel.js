import pool from '../config/db.js';
import log from '../config/logger.js';

// Save a chat message
export const saveMessage = async (runId, userId, role, content) => {
  log.step('chatModel', '1', `Saving ${role} message for run: ${runId}`);
  const result = await pool.query(
    `INSERT INTO chat_messages (run_id, user_id, role, content)
     VALUES ($1, $2, $3, $4) RETURNING id, role, content, created_at`,
    [runId, userId, role, content]
  );
  return result.rows[0];
};

// Get all messages for a run (full conversation history)
// Get last N messages for a run (used in chat context, default 8, chronological order)
export const getMessagesByRun = async (runId, limit = 8) => {
  log.step('chatModel', '2', `Getting last ${limit} messages for run: ${runId}`);
  const result = await pool.query(
    `SELECT id, role, content, created_at 
     FROM (
       SELECT id, role, content, created_at 
       FROM chat_messages WHERE run_id = $1 
       ORDER BY created_at DESC 
       LIMIT $2
     ) sub
     ORDER BY created_at ASC`,
    [runId, limit]
  );
  return result.rows;
};

// Get ALL messages for a run (used in History page, full conversation)
export const getAllMessagesByRun = async (runId) => {
  log.step('chatModel', '3', `Getting all messages for run: ${runId}`);
  const result = await pool.query(
    `SELECT id, role, content, created_at 
     FROM chat_messages WHERE run_id = $1 
     ORDER BY created_at ASC`,
    [runId]
  );
  return result.rows;
};

// Delete all messages for a run
export const deleteMessagesByRun = async (runId) => {
  log.step('chatModel', '3', `Deleting messages for run: ${runId}`);
  await pool.query(
    `DELETE FROM chat_messages WHERE run_id = $1`,
    [runId]
  );
};