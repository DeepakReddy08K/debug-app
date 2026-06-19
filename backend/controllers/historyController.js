import { getRunsByUser, getRunById } from '../models/runModel.js';
import { getTestCasesByRun } from '../models/testCaseModel.js';
import { getAllMessagesByRun } from '../models/chatModel.js';
import log from '../config/logger.js';

// GET /api/history — list all runs for the logged-in user (last 3 months)
export const getHistory = async (req, res) => {
  log.step('historyController', '1', 'Getting history for user');
  const userId = req.session.userId;

  try {
    const runs = await getRunsByUser(userId);

    const history = runs.map(run => ({
      runId: run.id,
      language: run.language,
      isClassBased: run.is_class_based,
      status: run.status,
      codePreview: run.code_preview,
      verdict: run.ai_diagnosis?.verdict || null,
      failingInput: run.failing_input || null,
      totalTests: parseInt(run.total_tests) || 0,
      failingTests: parseInt(run.failing_tests) || 0,
      createdAt: run.created_at,
    }));

    log.success('historyController', `Returning ${history.length} runs for user: ${userId}`);
    res.status(200).json({ history });

  } catch (err) {
    log.error('historyController', 'Failed to get history', err);
    res.status(500).json({ error: 'Failed to fetch history. Please try again.' });
  }
};

// GET /api/history/:runId — full detail for one run
export const getRunDetail = async (req, res) => {
  log.step('historyController', '1', 'Getting run detail');
  const { runId } = req.params;
  const userId = req.session.userId;

  try {
    const run = await getRunById(runId);

    if (!run) {
      log.warn('historyController', `Run not found: ${runId}`);
      return res.status(404).json({ error: 'Run not found.' });
    }

    // Make sure user can only see their own runs
    if (run.user_id !== userId) {
      log.warn('historyController', `Unauthorized access to run: ${runId} by user: ${userId}`);
      return res.status(403).json({ error: 'Unauthorized.' });
    }

    const testCases = await getTestCasesByRun(runId);
    const chatMessages = await getAllMessagesByRun(runId);

    log.success('historyController', `Returning detail for run: ${runId}`);
    res.status(200).json({
      runId: run.id,
      language: run.language,
      isClassBased: run.is_class_based,
      status: run.status,
      buggyCode: run.buggy_code,
      correctCode: run.correct_code,
      failingInput: run.failing_input,
      outputBuggy: run.output_buggy,
      outputCorrect: run.output_correct,
      aiDiagnosis: run.ai_diagnosis,
      testCases,
      chatMessages,
      createdAt: run.created_at,
    });

  } catch (err) {
    log.error('historyController', 'Failed to get run detail', err);
    res.status(500).json({ error: 'Failed to fetch run detail. Please try again.' });
  }
};