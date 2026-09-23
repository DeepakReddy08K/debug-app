import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';
dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '.env') });
import axios from 'axios';
import { jsonrepair } from 'jsonrepair';

const CANDIDATES = (process.argv[2]
  ? process.argv[2].split(',')
  : [
      'nvidia/nemotron-3-super-120b-a12b',
      'nvidia/nemotron-3-ultra-550b-a55b',
      'openai/gpt-oss-120b',
      'openai/gpt-oss-20b',
      'z-ai/glm-5.3',
      'z-ai/glm-5.3-flash',
      'moonshotai/kimi-k3',
      'minimaxai/minimax-m3',
      'qwen/qwen3-next-80b-a3b-instruct',
      'stepfun-ai/step-3.7-flash',
      'poolside/laguna-xs-2.1',
      'meta/muse-glimmer-30b',
    ]
).map((s) => s.trim());

const buggy = `#include <bits/stdc++.h>
using namespace std;
int main(){int n;cin>>n;int sum=0;for(int i=0;i<n;i++){int x;cin>>x;sum+=x;}cout<<sum<<endl;}`;
const correct = buggy.replace('int sum=0','long long sum=0').replace('int x;','long long x;');

const prompt = `You are an expert competitive programming analyst. Analyze the code below and output ONLY a valid JSON object, no markdown, no explanation, in this exact structure:
{"problem_meta":{"name":"","problem_type":"","language":"cpp"},
"input_structure":{"format":"single_test_case","per_test_case":[{"variable":"","type":"","line":1,"separator":"","constraints":{"min":0,"max":0}}]},
"output_structure":{"per_test_case":{"type":"","description":""}},
"test_case_generation_strategy":{"categories":[{"name":"","description":"","examples":[]}]},
"ai_generation_prompt_hint":""}
Include at least 5 categories, including one targeting the suspected bug by comparing buggy vs correct code.

Buggy Code:
${buggy}

Correct Code:
${correct}`;

for (const model of CANDIDATES) {
  const start = Date.now();
  try {
    const res = await axios.post(
      `${process.env.NVIDIA_BASE_URL}/chat/completions`,
      { model, messages: [{ role: 'user', content: prompt }], max_tokens: 4096, temperature: 0.6, stream: false },
      { headers: { Authorization: `Bearer ${process.env.NVIDIA_API_KEY}` }, timeout: 120000 }
    );
    const ms = Date.now() - start;
    const text = res.data.choices?.[0]?.message?.content || '';
    let json = false, cats = 0, mentionsOverflow = false;
    try {
      const cleaned = text.replace(/```json|```/g, '').trim();
      const obj = JSON.parse(jsonrepair(cleaned));
      json = true;
      cats = obj?.test_case_generation_strategy?.categories?.length || 0;
      mentionsOverflow = /overflow|long long|large/i.test(JSON.stringify(obj));
    } catch {}
    console.log(`${json ? '✅' : '⚠️'} ${model}  ${ms}ms  json=${json}  categories=${cats}  overflowHint=${mentionsOverflow}  chars=${text.length}`);
  } catch (e) {
    const s = e.response?.status;
    console.log(`❌ ${model}  ${Date.now() - start}ms  ${s || e.code || e.message}`);
  }
}