/**
 * Cloud variant: runs phases on a cloned GitHub repo (Cursor Pro+).
 *
 *   REPO_URL=https://github.com/org/team-repo npm run build:influencerhub:cloud
 */
import "../load-env.js";
import { readFileSync, existsSync } from "node:fs";
import { Agent, CursorAgentError } from "@cursor/sdk";
import { DEFAULT_MODEL } from "../config.js";
import { requireApiKey } from "../load-env.js";
import { MASTER_PROMPT_PATH } from "./paths.js";
import { BUILD_PHASES } from "./phases.js";
import { buildPhasePrompt } from "./prompt.js";
import { streamRun } from "./stream.js";

const repoUrl = process.env.REPO_URL?.trim();
if (!repoUrl) {
  console.error("Set REPO_URL to your team's GitHub repository.");
  process.exit(1);
}

const from = Number(process.env.PHASE_FROM ?? "1");
const to = Number(process.env.PHASE_TO ?? "11");
const phases = BUILD_PHASES.filter((p) => p.id >= from && p.id <= to);

const master = existsSync(MASTER_PROMPT_PATH)
  ? readFileSync(MASTER_PROMPT_PATH, "utf8")
  : "";

const agent = await Agent.create({
  apiKey: requireApiKey(),
  model: DEFAULT_MODEL,
  cloud: {
    repos: [{ url: repoUrl, startingRef: process.env.REPO_REF ?? "main" }],
    autoCreatePR: process.env.AUTO_PR === "1",
    skipReviewerRequest: true,
  },
});

console.log(`Cloud agent ${agent.agentId} → ${repoUrl}\n`);

try {
  for (const phase of phases) {
    console.log(`━━━ Phase ${phase.id}: ${phase.title} ━━━\n`);
    const prompt =
      phase.id === 1
        ? `${master}\n\n---\n\n${buildPhasePrompt(phase, true)}`
        : buildPhasePrompt(phase, false);

    let run;
    try {
      run = await agent.send(prompt);
    } catch (err) {
      if (err instanceof CursorAgentError) {
        console.error(err.message);
        process.exit(1);
      }
      throw err;
    }

    await streamRun(run, `cloud-phase-${phase.id}`);
    const result = await run.wait();

    if (result.status === "error") {
      console.error(`Phase ${phase.id} failed`);
      process.exit(2);
    }

    if (result.git?.branches?.length) {
      for (const b of result.git.branches) {
        if (b.prUrl) console.log(`PR: ${b.prUrl}`);
      }
    }
  }
} finally {
  await agent[Symbol.asyncDispose]();
}
