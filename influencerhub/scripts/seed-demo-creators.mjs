/**
 * Seeds approved Elite/Pro demo creators for local Supabase.
 * Requires: npx supabase start
 * Run: npm run db:seed
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env.VITE_SUPABASE_URL ?? "http://127.0.0.1:54321";
const serviceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SB_SECRET_KEY;

if (!serviceKey) {
  console.error(
    "Missing SUPABASE_SERVICE_ROLE_KEY. Run: npx supabase status -o env",
  );
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const DEMO_CREATORS = [
  {
    email: "selam.elite@influencerhub.local",
    password: "demo-creator-1",
    full_name: "Selam Tesfaye",
    role: "influencer",
    plan: "elite",
    bio: "Lifestyle and beauty creator based in Addis Ababa.",
    category: "Beauty & lifestyle",
    location: "Addis Ababa",
    followers_count: 128000,
    is_verified: true,
  },
  {
    email: "dawit.pro@influencerhub.local",
    password: "demo-creator-2",
    full_name: "Dawit Bekele",
    role: "influencer",
    plan: "pro",
    bio: "Tech reviews and product launches for Ethiopian startups.",
    category: "Technology",
    location: "Addis Ababa",
    followers_count: 54000,
    is_verified: true,
  },
  {
    email: "hanna.elite@influencerhub.local",
    password: "demo-creator-3",
    full_name: "Hanna Girma",
    role: "influencer",
    plan: "elite",
    bio: "Food and travel content across Ethiopia.",
    category: "Food & travel",
    location: "Bahir Dar",
    followers_count: 91000,
    is_verified: true,
  },
];

async function ensureUser(creator) {
  const { data: list } = await admin.auth.admin.listUsers({ perPage: 1000 });
  const existing = list?.users?.find((u) => u.email === creator.email);
  if (existing) return existing.id;

  const { data, error } = await admin.auth.admin.createUser({
    email: creator.email,
    password: creator.password,
    email_confirm: true,
    user_metadata: {
      full_name: creator.full_name,
      role: creator.role,
    },
  });
  if (error) throw error;
  return data.user.id;
}

async function upsertInfluencerProfile(userId, creator) {
  const { error } = await admin.from("influencer_profiles").upsert(
    {
      user_id: userId,
      bio: creator.bio,
      category: creator.category,
      location: creator.location,
      followers_count: creator.followers_count,
      subscription_plan: creator.plan,
      status: "approved",
      is_verified: creator.is_verified,
    },
    { onConflict: "user_id" },
  );
  if (error) throw error;
}

async function main() {
  for (const creator of DEMO_CREATORS) {
    const userId = await ensureUser(creator);
    await upsertInfluencerProfile(userId, creator);
    console.log(`Seeded ${creator.full_name} (${creator.plan})`);
  }
  console.log("Done. Featured creators should appear on the landing page.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
