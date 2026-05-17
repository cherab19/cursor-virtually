#!/usr/bin/env node
/**
 * InfluencerHub autonomous build — phased Cursor Agent SDK orchestrator.
 *
 * Usage:
 *   npm run build:influencerhub              # phases 1–11
 *   npm run build:influencerhub -- --phase 3 # single phase
 *   npm run build:influencerhub -- --from 5 --to 7
 *   npm run build:influencerhub -- --resume --from 5
 *   npm run build:influencerhub -- --dry-run
 *   npm run build:influencerhub:fresh          # backup + reset + phases 1–11
 */
import "../load-env.js";
import { requireApiKey } from "../load-env.js";
import { runInfluencerHubBuild } from "./orchestrator.js";
import { prepareFreshSdkBuild } from "./fresh.js";

function printHelp(): void {
  console.log(`
InfluencerHub SDK builder

  npm run build:influencerhub [options]

Options:
  --fresh         Backup ../influencerhub, reset state, build from scratch (SDK-only)
  --phase <n>     Run only phase n (1–11)
  --from <n>      Start at phase n (default 1)
  --to <n>        End at phase n (default 11)
  --resume        Resume agent id from .influencerhub-build-state.json
  --dry-run       List phases without calling the agent
  -h, --help      This message

Env:
  INFLUENCERHUB_CWD   App output directory (default: ../influencerhub)
  CURSOR_API_KEY      Required in hackathon-agent/.env
`);
}

function parseArgs(argv: string[]) {
  const opts: {
    fromPhase?: number;
    toPhase?: number;
    singlePhase?: number;
    resume?: boolean;
    dryRun?: boolean;
    fresh?: boolean;
  } = {};

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "-h" || a === "--help") {
      printHelp();
      process.exit(0);
    }
    if (a === "--fresh") opts.fresh = true;
    if (a === "--resume") opts.resume = true;
    else if (a === "--dry-run") opts.dryRun = true;
    else if (a === "--phase") opts.singlePhase = Number(argv[++i]);
    else if (a === "--from") opts.fromPhase = Number(argv[++i]);
    else if (a === "--to") opts.toPhase = Number(argv[++i]);
  }

  return opts;
}

const opts = parseArgs(process.argv.slice(2));

if (!opts.dryRun) {
  try {
    requireApiKey();
  } catch {
    console.error(`
✗ CURSOR_API_KEY is required for SDK builds.

  Option A — file:
    cd hackathon-agent && cp .env.example .env
    # paste key from https://cursor.com/dashboard/integrations

  Option B — env var:
    export CURSOR_API_KEY=cursor_...
`);
    process.exit(1);
  }
}

if (opts.fresh && !opts.dryRun) {
  prepareFreshSdkBuild();
  opts.resume = false;
}

await runInfluencerHubBuild(opts);
