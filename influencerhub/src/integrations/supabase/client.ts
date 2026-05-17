import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/integrations/supabase/database.types";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim() ?? "";

/** Supports Supabase dashboard "publishable" key or legacy anon key env names. */
const supabaseKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim() ||
  import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() ||
  "";

/** True when real project credentials are in .env / Vite env. */
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey);

let client: SupabaseClient<Database> | null = null;

function getOrCreateClient(): SupabaseClient<Database> {
  if (!isSupabaseConfigured) {
    throw new Error(
      "Supabase is not configured. Copy .env.example to .env and set VITE_SUPABASE_URL plus VITE_SUPABASE_PUBLISHABLE_KEY (or VITE_SUPABASE_ANON_KEY).",
    );
  }
  if (!client) {
    client = createClient<Database>(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }
  return client;
}

/**
 * Supabase client — only call API methods when {@link isSupabaseConfigured} is true.
 * Avoids crashing the app at import time when .env is missing (blank screen).
 */
export const supabase = new Proxy({} as SupabaseClient<Database>, {
  get(_target, prop) {
    const real = getOrCreateClient();
    const value = Reflect.get(real, prop, real);
    return typeof value === "function" ? value.bind(real) : value;
  },
});

export function assertSupabaseConfig(): void {
  if (!isSupabaseConfigured && import.meta.env.DEV) {
    console.warn(
      "[InfluencerHub] Running without Supabase — set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in .env",
    );
  }
}
