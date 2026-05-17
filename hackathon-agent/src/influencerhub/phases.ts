export type BuildPhase = {
  id: number;
  slug: string;
  title: string;
  /** Scoped instructions for this phase only. */
  instructions: string;
  /** Commands the agent should run before marking the phase complete. */
  verify: string[];
};

export const BUILD_PHASES: BuildPhase[] = [
  {
    id: 1,
    slug: "scaffold",
    title: "Scaffold Vite + Tailwind + shadcn + design tokens",
    instructions: `Create the app at the target cwd (use \`influencerhub/\` as project root if empty).
- Vite + React 18 + TypeScript
- Tailwind + shadcn/ui init with Plus Jakarta Sans + Inter
- HSL semantic tokens in src/index.css (--primary, --accent, navy, amber)
- Basic App shell and react-router-dom routes stub
- package.json scripts: dev, build, lint`,
    verify: ["npm install", "npm run build"],
  },
  {
    id: 2,
    slug: "supabase-schema",
    title: "Supabase schema + RLS + triggers + seed plans",
    instructions: `Add supabase/ migrations for full schema from master spec.
- app_role enum, user_roles + has_role() SECURITY DEFINER
- All tables with RLS on every table
- handle_new_user() trigger from raw_user_meta_data.role
- Validation triggers (not CHECK) for time-based rules
- Seed subscription_plans: Free, Pro (299 ETB), Elite (699 ETB)
- Enable realtime on messages
- .env.example with VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY`,
    verify: [],
  },
  {
    id: 3,
    slug: "auth",
    title: "Auth flow + AuthContext + ProtectedRoute",
    instructions: `Implement /auth with role selector at signup.
- Supabase client, onAuthStateChange BEFORE getSession()
- AuthContext, ProtectedRoute with allowedRoles per dashboard
- Wire routes for /dashboard/influencer|advertiser|admin`,
    verify: ["npm run build"],
  },
  {
    id: 4,
    slug: "public-pages",
    title: "Landing, directory, profile, pricing",
    instructions: `Build public pages with design tokens only (no raw Tailwind colors).
- Landing: hero, featured Elite influencers, CTA
- Directory: search, filters, Elite ranks first
- /influencer/:id profile + contact modal stub
- /pricing three tiers`,
    verify: ["npm run build"],
  },
  {
    id: 5,
    slug: "influencer-dashboard",
    title: "Influencer dashboard + onboarding + avatar",
    instructions: `/dashboard/influencer with sidebar layout.
- 5-step onboarding wizard when profile incomplete
- Profile edit, avatar upload to Supabase Storage
- Overview + placeholder analytics hooks`,
    verify: ["npm run build"],
  },
  {
    id: 6,
    slug: "advertiser-dashboard",
    title: "Advertiser dashboard + campaign CRUD",
    instructions: `/dashboard/advertiser: campaigns CRUD, discover, applications list.
- Create campaign form (title, brief, budget, targets, deadline)
- Application accept/reject one-click`,
    verify: ["npm run build"],
  },
  {
    id: 7,
    slug: "messaging",
    title: "Real-time messaging",
    instructions: `Messages table realtime + thread UI both dashboards.
- useUnreadMessages hook, sidebar badge, toast on new message
- react-query for threads`,
    verify: ["npm run build"],
  },
  {
    id: 8,
    slug: "admin-dashboard",
    title: "Admin approvals + verification",
    instructions: `/dashboard/admin: pending queue, verify toggle, user list, payment logs, KPI cards with recharts.`,
    verify: ["npm run build"],
  },
  {
    id: 9,
    slug: "chapa",
    title: "Chapa payment edge functions",
    instructions: `supabase/functions/chapa-initialize and chapa-verify.
- Never expose CHAPA_SECRET_KEY in frontend
- Subscription + payments table updates on success`,
    verify: [],
  },
  {
    id: 10,
    slug: "reviews-ranking",
    title: "Reviews + verification badges + Elite ranking",
    instructions: `Reviews on profiles, verified badge UI, directory sort Elite > Pro > Free.`,
    verify: ["npm run build"],
  },
  {
    id: 11,
    slug: "polish-deploy",
    title: "SEO, responsive QA, deploy config",
    instructions: `Meta tags, JSON-LD, sitemap, vercel.json, README deploy steps.
- Fix any TS/console errors
- Empty/loading/error states on all forms`,
    verify: ["npm run build"],
  },
];

export function getPhase(id: number): BuildPhase | undefined {
  return BUILD_PHASES.find((p) => p.id === id);
}
