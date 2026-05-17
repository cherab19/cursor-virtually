import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/database.types";

export type ApplicationRow = Database["public"]["Tables"]["campaign_applications"]["Row"];

export interface ApplicationWithCampaign extends ApplicationRow {
  campaign: { id: string; title: string };
  creator_name: string;
  creator_category: string | null;
}

export function useAdvertiserApplications() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["advertiser-applications", user?.id],
    enabled: Boolean(user?.id),
    queryFn: async (): Promise<ApplicationWithCampaign[]> => {
      if (!user?.id) return [];

      const { data: camps, error: cErr } = await supabase
        .from("campaigns")
        .select("id, title")
        .eq("advertiser_id", user.id);
      if (cErr) throw cErr;
      const ids = camps?.map((c) => c.id) ?? [];
      if (ids.length === 0) return [];

      const titleById = Object.fromEntries((camps ?? []).map((c) => [c.id, c.title]));

      const { data: apps, error: aErr } = await supabase
        .from("campaign_applications")
        .select("*")
        .in("campaign_id", ids)
        .order("created_at", { ascending: false });
      if (aErr) throw aErr;

      const enriched = await Promise.all(
        (apps ?? []).map(async (row) => {
          const { data: pub } = await supabase.rpc("public_get_influencer", {
            p_user_id: row.influencer_id,
          });
          const inf = pub?.[0];
          return {
            ...row,
            campaign: {
              id: row.campaign_id,
              title: titleById[row.campaign_id] ?? "Campaign",
            },
            creator_name: inf?.full_name?.trim() || "Creator",
            creator_category: inf?.category ?? null,
          } satisfies ApplicationWithCampaign;
        }),
      );

      return enriched;
    },
  });
}
