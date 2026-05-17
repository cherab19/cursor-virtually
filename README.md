# Cursor Virtual Hackathon — InfluencerHub

Ethiopian influencer–advertiser marketplace built with the [Cursor Agent SDK](https://cursor.com/docs/api/sdk/typescript) for the [Ethiopian Cursor Community hackathon](https://ethiopian-cursor-community.github.io/fqa/).

## Repositories in this monorepo

| Path | Description |
|------|-------------|
| [`influencerhub/`](influencerhub/) | **InfluencerHub** — React + Supabase SaaS (directory, campaigns, messaging, Chapa, admin) |
| [`hackathon-agent/`](hackathon-agent/) | Phased SDK orchestrator that autonomously builds `influencerhub/` |

## Quick start

### InfluencerHub app

```bash
cd influencerhub
cp .env.example .env   # VITE_SUPABASE_URL + VITE_SUPABASE_PUBLISHABLE_KEY
npm install
npm run dev
```

See [influencerhub/README.md](influencerhub/README.md) for Supabase migrations, deploy, and demo script.

### SDK builder (optional)

```bash
cd hackathon-agent
cp .env.example .env   # CURSOR_API_KEY
npm install
npm run verify
npm run build:influencerhub:fresh
```

See [hackathon-agent/SDK_BUILD.md](hackathon-agent/SDK_BUILD.md).
