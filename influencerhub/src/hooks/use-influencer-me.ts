import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/database.types";

export type InfluencerProfileRow = Database["public"]["Tables"]["influencer_profiles"]["Row"];

export function useInfluencerMe() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["influencer-me", user?.id],
    enabled: Boolean(user?.id),
    queryFn: async (): Promise<InfluencerProfileRow | null> => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("influencer_profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}
