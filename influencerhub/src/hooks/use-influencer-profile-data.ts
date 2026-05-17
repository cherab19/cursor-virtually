import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/database.types";

type SocialRow = Database["public"]["Tables"]["social_links"]["Row"];

export interface PublicInfluencerReview {
  id: string;
  rating: number;
  comment: string;
  created_at: string;
  reviewer_label: string;
}

export function useInfluencerSocialLinks(influencerId: string | undefined) {
  return useQuery({
    queryKey: ["social-links", influencerId],
    enabled: Boolean(influencerId),
    queryFn: async (): Promise<SocialRow[]> => {
      if (!influencerId) return [];
      const { data, error } = await supabase
        .from("social_links")
        .select("*")
        .eq("influencer_id", influencerId)
        .order("platform");
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useInfluencerReviews(revieweeId: string | undefined) {
  return useQuery({
    queryKey: ["reviews", "public", revieweeId],
    enabled: Boolean(revieweeId),
    queryFn: async (): Promise<PublicInfluencerReview[]> => {
      if (!revieweeId) return [];
      const { data, error } = await supabase.rpc("public_list_influencer_reviews", {
        p_reviewee_id: revieweeId,
      });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useSubmitInfluencerReview(revieweeId: string | undefined) {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: { rating: number; comment: string }) => {
      if (!user?.id || !revieweeId) throw new Error("Not signed in");
      const { error } = await supabase.from("reviews").insert({
        reviewer_id: user.id,
        reviewee_id: revieweeId,
        rating: input.rating,
        comment: input.comment.trim() || "",
      });
      if (error) throw error;
    },
    onSuccess: async () => {
      if (revieweeId) {
        await qc.invalidateQueries({ queryKey: ["reviews", "public", revieweeId] });
      }
    },
  });
}
