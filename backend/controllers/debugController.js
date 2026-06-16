//branch 1
import { callNemotron } from '../config/nvidiaClient.js';
import { createRun, updateConstraints } from '../models/runModel.js';
//branch 2a
import { callDeepSeek } from '../config/nvidiaClient.js';
import { updateSyntaxCheck } from '../models/runModel.js';
//for consoling logs
import log from '../config/logger.js';
//to fix common ai-generated json issues
import { jsonrepair } from 'jsonrepair';


//branch 1
// Detect language from code patterns
const detectLanguage = (code) => {
  if (/#include|using namespace|int main|cout|cin/.test(code)) return 'cpp';
  if (/import java|public class|System\.out/.test(code)) return 'java';
  if (/^def |^import |print\(|input\(/.test(code)) return 'python';
  if (/console\.log|function |const |let |=>/.test(code)) return 'javascript';
  return 'cpp';
};

// Detect if code is LeetCode-style class-based (no main function)
const isClassBased = (code) => {
  const hasClass = /class\s+Solution/.test(code);
  const hasMain = /int\s+main\s*\(|void\s+main\s*\(|public\s+static\s+void\s+main|if\s+__name__\s*==/.test(code);
  return hasClass && !hasMain;
};

// Branch 1 — Analyze problem and generate JSON schema
export const analyzeProblem = async (req, res) => {
  log.step('debugController', '1', 'Branch 1: analyze-problem started');
  const { buggyCode, correctCode, additionalInfo } = req.body;
  const userId = req.session.userId;

  try {
    if (!buggyCode || !correctCode) {
      log.warn('debugController', 'Missing code in analyze request');
      return res.status(400).json({ error: 'Both buggy and correct code are required.' });
    }

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

    log.step('debugController', '5', 'Calling Nemotron for analysis');
    const aiResponse = await callNemotron(prompt);

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
    return res.status(500).json({ error: 'AI returned invalid format. Please try again in branch 1.' });
  }
}

    log.step('debugController', '7', 'Saving constraints to DB');
    await updateConstraints(run.id, schema);

    log.success('debugController', `Branch 1 completed for run: ${run.id}`);
    res.status(200).json({ runId: run.id, schema });

  } catch (err) {
    log.error('debugController', 'Branch 1 failed', err);
    res.status(500).json({ error: 'Analysis failed. Please try again.' });
  }
};


//branch 2a

// Branch 2a — Check syntax/runtime errors in buggy code
export const checkSyntax = async (req, res) => {
  log.step('debugController', '1', 'Branch 2a: check-syntax started');
  const { runId, buggyCode, language } = req.body;

  try {
    if (!runId || !buggyCode || !language) {
      log.warn('debugController', 'Missing fields in checkSyntax request');
      return res.status(400).json({ error: 'runId, buggyCode and language are required.' });
    }

    log.step('debugController', '2', 'Building Branch 2a prompt');
    const prompt = `You are a strict syntax-only checker for ${language} code. Flag ONLY compile errors or guaranteed runtime crashes (e.g. missing semicolons, unmatched brackets, undeclared variables, type mismatches that fail to compile, null pointer dereference that always crashes). Do NOT flag logic differences compared to any reference — that is handled elsewhere. Default to has_errors: false when in doubt.

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

    log.step('debugController', '3', 'Calling DeepSeek for syntax check');
    const aiResponse = await callDeepSeek(prompt);

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
    return res.status(500).json({ error: 'AI returned invalid format. Please try again.' });
  }
}

    log.step('debugController', '5', 'Saving syntax check to DB');
    await updateSyntaxCheck(runId, result);

    log.success('debugController', `Branch 2a completed for run: ${runId}`);
    res.status(200).json({ runId, syntaxCheck: result });

  } catch (err) {
    log.error('debugController', 'Branch 2a failed', err);
    res.status(500).json({ error: 'Syntax check failed. Please try again.' });
  }
};