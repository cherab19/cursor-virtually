/**
 * Creates a local admin account and grants the admin role.
 * Requires: npx supabase start
 * Run: npm run db:seed-admin
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

const ADMIN = {
  email: process.env.ADMIN_EMAIL ?? "admin@influencerhub.local",
  password: process.env.ADMIN_PASSWORD ?? "demo-admin-2025",
  full_name: "Platform Admin",
};

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function ensureAdminUser() {
  const { data: list } = await admin.auth.admin.listUsers({ perPage: 1000 });
  const existing = list?.users?.find((u) => u.email === ADMIN.email);

  if (existing) {
    return existing.id;
  }

  const { data, error } = await admin.auth.admin.createUser({
    email: ADMIN.email,
    password: ADMIN.password,
    email_confirm: true,
    user_metadata: {
      full_name: ADMIN.full_name,
      role: "admin",
    },
  });
  if (error) throw error;
  return data.user.id;
}

async function ensureAdminRole(userId) {
  const { error } = await admin.from("user_roles").upsert(
    { user_id: userId, role: "admin" },
    { onConflict: "user_id,role" },
  );
  if (error) throw error;
}

async function main() {
  const userId = await ensureAdminUser();
  await ensureAdminRole(userId);

  console.log("Local admin ready.");
  console.log(`  Sign in: ${ADMIN.email}`);
  console.log(`  Password: ${ADMIN.password}`);
  console.log("  Dashboard: http://localhost:5173/dashboard/admin");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
