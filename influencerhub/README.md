# InfluencerHub

Vite + React + TypeScript SPA with Supabase (Postgres, Auth, Storage, Edge Functions). Influencer marketplace for Ethiopia: directory, campaigns, messaging, payments (Chapa), and admin moderation.

## Prerequisites

- Node 20+
- A [Supabase](https://supabase.com) project with migrations from `supabase/migrations/` applied
- Optional: [Vercel](https://vercel.com) for hosting

## Local development

```bash
cp .env.example .env
# Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY

npm install
npm run dev
```

Open the URL Vite prints (typically http://localhost:5173).

### SEO / canonical URLs (optional)

Set `VITE_SITE_URL` to your public origin (no trailing slash), e.g. `https://app.example.com`. This powers canonical links and JSON-LD in `react-helmet-async`.

After deploying, update **`public/sitemap.xml`** and **`public/robots.txt`** so `loc` and `Sitemap:` match that same origin.

## Build

```bash
npm run build
npm run preview
```

## Deploy (Vercel)

1. Connect this repo (root directory **`influencerhub`**) to Vercel.
2. **Framework preset:** Vite (or leave auto-detect).
3. **Build command:** `npm run build`
4. **Output directory:** `dist`
5. **Environment variables** (Production + Preview):
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY` (or `VITE_SUPABASE_ANON_KEY`)
   - `VITE_SITE_URL` — your Vercel URL or custom domain (for SEO meta)
6. **`vercel.json`** configures SPA fallback to `index.html` and security headers.
7. Replace placeholder URLs in **`public/sitemap.xml`** and **`public/robots.txt`** with your production origin.
8. Configure Supabase **Edge Function** secrets in the Supabase dashboard — never put service role or Chapa secrets in `VITE_*` vars.

## SDK orchestrator (optional)

This tree is often built by the **Cursor Agent SDK** under `../hackathon-agent/`:

```bash
cd ../hackathon-agent
npm run build:influencerhub -- --resume
```

## Scripts

| Command           | Description                  |
| ----------------- | ---------------------------- |
| `npm run dev`     | Vite dev server              |
| `npm run build`   | Typecheck + production bundle |
| `npm run lint`    | ESLint                       |
| `npm run preview` | Static preview of `dist`     |
