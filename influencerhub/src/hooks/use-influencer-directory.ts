import { useQuery } from "@tanstack/react-query";

import { isSupabaseConfigured, supabase } from "@/integrations/supabase/client";

export function useFeaturedEliteInfluencers(limit = 6) {
  return useQuery({
    queryKey: ["influencers", "featured-elite", limit],
    enabled: isSupabaseConfigured,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("public_list_influencers", {
        p_search: null,
        p_category: null,
        p_location: null,
        p_platform: null,
        p_min_followers: null,
        p_max_followers: null,
        p_plan: "elite",
        p_limit: limit,
      });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export interface DirectoryFilters {
  search: string;
  category: string;
  location: string;
  platform: string;
  minFollowers: string;
  maxFollowers: string;
}

function emptyToNull(s: string): string | null {
  const t = s.trim();
  return t === "" ? null : t;
}

function intOrNull(s: string): number | null {
  const t = s.trim();
  if (t === "") return null;
  const n = Number.parseInt(t, 10);
  return Number.isFinite(n) ? n : null;
}

export function useDirectoryInfluencers(filters: DirectoryFilters) {
  return useQuery({
    queryKey: ["influencers", "directory", filters],
    enabled: isSupabaseConfigured,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("public_list_influencers", {
        p_search: emptyToNull(filters.search),
        p_category: emptyToNull(filters.category),
        p_location: emptyToNull(filters.location),
        p_platform: emptyToNull(filters.platform),
        p_min_followers: intOrNull(filters.minFollowers),
        p_max_followers: intOrNull(filters.maxFollowers),
        p_plan: null,
        p_limit: null,
      });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function usePublicInfluencer(userId: string | undefined) {
  return useQuery({
    queryKey: ["influencers", "detail", userId],
    enabled: isSupabaseConfigured && Boolean(userId),
    queryFn: async () => {
      if (!userId) return null;
      const { data, error } = await supabase.rpc("public_get_influencer", {
        p_user_id: userId,
      });
      if (error) throw error;
      return data?.[0] ?? null;
    },
  });
}
