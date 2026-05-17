import { mkdirSync, appendFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { Agent, CursorAgentError } from "@cursor/sdk";
import type { AgentOptions } from "@cursor/sdk";
import { localAgentOptions } from "../config.js";
import { INFLUENCERHUB_CWD } from "./paths.js";
import { BUILD_PHASES, type BuildPhase } from "./phases.js";
import { buildPhasePrompt } from "./prompt.js";
import { loadState, saveState, markPhaseComplete } from "./state.js";
import { streamRun } from "./stream.js";

export type OrchestratorOptions = {
  fromPhase?: number;
  toPhase?: number;
  singlePhase?: number;
  resume?: boolean;
  dryRun?: boolean;
  fresh?: boolean;
};

function agentOptionsForTarget(): AgentOptions {
  mkdirSync(INFLUENCERHUB_CWD, { recursive: true });
  return localAgentOptions(INFLUENCERHUB_CWD);
}

function resolvePhases(opts: OrchestratorOptions): BuildPhase[] {
  if (opts.singlePhase != null) {
    const p = BUILD_PHASES.find((x) => x.id === opts.singlePhase);
    if (!p) throw new Error(`Unknown phase id: ${opts.singlePhase}`);
    return [p];
  }
  const from = opts.fromPhase ?? 1;
  const to = opts.toPhase ?? 11;
  return BUILD_PHASES.filter((p) => p.id >= from && p.id <= to);
}

export async function runInfluencerHubBuild(
  opts: OrchestratorOptions = {},
): Promise<void> {
  const phases = resolvePhases(opts);
  let state = loadState();

  console.log("\n╔══════════════════════════════════════════════════╗");
  console.log("║  InfluencerHub — Cursor Agent SDK Build          ║");
  console.log("╚══════════════════════════════════════════════════╝\n");
  console.log(`Target: ${INFLUENCERHUB_CWD}`);
  console.log(
    `Phases: ${phases.map((p) => p.id).join(", ")} (${phases.length} run(s))\n`,
  );

  if (opts.dryRun) {
    for (const p of phases) {
      console.log(`  [dry-run] Phase ${p.id}: ${p.title}`);
    }
    return;
  }

  const options = agentOptionsForTarget();
  let agent: Awaited<ReturnType<typeof Agent.create>>;

  if (opts.resume && state.agentId) {
    console.log(`Resuming agent ${state.agentId}…\n`);
    agent = await Agent.resume(state.agentId, options);
  } else {
    agent = await Agent.create(options);
    state.agentId = agent.agentId;
    saveState(state);
    console.log(`Agent ${agent.agentId} created.\n`);
  }

  try {
    for (const phase of phases) {
      if (state.completedPhaseIds.includes(phase.id) && !opts.singlePhase) {
        console.log(`⏭  Phase ${phase.id} already complete — skipping\n`);
        continue;
      }

      const isFirstRun = phase.id === 1 && !state.completedPhaseIds.length;
      const prompt = buildPhasePrompt(phase, isFirstRun, opts.fresh);

      console.log(`━━━ Phase ${phase.id}/11: ${phase.title} ━━━\n`);

      let run;
      try {
        run = await agent.send(prompt);
      } catch (err) {
        if (err instanceof CursorAgentError) {
          console.error(`\n✗ Startup failed: ${err.message}`);
          console.error(`  retryable=${err.isRetryable}`);
          process.exit(1);
        }
        throw err;
      }

      console.log(dimRunId(run.id));
      await streamRun(run, `phase-${phase.id}`);

      const result = await run.wait();
      state.lastRunId = run.id;
      saveState(state);

      if (result.status === "error") {
        console.error(`\n✗ Phase ${phase.id} run failed (run ${run.id})`);
        console.error("  Fix issues, then: npm run build:influencerhub -- --resume --from", phase.id);
        process.exit(2);
      }

      state = markPhaseComplete(state, phase.id);
      saveState(state);

      const logDir = resolve(dirname(fileURLToPath(import.meta.url)), "../../logs");
      mkdirSync(logDir, { recursive: true });
      appendFileSync(
        resolve(logDir, "sdk-build-log.jsonl"),
        JSON.stringify({
          ts: new Date().toISOString(),
          phase: phase.id,
          slug: phase.slug,
          agentId: state.agentId,
          runId: run.id,
          status: result.status,
          sdk: "@cursor/sdk",
        }) + "\n",
      );

      console.log(`\n✓ Phase ${phase.id} finished (${result.status})\n`);
    }

    console.log("═══════════════════════════════════════════════════");
    console.log("Build orchestration complete.");
    console.log(`Completed phases: ${state.completedPhaseIds.join(", ") || "(none)"}`);
    console.log(`Agent id (resume): ${state.agentId}`);
    console.log("Next: cd ../influencerhub && npm run dev");
    console.log("═══════════════════════════════════════════════════\n");
  } finally {
    await agent[Symbol.asyncDispose]();
  }
}

function dimRunId(runId: string): string {
  return `\x1b[2mrun ${runId}\x1b[0m\n`;
}
