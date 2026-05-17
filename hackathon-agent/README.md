# Hackathon Agent SDK Starter

Ready-to-run setup for the [Ethiopian Cursor Community Sunday hackathon](https://ethiopian-cursor-community.github.io/fqa/). The only stack constraint is **something built with the [Cursor Agent SDK](https://cursor.com/docs/api/sdk/typescript)** (`@cursor/sdk`).

## Before Sunday

1. **Update Cursor** to Cursor 3 (new agent window).
2. **Node 18+** installed.
3. **API key** from [Dashboard → Integrations](https://cursor.com/dashboard/integrations):
   ```bash
   cp .env.example .env
   # edit .env → CURSOR_API_KEY=cursor_...
   ```
4. **Verify setup** (do this Saturday, not Sunday morning):
   ```bash
   npm install
   npm run verify
   ```

## Commands

| Command | What it does |
|---------|----------------|
| `npm run verify` | Auth check + optional local agent smoke test |
| `npm run example:prompt -- "your task"` | One-shot `Agent.prompt()` |
| `npm run example:stream` | Streaming agent + follow-up |
| `npm run example:cloud` | Cloud agent (needs `REPO_URL` + plan) |
| `npm run typecheck` | TypeScript check |

## Three patterns (pick one for your MVP)

1. **One-shot** — `src/examples/one-shot-prompt.ts` — fastest for scripts and demos.
2. **Streaming + follow-ups** — `src/examples/streaming-agent.ts` — chatbots, multi-step builds.
3. **Cloud + PRs** — `src/examples/cloud-agent.ts` — long jobs on a cloned repo.

Docs: [TypeScript SDK](https://cursor.com/docs/api/sdk/typescript)

## Hackathon constraints (from FAQ)

- Build **during** the session; don't pre-ship the whole MVP.
- Team repo lives in the **Ethiopian Cursor Community** GitHub org (created Saturday).
- Teams of 3, random assignment; coordinate in Telegram.

## Local vs cloud

| Runtime | When to use |
|---------|-------------|
| **Local** (`local: { cwd }`) | Dev machine, repo already checked out — **default for hackathon velocity** |
| **Cloud** (`cloud: { repos }`) | Parallel agents, no local checkout, auto-PR — needs **Pro** (or higher) on your Cursor plan |

On a free plan, `npm run verify` may warn about cloud APIs but **local examples still work** if Cursor 3 is installed on your machine.

## Project layout

```
src/
  load-env.ts          # loads .env
  config.ts            # shared apiKey, model, cwd
  verify-setup.ts      # npm run verify
  examples/
    one-shot-prompt.ts
    streaming-agent.ts
    cloud-agent.ts
```

## InfluencerHub — truly SDK-built

See **[SDK_BUILD.md](./SDK_BUILD.md)** for the full runbook.

| Command | What it does |
|---------|----------------|
| `npm run build:influencerhub:fresh` | **Backup app + reset + all 11 SDK phases** |
| `npm run build:influencerhub` | Continue / run phases (local `Agent.create`) |
| `npm run build:influencerhub -- --resume --from N` | Resume after failure |
| `REPO_URL=... npm run build:influencerhub:cloud` | Cloud agent (Pro+) |

Requires `CURSOR_API_KEY` in `.env` or environment. Proof of SDK build: `logs/sdk-build-log.jsonl` + `.influencerhub-build-state.json`.

Master spec: `prompts/influencerhub-master.md`

## Build your own idea

Copy an example into `src/your-app.ts`, wire your product logic around `Agent.create()` or `Agent.prompt()`, and iterate. Sunday is about velocity — polish later.
