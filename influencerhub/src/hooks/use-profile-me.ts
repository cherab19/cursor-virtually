import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/database.types";

export type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

export function useProfileMe() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["profile-me", user?.id],
    enabled: Boolean(user?.id),
    queryFn: async (): Promise<ProfileRow | null> => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}
