# Truly SDK-built InfluencerHub

This guide runs InfluencerHub through **`@cursor/sdk`** only — not manual chat edits.

## Prerequisites

1. **Cursor 3** installed (local agent runtime).
2. **API key** from [Dashboard → Integrations](https://cursor.com/dashboard/integrations).
3. Node 18+.

## One-time setup

```bash
cd hackathon-agent
cp .env.example .env
# Edit .env: CURSOR_API_KEY=cursor_...
npm install
npm run verify
```

`npm run verify` must print `✓ Local agent ran successfully` before the full build.

## Fresh SDK build (recommended)

Backs up any existing `../influencerhub/`, resets phase state, runs all 11 phases:

```bash
npm run build:influencerhub:fresh
```

Estimated time: **1–3 hours** (depends on plan and machine). You will see streaming tool calls in the terminal.

## Incremental / resume

```bash
npm run build:influencerhub -- --phase 1
npm run build:influencerhub -- --from 2 --to 5
npm run build:influencerhub -- --resume --from 6   # after failure
```

## Cloud build (no local Cursor CLI)

Requires **Pro+** and a GitHub repo:

```bash
export REPO_URL=https://github.com/YOUR_ORG/YOUR_REPO
export CURSOR_API_KEY=cursor_...
npm run build:influencerhub:cloud
```

## Proof it was SDK-built

After a run, check:

- `hackathon-agent/.influencerhub-build-state.json` — `agentId`, `completedPhaseIds`, `lastRunId`
- Terminal logs showing `[tool]` lines from the SDK stream
- Fresh backup folder: `influencerhub-backup-<timestamp>/` (from `--fresh`)

## After build

```bash
cd ../influencerhub
npm install
npm run dev
```

Configure Supabase per `influencerhub/.env.example` for production.
