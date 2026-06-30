//branch 1
import { callNemotron } from '../config/nvidiaClient.js';
import { createRun, updateConstraints } from '../models/runModel.js';
//branch 2a
import { callDeepSeek } from '../config/nvidiaClient.js';
import { updateSyntaxCheck } from '../models/runModel.js';
//branch 2b
import { getRunById } from '../models/runModel.js';
import { saveTestCases } from '../models/testCaseModel.js';
//branch 2c
import { submitBatch, pollUntilComplete, JUDGE0_LANGUAGE_IDS } from '../config/judge0Client.js';
import { runCodeSync, runBatchWithConcurrencyLimit } from '../config/compilerClient.js';
import { getTestCasesByRun } from '../models/testCaseModel.js';
import { updateTestCaseResult } from '../models/testCaseModel.js';
//branch 3
import { updateDiagnosis } from '../models/runModel.js';
import { getFailingTestCases } from '../models/testCaseModel.js';
//updating run status
import { updateRunStatus } from '../models/runModel.js';
//for consoling logs
import log from '../config/logger.js';
//to fix common ai-generated json issues
import { jsonrepair } from 'jsonrepair';


//branch 1
// Detect language from code patterns
const detectLanguage = (code) => {
  if (/#include|using namespace|int main|cout|cin/.test(code)) return 'cpp';
  if (/import java|public class|System\.out/.test(code)) return 'java';
  if (/console\.log|function |const |let |=>/.test(code)) return 'javascript';
  if (/^def |^import |print\(|input\(/.test(code)) return 'python';
  return 'cpp';
};

// Detect if code is LeetCode-style class-based (no main function)
const isClassBased = (code) => {
  const hasClass = /class\s+Solution/.test(code);
  const hasMain = /int\s+main\s*\(|void\s+main\s*\(|public\s+static\s+void\s+main|if\s+__name__\s*==/.test(code);
  return hasClass && !hasMain;
};

// Branch 1 — Logic function — does the actual work, returns data, throws on error
export const analyzeProblemLogic = async (userId, buggyCode, correctCode, additionalInfo) => {
  log.step('debugController', '2', 'Detecting language and structure');
  const language = detectLanguage(buggyCode) || detectLanguage(correctCode);
  const classBased = isClassBased(buggyCode) || isClassBased(correctCode);

  log.step('debugController', '3', 'Creating run entry');
  const run = await createRun(userId, buggyCode, correctCode, language, classBased, process.env.MODEL_REASONING);

  log.step('debugController', '4', 'Building Branch 1 prompt');
  const prompt = `You are an expert competitive programming analyst. Analyze the code/problem below and produce a JSON schema describing problem metadata, input structure, output structure, and a test-case generation strategy.

CRITICAL RULE: The "input_structure" you define here will be used DIRECTLY by another AI to generate test case inputs that get fed via stdin to a real compiler (Judge0). If you get the input format wrong (wrong order, wrong separators, missing lines, wrong count), every generated test case will crash on a valid input mismatch, not a real bug. So:
- Read both codes carefully to determine EXACTLY what they read from stdin (cin/scanf/input() order matters).
- Specify exact line numbers, separators (space/newline), and data types for every variable.
- If multiple test cases are read in a loop, set format to "multi_test_case" and describe the outer loop count line.
- If user-provided additional info conflicts with what the code actually reads, trust the code.

Buggy Code:
${buggyCode}

Correct Code (reference):
${correctCode}

User-provided additional info (use only as supporting context, not as override of code behavior): ${additionalInfo || 'None provided'}

Detected Language: ${language}
Is Class Based (LeetCode style, no main/stdin): ${classBased}

Output ONLY a valid JSON object, no markdown, no explanation, in this exact structure:

{
  "problem_meta": {
    "name": "short descriptive title",
    "source": "Unknown",
    "problem_type": "e.g. dynamic_programming, graph, greedy, string, math",
    "language": "${language}",
    "is_class_based": ${classBased}
  },
  "input_structure": {
    "format": "single_test_case or multi_test_case",
    "global_constraints": {},
    "per_test_case": [
      { "variable": "name", "type": "int/string/int[]/etc", "line": 1, "separator": " or newline", "constraints": { "min": value, "max": value }, "description": "what it represents" }
    ]
  },
  "output_structure": {
    "per_test_case": { "type": "int/string/etc", "description": "what is printed" }
  },
  "test_case_generation_strategy": {
    "categories": [
      {
        "name": "category name e.g. Small/Trivial Cases, All Negative Numbers, Boundary, Overflow, Edge Case",
        "description": "what this category targets and why it matters for finding bugs",
        "generation": { "variable_name": { "min": value, "max": value, "distribution": "uniform" } },
        "examples": [ "1-2 small illustrative example objects matching per_test_case variables" ]
      }
    ]
  },
  "ai_generation_prompt_hint": "one paragraph summarizing exactly what test cases to generate and which specific bug pattern to target if detectable from comparing buggy vs correct code"
}

Include at least 5-8 categories covering: small/trivial cases, boundary values, large stress test, and any category that specifically targets the suspected bug by comparing the buggy and correct code logic.`;

// Retry up to 2 times if AI returns empty response
  const MAX_AI_RETRIES = 2;
  let aiResponse = '';
  for (let attempt = 1; attempt <= MAX_AI_RETRIES; attempt++) {
    log.step('debugController', '5', `Calling Nemotron for analysis (attempt ${attempt})`);
    aiResponse = await callNemotron(prompt);
    if (aiResponse && aiResponse.trim().length > 0) break;
    log.warn('debugController', `Nemotron returned empty response on attempt ${attempt}, retrying...`);
  }

  if (!aiResponse || aiResponse.trim().length === 0) {
    throw new Error('Nemotron returned empty response after retries in Branch 1.');
  }
  log.step('debugController', '6', 'Parsing AI response');
  let cleanResponse = aiResponse.replace(/```json\n?|```\n?/g, '').trim();
  cleanResponse = cleanResponse.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');

  let schema;
  try {
    schema = JSON.parse(cleanResponse);
  } catch (parseErr) {
    log.warn('debugController', 'Initial JSON parse failed, attempting repair in branch 1');
    try {
      schema = JSON.parse(jsonrepair(cleanResponse));
      log.success('debugController', 'JSON repaired successfully in branch 1');
    } catch (repairErr) {
      log.error('debugController', 'JSON repair also failed in branch 1', repairErr);
      log.error('debugController', 'Raw AI response was', cleanResponse.slice(0, 1000));
      throw new Error('AI returned invalid format in Branch 1.');
    }
  }

  log.step('debugController', '7', 'Saving constraints to DB');
  await updateConstraints(run.id, schema);

  log.success('debugController', `Branch 1 completed for run: ${run.id}`);
  return { runId: run.id, run, schema };
};

// Branch 1 — Route handler — thin wrapper around the logic function
export const analyzeProblem = async (req, res) => {
  log.step('debugController', '1', 'Branch 1: analyze-problem started');
  const { buggyCode, correctCode, additionalInfo } = req.body;
  const userId = req.session.userId;

  try {
    if (!buggyCode || !correctCode) {
      log.warn('debugController', 'Missing code in analyze request');
      return res.status(400).json({ error: 'Both buggy and correct code are required.' });
    }
    const { runId, schema } = await analyzeProblemLogic(userId, buggyCode, correctCode, additionalInfo);
    res.status(200).json({ runId, schema });
  } catch (err) {
    log.error('debugController', 'Branch 1 failed', err);
    res.status(500).json({ error: err.message || 'Analysis failed. Please try again.' });
  }
};

//branch 2a

// Branch 2a — Logic function
export const checkSyntaxLogic = async (runId, buggyCode, language) => {
  log.step('debugController', '2', 'Building Branch 2a prompt');
  const prompt = `You are a strict syntax-only checker for ${language} code. Your ONLY job is to detect compile-time errors or guaranteed runtime crashes. 

DO NOT flag:
- Wrong initial values (e.g., sum=1 instead of sum=0) — this is a LOGIC bug, not syntax
- Wrong comparison operators (e.g., < instead of <=) — this is a LOGIC bug, not syntax
- Off-by-one errors — this is a LOGIC bug, not syntax
- Any code that compiles and runs without crashing, even if the output is wrong

ONLY flag:
- Missing semicolons, unmatched brackets/parentheses
- Undeclared variables or type mismatches that fail to COMPILE
- Operations that ALWAYS crash regardless of input (e.g., dereferencing a null pointer unconditionally, division by a hardcoded zero)

If the code compiles successfully and runs without crashing on any input, you MUST set has_errors to false, even if the program's output might be logically wrong.

Code to check:
${buggyCode}

Output ONLY a valid JSON object, no markdown, no explanation, in this exact structure:
{
  "has_errors": boolean,
  "error_type": "syntax|runtime|both|none",
  "errors": [
    { "type": "syntax|runtime", "line": number, "description": "string", "severity": "critical|warning", "fix_suggestion": "string" }
  ],
  "summary": "one line summary",
  "can_proceed_to_testing": boolean
}`;

const aiResponse = await callDeepSeek(prompt, 4096, 0.1); // low temperature for consistency
  log.step('debugController', '3', 'Calling DeepSeek for syntax check');


  log.step('debugController', '4', 'Parsing AI response');
  let cleanResponse = aiResponse.replace(/```json\n?|```\n?/g, '').trim();
  cleanResponse = cleanResponse.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');

  let result;
  try {
    result = JSON.parse(cleanResponse);
  } catch (parseErr) {
    log.warn('debugController', 'Initial JSON parse failed, attempting repair in branch 2a');
    try {
      result = JSON.parse(jsonrepair(cleanResponse));
      log.success('debugController', 'JSON repaired successfully in branch 2a');
    } catch (repairErr) {
      log.error('debugController', 'JSON repair also failed in branch 2a', repairErr);
      log.error('debugController', 'Raw AI response was', cleanResponse.slice(0, 1000));
      throw new Error('AI returned invalid format in Branch 2a.');
    }
  }

  log.step('debugController', '5', 'Saving syntax check to DB');
  await updateSyntaxCheck(runId, result);

  log.success('debugController', `Branch 2a completed for run: ${runId}`);
  return result;
};

// Branch 2a — Route handler
export const checkSyntax = async (req, res) => {
  log.step('debugController', '1', 'Branch 2a: check-syntax started');
  const { runId, buggyCode, language } = req.body;

  try {
    if (!runId || !buggyCode || !language) {
      log.warn('debugController', 'Missing fields in checkSyntax request');
      return res.status(400).json({ error: 'runId, buggyCode and language are required.' });
    }
    const syntaxCheck = await checkSyntaxLogic(runId, buggyCode, language);
    res.status(200).json({ runId, syntaxCheck });
  } catch (err) {
    log.error('debugController', 'Branch 2a failed', err);
    res.status(500).json({ error: err.message || 'Syntax check failed. Please try again.' });
  }
};

// Branch 2b — Logic function
export const generateTestCasesLogic = async (runId, retryRound = 0) => {
  log.step('debugController', '2', 'Fetching run and schema from DB');
  const run = await getRunById(runId);
  if (!run || !run.constraints_json) {
    log.warn('debugController', `No schema found for run: ${runId}`);
    throw new Error('Run or schema not found. Run Branch 1 first.');
  }

  const schema = run.constraints_json;

  log.step('debugController', '3', 'Building Branch 2b prompt');
  const prompt = `You are an adversarial stress tester for competitive programming code. Your goal is to BREAK the buggy code by generating test cases that expose real bugs.

This is retry round: ${retryRound}. ${retryRound > 0 ? 'Generate DIFFERENT and HARDER test cases than typical/previous rounds — push toward extreme edge cases.' : 'Generate a solid first batch covering the main categories.'}

Problem Schema (use this EXACTLY to generate valid inputs):
${JSON.stringify(schema, null, 2)}

CRITICAL RULES:
- Inputs must be literal strings with actual newlines (\\n) — NOT Python expressions, NOT pseudo-code.
- Follow the EXACT input_structure format: correct line order, correct separators (space/newline), correct variable count.
- Respect all constraints (min/max) defined in the schema.
- N (array sizes etc) should be ≤ 200 for normal cases, except for any specifically labeled stress/large test category which can go up to schema's max.
- Each input string must be under 1500 characters.
- Generate test cases across these categories where relevant: Boundary, Overflow, Off-by-One, Duplicates, Math traps, String edge cases, Multi-test-case, Graph/Tree edge cases, and ESPECIALLY the category that targets the suspected bug from ai_generation_prompt_hint.
- Generate 8-12 test cases total.

Output ONLY a valid JSON object, no markdown, no explanation, in this exact structure:
{
  "test_cases": [
    { "category": "category name", "description": "which bug this targets", "input": "literal\\nstring\\nwith\\nactual\\nnewlines" }
  ],
  "total_count": number,
  "generation_notes": "one line note"
}`;

  // Retry up to 2 times if AI returns empty response
  const MAX_AI_RETRIES = 2;
  let aiResponse = '';
  for (let attempt = 1; attempt <= MAX_AI_RETRIES; attempt++) {
    log.step('debugController', '4', `Calling Nemotron for test case generation (attempt ${attempt})`);
    aiResponse = await callNemotron(prompt);
    if (aiResponse && aiResponse.trim().length > 0) break;
    log.warn('debugController', `Nemotron returned empty response on attempt ${attempt}, retrying...`);
  }

  if (!aiResponse || aiResponse.trim().length === 0) {
    throw new Error('Nemotron returned empty response after retries in Branch 2b.');
  }

  log.step('debugController', '5', 'Parsing AI response');
  let cleanResponse = aiResponse.replace(/```json\n?|```\n?/g, '').trim();
  cleanResponse = cleanResponse.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');

  let result;
  try {
    result = JSON.parse(cleanResponse);
  } catch (parseErr) {
    log.warn('debugController', 'Initial JSON parse failed, attempting repair in branch 2b');
    try {
      result = JSON.parse(jsonrepair(cleanResponse));
      log.success('debugController', 'JSON repaired successfully in branch 2b');
    } catch (repairErr) {
      log.error('debugController', 'JSON repair also failed in branch 2b', repairErr);
      log.error('debugController', 'Raw AI response was', cleanResponse.slice(0, 1000));
      throw new Error('AI returned invalid format in Branch 2b.');
    }
  }

  log.step('debugController', '6', 'Saving test cases to DB');
  const batchNumber = retryRound + 1;
  const savedCases = await saveTestCases(runId, result.test_cases.map(tc => ({ input: tc.input })), batchNumber);

  log.success('debugController', `Branch 2b completed for run: ${runId}, batch: ${batchNumber}`);
  return { batchNumber, testCases: result.test_cases, savedIds: savedCases.map(sc => sc.id) };
};
// Branch 2b — Route handler
export const generateTestCases = async (req, res) => {
  log.step('debugController', '1', 'Branch 2b: generate-test-cases started');
  const { runId, retryRound = 0 } = req.body;

  try {
    if (!runId) {
      log.warn('debugController', 'Missing runId in generateTestCases request');
      return res.status(400).json({ error: 'runId is required.' });
    }
    const result = await generateTestCasesLogic(runId, retryRound);
    res.status(200).json({ runId, ...result });
  } catch (err) {
    log.error('debugController', 'Branch 2b failed', err);
    res.status(500).json({ error: err.message || 'Test case generation failed. Please try again.' });
  }
};


//branch 2c
// Helper — build Judge0 batch submissions for all test cases (buggy + correct)
const buildJudge0Submissions = (testCases, buggyCode, correctCode, language) => {
  const languageId = JUDGE0_LANGUAGE_IDS[language] || JUDGE0_LANGUAGE_IDS.cpp;
  const submissions = [];
  for (const tc of testCases) {
    submissions.push({ source_code: buggyCode, language_id: languageId, stdin: tc.input_data });
    submissions.push({ source_code: correctCode, language_id: languageId, stdin: tc.input_data });
  }
  return submissions;
};

// Helper — run via OnlineCompiler.io fallback, stop at first failing test
const runWithOnlineCompilerFallback = async (testCases, buggyCode, correctCode, language) => {
  const results = [];
  for (const tc of testCases) {
    const buggyResult = await runCodeSync(buggyCode, tc.input_data, language);
    const correctResult = await runCodeSync(correctCode, tc.input_data, language);
    results.push({ testCase: tc, buggyResult, correctResult });

    const isFailing = (buggyResult.output || '').trim() !== (correctResult.output || '').trim();
    if (isFailing) {
      log.warn('debugController', `Failing test found via fallback: ${tc.id}`);
      break; // stop early on first failure
    }
  }
  return results;
};

// Branch 2c — Execute test cases on Judge0 (with OnlineCompiler.io fallback)
// Branch 2c — Logic function
export const executeTestCasesLogic = async (runId) => {
  log.step('debugController', '2', 'Fetching run and test cases from DB');
  const run = await getRunById(runId);
  if (!run) {
    log.warn('debugController', `Run not found: ${runId}`);
    throw new Error('Run not found.');
  }

  const testCases = await getTestCasesByRun(runId);
  if (!testCases.length) {
    log.warn('debugController', `No test cases found for run: ${runId}`);
    throw new Error('No test cases found. Run Branch 2b first.');
  }

  // Only process the latest batch
  const latestBatch = Math.max(...testCases.map(tc => tc.batch_number));
  const batchTestCases = testCases.filter(tc => tc.batch_number === latestBatch);

  let failingTest = null;
  let usedFallback = false;

  try {
    log.step('debugController', '3', 'Attempting Judge0 batch execution');
    const submissions = buildJudge0Submissions(batchTestCases, run.buggy_code, run.correct_code, run.language);
    const batchResponse = await submitBatch(submissions);
    const tokens = batchResponse.map(r => r.token);
    const results = await pollUntilComplete(tokens);

    for (let i = 0; i < batchTestCases.length; i++) {
      const tc = batchTestCases[i];
      const buggyResult = results[i * 2];
      const correctResult = results[i * 2 + 1];
      const buggyOutput = (buggyResult.stdout || buggyResult.compile_output || buggyResult.stderr || '').trim();
      const correctOutput = (correctResult.stdout || '').trim();
      const isFailing = buggyOutput !== correctOutput;

      await updateTestCaseResult(tc.id, buggyOutput, correctOutput, isFailing);

      if (isFailing && !failingTest) {
        failingTest = { input: tc.input_data, buggyOutput, correctOutput };
      }
    }
    log.success('debugController', 'Judge0 batch execution successful');

  } catch (judge0Err) {
    log.warn('debugController', 'Judge0 failed, falling back to OnlineCompiler.io', judge0Err.message);
    usedFallback = true;

    const fallbackResults = await runWithOnlineCompilerFallback(batchTestCases, run.buggy_code, run.correct_code, run.language);
    for (const r of fallbackResults) {
      const buggyOutput = (r.buggyResult.output || r.buggyResult.error || '').trim();
      const correctOutput = (r.correctResult.output || '').trim();
      const isFailing = buggyOutput !== correctOutput;

      await updateTestCaseResult(r.testCase.id, buggyOutput, correctOutput, isFailing);

      if (isFailing && !failingTest) {
        failingTest = { input: r.testCase.input_data, buggyOutput, correctOutput };
      }
    }
  }

  log.success('debugController', `Branch 2c completed for run: ${runId}, fallback used: ${usedFallback}`);
  return { failingTest, usedFallback };
};

// Branch 2c — Route handler
export const executeTestCases = async (req, res) => {
  log.step('debugController', '1', 'Branch 2c: execute-code started');
  const { runId } = req.body;

  try {
    if (!runId) {
      log.warn('debugController', 'Missing runId in executeTestCases request');
      return res.status(400).json({ error: 'runId is required.' });
    }
    const { failingTest, usedFallback } = await executeTestCasesLogic(runId);
    res.status(200).json({
      runId,
      failingTest,
      usedFallback,
      message: failingTest ? 'Failing test case found.' : 'No failing test case in this batch.',
    });
  } catch (err) {
    log.error('debugController', 'Branch 2c failed', err);
    res.status(500).json({ error: err.message || 'Code execution failed. Please try again.' });
  }
};

// Branch 3 — Diagnose bug (handles 4 scenarios)
// Branch 3 — Logic function
export const diagnoseBugLogic = async (runId) => {
  log.step('debugController', '2', 'Fetching run data from DB');
  const run = await getRunById(runId);
  if (!run) {
    log.warn('debugController', `Run not found: ${runId}`);
    throw new Error('Run not found.');
  }

  let scenarioContext = '';
  const syntaxCheck = run.syntax_check;

  if (syntaxCheck && syntaxCheck.has_errors) {
    log.step('debugController', '3', 'Scenario A: syntax errors detected');
    scenarioContext = `SCENARIO: Syntax/Runtime errors were detected by static analysis (no execution was performed).
Syntax Check Result:
${JSON.stringify(syntaxCheck, null, 2)}`;
  } else {
    log.step('debugController', '3', 'Checking for failing test cases');
    const failingCases = await getFailingTestCases(runId);

    if (failingCases.length > 0) {
      const failing = failingCases[0];
      log.step('debugController', '4', 'Scenario C: failing test case found');

      const isCompileError = /error:|compilation/i.test(failing.output_buggy || '');
      scenarioContext = isCompileError
        ? `SCENARIO: Compilation error occurred during execution.
Input: ${failing.input_data}
Compiler Output (buggy code): ${failing.output_buggy}
Expected Output (correct code): ${failing.output_correct}`
        : `SCENARIO: A failing test case was found — buggy code's output differs from correct code's output.
Input: ${failing.input_data}
Buggy Code Output: ${failing.output_buggy}
Correct Code Output: ${failing.output_correct}`;

      await updateDiagnosis(runId, null, failing.input_data, failing.output_buggy, failing.output_correct);

    } else {
      log.step('debugController', '4', 'Scenario D: all test cases passed, doing line-by-line diff');
      scenarioContext = `SCENARIO: All generated test cases passed — buggy code's output matched correct code's output on every test. 
Do a careful line-by-line comparison between the buggy code and correct code to find any subtle issues: performance problems, missed edge cases the tests didn't cover, or style/best-practice improvements. If the code is truly correct and optimal, say so clearly.`;
    }
  }

  log.step('debugController', '5', 'Building Branch 3 prompt');
  const prompt = `You are a direct, no-fluff debugging assistant for competitive programming code. Be specific and cite exact line numbers. No fluff, no over-explaining.

${scenarioContext}

Buggy Code:
${run.buggy_code}

Correct Code (reference):
${run.correct_code}

Output ONLY a valid JSON object, no markdown, no explanation, in this exact structure:
{
  "scenario": "syntax_error|logic_bug|all_correct|compilation_error",
  "verdict": "one-sentence summary",
  "failing_test": { "input": "string", "buggy_output": "string", "correct_output": "string" } or null,
  "issues": [
    { "type": "syntax|runtime|logic|performance|compilation", "line": number, "description": "string", "fix": "string" }
  ],
  "root_cause": "string or null",
  "improvements": [
    { "type": "performance|edge_case|style", "description": "string" }
  ]
}`;

  log.step('debugController', '6', 'Calling DeepSeek for diagnosis');
  const aiResponse = await callDeepSeek(prompt, 4096, 0.1, process.env.MODEL_DIAGNOSIS);

  log.step('debugController', '7', 'Parsing AI response');
  let cleanResponse = aiResponse.replace(/```json\n?|```\n?/g, '').trim();
  cleanResponse = cleanResponse.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '');

  let diagnosis;
  try {
    diagnosis = JSON.parse(cleanResponse);
  } catch (parseErr) {
    log.warn('debugController', 'Initial JSON parse failed, attempting repair in branch 3');
    try {
      diagnosis = JSON.parse(jsonrepair(cleanResponse));
      log.success('debugController', 'JSON repaired successfully in branch 3');
    } catch (repairErr) {
      log.error('debugController', 'JSON repair also failed in branch 3', repairErr);
      log.error('debugController', 'Raw AI response was', cleanResponse.slice(0, 1000));
      throw new Error('AI returned invalid format in Branch 3.');
    }
  }

  log.step('debugController', '8', 'Saving final diagnosis to DB');
  const failingInfo = diagnosis.failing_test;
  await updateDiagnosis(
    runId,
    diagnosis,
    failingInfo?.input || null,
    failingInfo?.buggy_output || null,
    failingInfo?.correct_output || null
  );

  log.success('debugController', `Branch 3 completed for run: ${runId}`);
  return diagnosis;
};

// Branch 3 — Route handler
export const diagnoseBug = async (req, res) => {
  log.step('debugController', '1', 'Branch 3: diagnose-bug started');
  const { runId } = req.body;

  try {
    if (!runId) {
      log.warn('debugController', 'Missing runId in diagnoseBug request');
      return res.status(400).json({ error: 'runId is required.' });
    }
    const diagnosis = await diagnoseBugLogic(runId);
    res.status(200).json({ runId, diagnosis });
  } catch (err) {
    log.error('debugController', 'Branch 3 failed', err);
    res.status(500).json({ error: err.message || 'Diagnosis failed. Please try again.' });
  }
};

// Full pipeline orchestration — Branch 1 -> 2a -> (skip to 3 if errors) -> 2b -> 2c -> (retry loop) -> 3
export const runFullPipeline = async (req, res) => {
  log.step('debugController', '1', 'Full pipeline started');
  const { buggyCode, correctCode, additionalInfo } = req.body;
  const userId = req.session.userId;
  const MAX_BATCHES = 3; // total batches including first attempt
  let run_id=null;
  try {
    if (!buggyCode || !correctCode) {
      return res.status(400).json({ error: 'Both buggy and correct code are required.' });
    }

// Input length validation
    if (buggyCode.length > 50000 || correctCode.length > 50000) {
      return res.status(400).json({ error: 'Code exceeds maximum allowed length of 50,000 characters.' });
    }

    if (additionalInfo && additionalInfo.length > 1000) {
      return res.status(400).json({ error: 'Additional info exceeds maximum allowed length of 1,000 characters.' });
    }

    // ---- BRANCH 1 ----
    log.step('debugController', '2', 'Pipeline: Branch 1 starting');
    const { runId, run, schema } = await analyzeProblemLogic(userId, buggyCode, correctCode, additionalInfo);
    run_id=runId;
    log.success('debugController', 'Pipeline: Branch 1 done');

    // ---- BRANCH 2a ----
    log.step('debugController', '3', 'Pipeline: Branch 2a starting');
    const syntaxCheck = await checkSyntaxLogic(runId, buggyCode, run.language);
    log.success('debugController', 'Pipeline: Branch 2a done');

    if (syntaxCheck.has_errors) {
      log.warn('debugController', 'Pipeline: syntax errors found, skipping to Branch 3');
      const diagnosis = await diagnoseBugLogic(runId);
      return res.status(200).json({ runId, stage: 'syntax_error', diagnosis });
    }

    // ---- BRANCH 2b + 2c LOOP ----
    let failingTest = null;
    for (let retryRound = 0; retryRound < MAX_BATCHES; retryRound++) {
      log.step('debugController', '4', `Pipeline: Branch 2b batch ${retryRound + 1} starting`);
      await generateTestCasesLogic(runId, retryRound);

      log.step('debugController', '5', `Pipeline: Branch 2c batch ${retryRound + 1} executing`);
      const execResult = await executeTestCasesLogic(runId);

      if (execResult.failingTest) {
        failingTest = execResult.failingTest;
        log.success('debugController', `Pipeline: failing test found in batch ${retryRound + 1}`);
        break;
      }
      log.warn('debugController', `Pipeline: no failing test in batch ${retryRound + 1}, ${retryRound < MAX_BATCHES - 1 ? 'retrying' : 'giving up'}`);
    }

    // ---- BRANCH 3 ----
    log.step('debugController', '6', 'Pipeline: Branch 3 starting');
    const diagnosis = await diagnoseBugLogic(runId);

    log.success('debugController', `Pipeline completed for run: ${runId}`);
    res.status(200).json({
      runId,
      stage: failingTest ? 'failing_test_found' : 'all_correct',
      diagnosis,
    });

  } catch (err) {
    log.error('debugController', 'Full pipeline failed', err);
    if(run_id){
      await updateRunStatus(run_id,'failed').catch((err)=>{log.error('debugController','Failed to update the run status in database',err)});
    }
    res.status(500).json({ error: err.message || 'Pipeline failed. Please try again.' });
  }
};


//Run single test

// Run Single Test — user provides manual input, run both codes via OnlineCompiler.io, compare
export const runSingleTest = async (req, res) => {
  log.step('debugController', '1', 'Run single test started');
  const { buggyCode, correctCode, input } = req.body;

  try {
    if (!buggyCode || !correctCode || input === undefined) {
      log.warn('debugController', 'Missing fields in runSingleTest request');
      return res.status(400).json({ error: 'buggyCode, correctCode and input are required.' });
    }

    log.step('debugController', '2', 'Detecting language and structure');
    const language = detectLanguage(buggyCode) || detectLanguage(correctCode);
    const classBased = isClassBased(buggyCode) || isClassBased(correctCode);

    if (classBased) {
      log.warn('debugController', 'Class-based code detected, not yet supported for single test run');
      return res.status(400).json({ error: 'Class-based (LeetCode style) code support is coming soon. Please use full main()-based code for now.' });
    }

    log.step('debugController', '3', 'Running buggy code');
    const buggyResult = await runCodeSync(buggyCode, input, language);

    log.step('debugController', '4', 'Running correct code');
    const correctResult = await runCodeSync(correctCode, input, language);

    const buggyOutput = (buggyResult.output || buggyResult.error || '').trim();
    const correctOutput = (correctResult.output || '').trim();
    const isMatching = buggyOutput === correctOutput;

    log.success('debugController', `Run single test completed, matching: ${isMatching}`);
    res.status(200).json({
      input,
      language,
      buggyOutput,
      correctOutput,
      isMatching,
      buggyDetails: buggyResult,
      correctDetails: correctResult,
    });

  } catch (err) {
    log.error('debugController', 'Run single test failed', err);
    res.status(500).json({ error: err.message || 'Code execution failed. Please try again.' });
  }
};
