import * as fs from 'fs';
import * as path from 'path';
import { spawnSync } from 'child_process'; // Changed from execSync
import { SYSTEM_PROMPT, generateUserPrompt } from './prompt';

async function callCursorAgent(diff: string): Promise<any> {
  const prompt = `${SYSTEM_PROMPT}\n\n${generateUserPrompt(diff)}`;
  
  // Get the absolute path to the Cursor CLI
  const agentPath = `"${process.env.LOCALAPPDATA}\\cursor-agent\\agent.cmd"`;

  try {
    // Use spawnSync to pass the prompt via stdin (avoids Windows command line limits)
    const result = spawnSync(
      agentPath,
      ['-p', '--output-format', 'text', '--force'],
      {
        input: prompt,
        encoding: 'utf-8',
        timeout: 300000, // 5 minutes per PR
        shell: true,     // Required on Windows to run .cmd files
        maxBuffer: 1024 * 1024 * 10 // 10MB buffer for large outputs
      }
    );

    if (result.error) {
      throw result.error;
    }

    const stdout = result.stdout || "";
    
    // Extract JSON from the text response (Cursor might wrap it in markdown)
    const jsonMatch = stdout.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.warn("⚠️ No JSON found in Cursor output. Raw output:", stdout.slice(0, 500));
      return null;
    }

    return JSON.parse(jsonMatch[0]);
    
  } catch (error: any) {
    console.error(`❌ Cursor Agent execution failed:`, error.message);
    return null;
  }
}

async function runEval() {
  const diffDir = path.join(__dirname, '..', 'data', 'diffs');
  
  // All 14 PRs
  const targetFiles = [
    "pr_cos_23.diff",
    "pr_gvtools_23.diff",
    "pr_hardhat_8463.diff",
    "pr_hass_183263.diff",
    "pr_helsinki_375.diff",
    "pr_madie_274.diff",
    "pr_oak_4498.diff",
    "pr_profiler_6346.diff",
    "pr_stirling_8619.diff",
    "pr_syscenter_981.diff",
    "pr_TinySA-Monitor_3.diff",
    "pr_tutanota_11681.diff",
    "pr_unovis_967.diff",
    "pr_xenflow_5.diff"
  ];

  const files = fs.readdirSync(diffDir).filter(f => targetFiles.includes(f));
  
  console.log(`🚀 Starting Cursor-Powered Eval on ${files.length} PRs...\n`);
  let results = "# Cursor-Powered PR Review Loop Results\n\n";

  for (const file of files) {
    const diffContent = fs.readFileSync(path.join(diffDir, file), 'utf-8');
    console.log(`--- Reviewing ${file} ---`);
    
    // Truncate to 20,000 chars to avoid extreme latency
    let safeDiff = diffContent;
    if (diffContent.length > 20000) { 
      console.warn(`⚠️ ${file} truncated to 20,000 chars.`);
      safeDiff = diffContent.slice(0, 20000); 
    }

    try {
      const startTime = Date.now();
      const aiReview = await callCursorAgent(safeDiff);
      const latency = Date.now() - startTime;
      
      if (!aiReview || !aiReview.change) {
        console.log(`❌ Failed to parse JSON (${latency}ms)\n`);
        results += `## ${file}\n**Error:** Cursor Agent failed to return valid JSON.\n\n`;
        continue;
      }
      
      console.log(`✅ AI Misses: ${aiReview.whatItMisses} (${latency}ms)\n`);
      
      results += `## ${file}\n`;
      results += `**Change:** ${aiReview.change}\n`;
      results += `**AI Misses:** ${aiReview.whatItMisses}\n`;
      results += `**Label:** ${aiReview.label}\n\n`;
      
    } catch (e: any) {
      console.error(`Failed to process ${file}:`, e.message);
      results += `## ${file}\n**Error:** Execution failed or timeout.\n\n`;
    }
  }
  
  fs.writeFileSync(path.join(__dirname, '..', 'data', 'cursor_results.md'), results);
  console.log(`\n🎉 Eval complete. Results saved to cursor_results.md`);
}

runEval();