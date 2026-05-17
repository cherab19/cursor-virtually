# Cursor Virtual Hackathon — Agent SDK

Personal repo for the [Ethiopian Cursor Community virtual hackathon](https://ethiopian-cursor-community.github.io/fqa/). Built with the [Cursor Agent SDK](https://cursor.com/docs/api/sdk/typescript) (`@cursor/sdk`).

## Quick start

```bash
cd hackathon-agent
cp .env.example .env   # add CURSOR_API_KEY from dashboard
npm install
npm run verify
```

## What's inside

| Path | Description |
|------|-------------|
| [`hackathon-agent/`](hackathon-agent/) | TypeScript starter: verify script, local streaming agent, one-shot prompt, cloud agent example |

## Commands

Run from `hackathon-agent/`:

- `npm run verify` — API key + local agent smoke test
- `npm run example:prompt -- "task"` — one-shot `Agent.prompt()`
- `npm run example:stream` — streaming agent with follow-ups
- `npm run example:cloud` — cloud agent (needs `REPO_URL` + Pro plan)

See [hackathon-agent/README.md](hackathon-agent/README.md) for full setup and hackathon constraints.
