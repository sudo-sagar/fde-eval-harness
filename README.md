# PR Review Loop: An Eval Harness

## Description
Built a TypeScript evaluation harness to measure where AI code review tools fail in production. I pulled 14 real merged PRs from major open-source repos, hand-labeled the hidden QA risks, and ran them through a local **qwen2.5-coder:3b** model vs. the **Cursor Agent CLI**. 

**The Result:** The local model timed out on 43% of PRs and hallucinated. The Cursor Agent scored 100% on valid JSON generation and caught deep architectural edge cases (like database identity collisions and silent UI failures) that the local model completely missed.
<img width="2400" height="1500" alt="results_chart" src="https://github.com/user-attachments/assets/2b353b6b-6854-4608-bee4-9dba71d92065" />

---

## The Method
1. **The Dataset:** 14 real, merged pull requests from production open-source repositories including **Hardhat, Home Assistant, Firefox DevTools, Tutanota, Stirling-PDF, and appwrite**. 
2. **The Ground Truth (`data/labels.md`):** Coming from a QA background, I read the `+` and `-` lines of every diff and hand-labeled the "hidden production risk" (e.g., the crash was prevented, but the error is now silently swallowed).
3. **The Harness (`src/evals.ts and src/eval.ts`):** A TypeScript runner that pipes the raw diffs into the model using Node's `spawnSync`, forces strict JSON output, and parses the results against the human labels.

---

## The Evaluation: Local 3B vs. Cursor Agent

Ran the same 14 PRs through two engines. The gap perfectly illustrates the "Demo vs. Real World" problem.

| Metric | Local Qwen 3B (CPU) | Cursor Agent (Cloud) |
| :--- | :--- | :--- |
| **Successful JSON Output** | 8 / 14 (57%) | **14 / 14 (100%)** |
| **Hallucinations** | 1 (Invented a config change) | **0** |
| **Matched Human QA Ground Truth** | 0 (Missed all edge cases) | **14 / 14 (100%)** |

### 1. Context Limits & Reliability
The local 3B model failed to return valid JSON on **43% of PRs** (mostly due to context limits and RAM timeouts on large diffs). The Cursor Agent successfully returned structured JSON for **100% of the 14 PRs**, seamlessly handling massive 3,000-line feature drops.

### 2. Hallucination vs. Grounding
The local model hallucinated non-existent code changes (e.g., inventing a Vite config change in the Stirling-PDF PR). The Cursor Agent strictly read the actual diff and correctly identified the real architectural risks.

### 3. Catching the "Silent Failures" (The QA Difference)
The local model gave generic, useless advice ("might crash", "might fail"). The Cursor Agent found the exact edge cases I hand-labeled as the human ground truth:
*   **Home Assistant (`pr_hass_183263`):** Removing an `assert` for a null serial number causes downstream **database identity collisions** (`None_temperature`). Cursor found the exact `f"{serial}_{key}"` string causing it.
*   **gv-tools (`pr_gvtools_23`):** Catching a `.reduce()` crash on a dashboard results in **silent empty stats** rather than surfacing a network error. Cursor caught it.
*   **Stirling-PDF (`pr_stirling_8619`):** Setting Vite's `publicDir = false` will break **Chromatic CI builds** for Storybook. Cursor caught it.
*   **Xenflow (`pr_xenflow_5`):** Using `Files.isRegularFile` in Nextflow will reject remote object-store inputs. Cursor caught it.

---

## Architecture

Here is the end-to-end data flow of the evaluation harness:

flowchart TD
    A[GitHub CLI] -->|gh pr diff| B(14 Real .diff files)
    B --> C[(data/diffs/)]
    
    C -->|Read file| D(src/evals.ts, eval.ts)
    D -->|Truncates >20k chars| E[Construct Prompt]
    E -->|Inject Prompt & Diff| F(src/prompt.ts)
    
    F -->|spawnSync pipe| G{Cursor Agent CLI}
    G -->|Headless API Call| H[Cloud LLM]
    H -->|Returns text| I[Parse JSON]
    
    I -->|Valid JSON| J[Generate Markdown Report]
    I -.->|Malformed JSON / Timeout| K[Log Error & Continue]
    J --> L[(data/cursor_results.md, ai_results.md)]
    
    M[Human Review] -->|Reads code & writes edge cases| N[(data/labels.md)]
    L -->|Compare Results| O{Final Evaluation}
    N -->|Ground Truth| O
    
    O -->|Finds AI misses|
    
## Run locally
# 1. Install dependencies
npm install

# 2. Authenticate Cursor CLI
# (Requires Cursor Agent installed globally)
agent login

# 3. Run the eval harness
npx tsx src/evals.ts
