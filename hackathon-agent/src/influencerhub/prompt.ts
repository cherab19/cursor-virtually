import { readFileSync, existsSync } from "node:fs";
import type { BuildPhase } from "./phases.js";
import { INFLUENCERHUB_CWD, MASTER_PROMPT_PATH } from "./paths.js";

function loadMasterSpec(): string {
  if (!existsSync(MASTER_PROMPT_PATH)) {
    return "(Master spec file missing — follow phase instructions.)";
  }
  return readFileSync(MASTER_PROMPT_PATH, "utf8");
}

export function buildPhasePrompt(
  phase: BuildPhase,
  isFirstRun: boolean,
  fresh = false,
): string {
  const master = loadMasterSpec();

  const freshNote = fresh
    ? `
## CRITICAL: Fresh SDK build
This directory was reset for an autonomous SDK build. Create all files from scratch.
Any prior manual code was backed up elsewhere — do not reference it.
`
    : "";

  return `${isFirstRun ? master + "\n\n---\n\n" : ""}# PHASE ${phase.id}/11: ${phase.title}
${freshNote}
You are building **InfluencerHub** in this directory (absolute path):
\`${INFLUENCERHUB_CWD}\`

All application code, Supabase migrations, and edge functions go under that path.
The Cursor Agent SDK orchestrator lives in a sibling folder — do not put the Vite app inside hackathon-agent.

## This phase only
${phase.instructions}

## Rules
- Complete ONLY this phase; do not skip ahead to later features.
- Match the master spec for security (user_roles + has_role(), RLS everywhere).
- Use semantic design tokens — never raw Tailwind palette classes in components.
- When done, summarize files changed and what to test manually.

## Verification (required before you finish)
${phase.verify.length ? phase.verify.map((c) => `- Run: \`${c}\` in \`${INFLUENCERHUB_CWD}\` and fix failures`).join("\n") : "- Ensure migrations and types are consistent; run build if a frontend exists."}

Reply with a short **PHASE_COMPLETE** section listing: done items, verify commands run, and blockers (if any).`;
}
