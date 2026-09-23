import 'dotenv/config';
import axios from 'axios';

const model = process.argv[2] || 'nvidia/nemotron-3-ultra-550b-a55b';
const start = Date.now();
let firstAny = null, firstContent = null, reasoningChars = 0, contentChars = 0;

const res = await axios.post(
  `${process.env.NVIDIA_BASE_URL}/chat/completions`,
  {
    model,
    messages: [{ role: 'user', content: 'Explain integer overflow in C++ in 3 sentences.' }],
    max_tokens: 2048,
    temperature: 1,
    stream: true,
  },
  { headers: { Authorization: `Bearer ${process.env.NVIDIA_API_KEY}` }, responseType: 'stream', timeout: 120000 }
);

let buf = '';
res.data.on('data', (chunk) => {
  buf += chunk.toString();
  const lines = buf.split('\n');
  buf = lines.pop();
  for (const l of lines) {
    if (!l.startsWith('data:')) continue;
    const d = l.slice(5).trim();
    if (!d || d === '[DONE]') continue;
    try {
      const delta = JSON.parse(d).choices?.[0]?.delta ?? {};
      if (firstAny === null) firstAny = Date.now() - start;
      if (delta.reasoning_content) reasoningChars += delta.reasoning_content.length;
      if (delta.content) {
        if (firstContent === null) firstContent = Date.now() - start;
        contentChars += delta.content.length;
      }
    } catch {}
  }
});
res.data.on('end', () => {
  console.log({ model, totalMs: Date.now() - start, firstChunkMs: firstAny, firstContentMs: firstContent, reasoningChars, contentChars });
});