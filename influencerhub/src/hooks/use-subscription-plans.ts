import { useQuery } from "@tanstack/react-query";

import { isSupabaseConfigured, supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/database.types";

type PlanRow = Database["public"]["Tables"]["subscription_plans"]["Row"];

export function useSubscriptionPlans() {
  return useQuery({
    queryKey: ["subscription-plans"],
    enabled: isSupabaseConfigured,
    queryFn: async (): Promise<PlanRow[]> => {
      const { data, error } = await supabase
        .from("subscription_plans")
        .select("*")
        .order("price_monthly", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}
