import { useQuery } from "@tanstack/react-query";

import { isSupabaseConfigured } from "@/integrations/supabase/client";
import { listPublicInfluencers } from "@/lib/directory-api";

export function useFeaturedEliteInfluencers(limit = 6) {
  return useQuery({
    queryKey: ["influencers", "featured-elite", limit],
    enabled: isSupabaseConfigured,
    queryFn: async () => {
      const elite = await listPublicInfluencers({ plan: "elite", limit });
      if (elite.length > 0) return elite;
      return listPublicInfluencers({ limit });
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
    queryFn: () =>
      listPublicInfluencers({
        search: emptyToNull(filters.search),
        category: emptyToNull(filters.category),
        location: emptyToNull(filters.location),
        platform: emptyToNull(filters.platform),
        minFollowers: intOrNull(filters.minFollowers),
        maxFollowers: intOrNull(filters.maxFollowers),
        limit: null,
      }),
  });
}

export function usePublicInfluencer(userId: string | undefined) {
  return useQuery({
    queryKey: ["influencers", "detail", userId],
    enabled: isSupabaseConfigured && Boolean(userId),
    queryFn: async () => {
      if (!userId) return null;
      const rows = await listPublicInfluencers({ limit: 500 });
      return rows.find((r) => r.user_id === userId) ?? null;
    },
  });
}
