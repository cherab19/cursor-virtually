import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/database.types";

export type CampaignRow = Database["public"]["Tables"]["campaigns"]["Row"];

export function useAdvertiserCampaigns() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["advertiser-campaigns", user?.id],
    enabled: Boolean(user?.id),
    queryFn: async (): Promise<CampaignRow[]> => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("campaigns")
        .select("*")
        .eq("advertiser_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useAdvertiserCampaign(campaignId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["advertiser-campaign", campaignId],
    enabled: Boolean(user?.id && campaignId && campaignId !== "new"),
    queryFn: async (): Promise<CampaignRow | null> => {
      if (!user?.id || !campaignId || campaignId === "new") return null;
      const { data, error } = await supabase
        .from("campaigns")
        .select("*")
        .eq("id", campaignId)
        .eq("advertiser_id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}
