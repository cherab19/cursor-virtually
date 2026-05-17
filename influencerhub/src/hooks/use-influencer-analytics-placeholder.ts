import { useQuery } from "@tanstack/react-query";

export interface InfluencerAnalyticsPlaceholder {
  followersSeries: { label: string; value: number }[];
  earningsMonthlyEtb: number;
  engagementSeries: { label: string; value: number }[];
}

export function useInfluencerAnalyticsPlaceholder() {
  return useQuery({
    queryKey: ["influencer-analytics-placeholder"],
    staleTime: Infinity,
    queryFn: async (): Promise<InfluencerAnalyticsPlaceholder> => ({
      followersSeries: [
        { label: "W1", value: 0 },
        { label: "W2", value: 0 },
        { label: "W3", value: 0 },
        { label: "W4", value: 0 },
      ],
      earningsMonthlyEtb: 0,
      engagementSeries: [
        { label: "W1", value: 0 },
        { label: "W2", value: 0 },
        { label: "W3", value: 0 },
        { label: "W4", value: 0 },
      ],
    }),
  });
}
