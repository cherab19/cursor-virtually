import { supabase } from "@/integrations/supabase/client";
import type { PublicInfluencerRow } from "@/lib/influencer-format";

export type ListInfluencersParams = {
  search?: string | null;
  category?: string | null;
  location?: string | null;
  platform?: string | null;
  minFollowers?: number | null;
  maxFollowers?: number | null;
  plan?: string | null;
  limit?: number | null;
};

type InfluencerProfileRow = {
  user_id: string;
  bio: string;
  category: string;
  location: string;
  followers_count: number;
  engagement_rate: number | null;
  ad_price_etb: number | null;
  subscription_plan: string;
  is_verified: boolean;
};

type ProfileRow = {
  user_id: string;
  full_name: string;
  avatar_url: string | null;
};

function mergeRows(influencers: InfluencerProfileRow[], profiles: ProfileRow[]): PublicInfluencerRow[] {
  const profileMap = new Map(profiles.map((p) => [p.user_id, p]));
  return influencers.map((ip) => {
    const profile = profileMap.get(ip.user_id);
    return {
      user_id: ip.user_id,
      full_name: profile?.full_name ?? "Creator",
      avatar_url: profile?.avatar_url ?? null,
      bio: ip.bio,
      category: ip.category,
      location: ip.location,
      followers_count: ip.followers_count,
      engagement_rate: ip.engagement_rate,
      ad_price_etb: ip.ad_price_etb,
      subscription_plan: ip.subscription_plan,
      is_verified: ip.is_verified,
    };
  });
}

/** Build RPC args — omit nulls; PostgREST handles defaults more reliably. */
function rpcArgs(params: ListInfluencersParams): Record<string, string | number> {
  const args: Record<string, string | number> = {};
  if (params.search) args.p_search = params.search;
  if (params.category) args.p_category = params.category;
  if (params.location) args.p_location = params.location;
  if (params.platform) args.p_platform = params.platform;
  if (params.minFollowers != null) args.p_min_followers = params.minFollowers;
  if (params.maxFollowers != null) args.p_max_followers = params.maxFollowers;
  if (params.plan) args.p_plan = params.plan;
  if (params.limit != null) args.p_limit = params.limit;
  return args;
}

async function listViaRpc(params: ListInfluencersParams): Promise<PublicInfluencerRow[]> {
  const { data, error } = await supabase.rpc("public_list_influencers", rpcArgs(params));
  if (error) throw error;
  return (data ?? []) as PublicInfluencerRow[];
}

/** Fallback when RPC is missing or not yet granted (uses RLS on approved profiles). */
async function listViaTables(params: ListInfluencersParams): Promise<PublicInfluencerRow[]> {
  let query = supabase
    .from("influencer_profiles")
    .select(
      "user_id, bio, category, location, followers_count, engagement_rate, ad_price_etb, subscription_plan, is_verified",
    )
    .eq("status", "approved");

  if (params.plan) query = query.eq("subscription_plan", params.plan);
  if (params.category) query = query.ilike("category", `%${params.category}%`);
  if (params.location) query = query.ilike("location", `%${params.location}%`);
  if (params.minFollowers != null) query = query.gte("followers_count", params.minFollowers);
  if (params.maxFollowers != null) query = query.lte("followers_count", params.maxFollowers);

  const limit = params.limit ?? 500;
  query = query.order("followers_count", { ascending: false }).limit(limit);

  const { data: influencers, error } = await query;
  if (error) throw error;
  if (!influencers?.length) return [];

  const ids = influencers.map((r) => r.user_id);
  const { data: profiles, error: profileError } = await supabase
    .from("profiles")
    .select("user_id, full_name, avatar_url")
    .in("user_id", ids);
  if (profileError) throw profileError;

  let rows = mergeRows(influencers as InfluencerProfileRow[], (profiles ?? []) as ProfileRow[]);

  if (params.search?.trim()) {
    const q = params.search.trim().toLowerCase();
    rows = rows.filter(
      (r) =>
        r.full_name.toLowerCase().includes(q) ||
        r.bio.toLowerCase().includes(q) ||
        r.category.toLowerCase().includes(q) ||
        r.location.toLowerCase().includes(q),
    );
  }

  rows.sort((a, b) => {
    const planOrder = (p: string) => (p === "elite" ? 0 : p === "pro" ? 1 : 2);
    const d = planOrder(a.subscription_plan) - planOrder(b.subscription_plan);
    if (d !== 0) return d;
    if (a.is_verified !== b.is_verified) return a.is_verified ? -1 : 1;
    return b.followers_count - a.followers_count;
  });

  return rows;
}

export async function listPublicInfluencers(params: ListInfluencersParams = {}): Promise<PublicInfluencerRow[]> {
  try {
    return await listViaRpc(params);
  } catch (rpcError) {
    if (isSchemaNotReadyError(rpcError)) {
      throw rpcError;
    }
    if (import.meta.env.DEV) {
      console.warn("[directory] RPC failed, using table fallback:", rpcError);
    }
    return listViaTables(params);
  }
}

export function isSchemaNotReadyError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const code = "code" in error ? String((error as { code: string }).code) : "";
  const message = "message" in error ? String((error as { message: string }).message) : "";
  return (
    code === "PGRST202" ||
    code === "PGRST205" ||
    /schema cache/i.test(message) ||
    /Could not find the (function|table)/i.test(message)
  );
}

export function directoryErrorMessage(error: unknown): string {
  if (isSchemaNotReadyError(error)) {
    return "Database schema not applied. Run supabase/APPLY_IN_SQL_EDITOR.sql in your Supabase SQL Editor, then refresh.";
  }
  if (error && typeof error === "object" && "message" in error) {
    return String((error as { message: string }).message);
  }
  return "Unknown error";
}
