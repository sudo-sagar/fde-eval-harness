import OpenAI from 'openai';
import * as fs from 'fs';
import * as path from 'path';
import { SYSTEM_PROMPT, generateUserPrompt } from './prompt';

// Point OpenAI SDK to your local Ollama server
const ollama = new OpenAI({
  baseURL: 'http://127.0.0.1:11434/v1',
  apiKey: 'ollama', // required but ignored by Ollama
});

async function callLLM(diff: string): Promise<any> {
  const response = await ollama.chat.completions.create({
    model: "qwen2.5-coder:3b", 
    response_format: { type: "json_object" }, 
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: generateUserPrompt(diff) }
    ]
  });

  const content = response.choices[0].message.content || "{}";
  return JSON.parse(content);
}

async function runEval() {
  const diffDir = path.join(__dirname, '..', 'data', 'diffs'); 
  const files = fs.readdirSync(diffDir).filter(f => f.endsWith('.diff') && !f.includes('pomelo') && !f.includes('apollo3') && !f.includes('colouring') && !f.includes('juspay'));
  
  console.log(`Found ${files.length} diffs to evaluate...\n`);
  let results = "";

  for (const file of files) {
    const diffContent = fs.readFileSync(path.join(diffDir, file), 'utf-8');
    console.log(`--- Reviewing ${file} ---`);
    
    try {
      const startTime = Date.now();
      const aiReview = await callLLM(diffContent);
      const latency = Date.now() - startTime;
      
      console.log(`AI Misses: ${aiReview.whatItMisses} (${latency}ms)\n`);
      
      results += `## ${file}\n**Change:** ${aiReview.change}\n**AI Misses:** ${aiReview.whatItMisses}\n**Label:** ${aiReview.label}\n\n`;
      
    } catch (e) {
      console.error(`Failed to process ${file}:`, e);
    }
  }
  
  fs.writeFileSync(path.join(__dirname, '..', 'data', 'ai_results.md'), results);
  console.log(`\nEval complete. Results saved to ai_results.md`);
}

runEval();