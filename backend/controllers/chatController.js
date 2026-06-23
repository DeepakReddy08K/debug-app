import { getRunById } from '../models/runModel.js';
import { saveMessage, getMessagesByRun } from '../models/chatModel.js';
import { callDeepSeek } from '../config/nvidiaClient.js';
import log from '../config/logger.js';

// AI Chat — context-aware chat about a specific run OR provided code
export const chatAboutRun = async (req, res) => {
  log.step('chatController', '1', 'AI chat started');
  const { runId, message, buggyCode, correctCode, conversationHistory = [] } = req.body;
  const userId = req.session.userId;

  try {
    if (!message) {
      log.warn('chatController', 'Missing message in chat request');
      return res.status(400).json({ error: 'message is required.' });
    }

    let run = null;
    let previousMessages = [];
    let contextBuggyCode = buggyCode || null;
    let contextCorrectCode = correctCode || null;

    if (runId) {
      log.step('chatController', '2', 'Fetching run and last 8 messages from DB');
      run = await getRunById(runId);
      if (run) {
        previousMessages = await getMessagesByRun(runId, 8);
        contextBuggyCode = run.buggy_code;
        contextCorrectCode = run.correct_code;
      } else {
        log.warn('chatController', `Run ${runId} not found, using provided code if any`);
      }
    }

    log.step('chatController', '3', 'Building chat context');

    const historyToUse = (runId && run)
      ? previousMessages.map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
      : conversationHistory.map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`);

    const conversationHistoryText = historyToUse.join('\n');

    const codeContext = contextBuggyCode || contextCorrectCode
      ? `${contextBuggyCode ? `Buggy Code:\n${contextBuggyCode}\n` : ''}${contextCorrectCode ? `Correct Code:\n${contextCorrectCode}` : ''}`
      : '(No code provided)';

    const prompt = `You are a helpful debugging assistant for competitive programming. Help the user understand code issues, algorithm concepts, and debugging strategies. unless user asks lengthy code just give response in 15 to 20 words shortly and make sure if user gives out normal messages give right answer like if he says hi! respond like Hi ! how is your day any debugging help etc..

${codeContext}

${run && run.ai_diagnosis ? `AI Diagnosis from this session:\n${JSON.stringify(run.ai_diagnosis, null, 2)}\n` : ''}

Previous conversation (most recent messages):
${conversationHistoryText || '(This is the start of the conversation)'}

User's question:
${message}

Be concise (1-3 sentences), specific, and reference line numbers when relevant.`;

    log.step('chatController', '4', 'Calling DeepSeek for response');
    const aiResponse = await callDeepSeek(prompt, 1024);

    if (runId && run) {
      log.step('chatController', '5', 'Saving messages to DB');
      await saveMessage(runId, userId, 'user', message);
      await saveMessage(runId, userId, 'assistant', aiResponse);
    }

    log.success('chatController', `Chat completed${runId && run ? ` for run: ${runId}` : ' (no storage)'}`);
    res.status(200).json({
      runId: runId || null,
      userMessage: message,
      assistantResponse: aiResponse,
      stored: !!(runId && run),
    });

  } catch (err) {
    log.error('chatController', 'AI chat failed', err);
    res.status(500).json({ error: err.message || 'Chat failed. Please try again.' });
  }
};