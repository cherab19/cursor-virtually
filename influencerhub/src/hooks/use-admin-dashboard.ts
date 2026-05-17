import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

import { supabase } from "@/integrations/supabase/client";
import type { AppRole, Database } from "@/integrations/supabase/database.types";

type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type InfluencerRow = Database["public"]["Tables"]["influencer_profiles"]["Row"];
type PaymentRow = Database["public"]["Tables"]["payments"]["Row"];

export type PendingInfluencerRow = InfluencerRow & {
  profile: ProfileRow | null;
};

export type UserWithRolesRow = ProfileRow & { roles: AppRole[] };

function dayKey(iso: string) {
  return iso.slice(0, 10);
}

export function useAdminOverviewSeries() {
  return useQuery({
    queryKey: ["admin", "overview-series"],
    queryFn: async () => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setUTCDate(thirtyDaysAgo.getUTCDate() - 30);
      const iso = thirtyDaysAgo.toISOString();

      const [profilesQ, paymentsQ, pendingQ, approvedQ] = await Promise.all([
        supabase.from("profiles").select("created_at").gte("created_at", iso),
        supabase.from("payments").select("created_at, amount, status").gte("created_at", iso),
        supabase
          .from("influencer_profiles")
          .select("*", { count: "exact", head: true })
          .eq("status", "pending"),
        supabase
          .from("influencer_profiles")
          .select("*", { count: "exact", head: true })
          .eq("status", "approved"),
      ]);

      if (profilesQ.error) throw profilesQ.error;
      if (paymentsQ.error) throw paymentsQ.error;
      if (pendingQ.error) throw pendingQ.error;
      if (approvedQ.error) throw approvedQ.error;

      const profilesByDay = new Map<string, number>();
      for (const row of profilesQ.data ?? []) {
        const k = dayKey(row.created_at);
        profilesByDay.set(k, (profilesByDay.get(k) ?? 0) + 1);
      }

      const paymentVolumeByDay = new Map<string, number>();
      for (const row of paymentsQ.data ?? []) {
        if (row.status !== "completed") continue;
        const k = dayKey(row.created_at);
        const n = Number(row.amount);
        paymentVolumeByDay.set(k, (paymentVolumeByDay.get(k) ?? 0) + (Number.isFinite(n) ? n : 0));
      }

      const keys = new Set([...profilesByDay.keys(), ...paymentVolumeByDay.keys()]);
      const sortedDays = Array.from(keys).sort();

      const signupsSeries = sortedDays.map((d) => ({
        date: d,
        signups: profilesByDay.get(d) ?? 0,
      }));

      const paymentsSeries = sortedDays.map((d) => ({
        date: d,
        volume: Math.round((paymentVolumeByDay.get(d) ?? 0) * 100) / 100,
      }));

      const [totalUsers, totalPaymentsAgg, campaignsCount] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("payments").select("amount, status"),
        supabase.from("campaigns").select("*", { count: "exact", head: true }),
      ]);

      if (totalUsers.error) throw totalUsers.error;
      if (totalPaymentsAgg.error) throw totalPaymentsAgg.error;
      if (campaignsCount.error) throw campaignsCount.error;

      let completedVolume = 0;
      for (const p of totalPaymentsAgg.data ?? []) {
        if (p.status === "completed") {
          const n = Number(p.amount);
          if (Number.isFinite(n)) completedVolume += n;
        }
      }

      return {
        kpis: {
          totalUsers: totalUsers.count ?? 0,
          pendingApprovals: pendingQ.count ?? 0,
          approvedInfluencers: approvedQ.count ?? 0,
          campaigns: campaignsCount.count ?? 0,
          completedPaymentVolume: Math.round(completedVolume * 100) / 100,
        },
        signupsSeries,
        paymentsSeries,
      };
    },
  });
}

export function usePendingInfluencers() {
  return useQuery({
    queryKey: ["admin", "pending-influencers"],
    queryFn: async (): Promise<PendingInfluencerRow[]> => {
      const { data: influencers, error } = await supabase
        .from("influencer_profiles")
        .select("*")
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (error) throw error;
      const rows = influencers ?? [];
      if (!rows.length) return [];

      const ids = rows.map((r) => r.user_id);
      const { data: profs, error: pError } = await supabase
        .from("profiles")
        .select("*")
        .in("user_id", ids);

      if (pError) throw pError;
      const map = new Map((profs ?? []).map((p) => [p.user_id, p]));

      return rows.map((r) => ({ ...r, profile: map.get(r.user_id) ?? null }));
    },
  });
}

export function useApprovedInfluencersVerification() {
  return useQuery({
    queryKey: ["admin", "approved-influencers-verify"],
    queryFn: async (): Promise<PendingInfluencerRow[]> => {
      const { data: influencers, error } = await supabase
        .from("influencer_profiles")
        .select("*")
        .eq("status", "approved")
        .order("updated_at", { ascending: false })
        .limit(80);

      if (error) throw error;
      const rows = influencers ?? [];
      if (!rows.length) return [];

      const ids = rows.map((r) => r.user_id);
      const { data: profs, error: pError } = await supabase
        .from("profiles")
        .select("*")
        .in("user_id", ids);

      if (pError) throw pError;
      const map = new Map((profs ?? []).map((p) => [p.user_id, p]));

      return rows.map((r) => ({ ...r, profile: map.get(r.user_id) ?? null }));
    },
  });
}

export function useInfluencerModerationMutations() {
  const qc = useQueryClient();

  const invalidate = useCallback(() => {
    void qc.invalidateQueries({ queryKey: ["admin"] });
  }, [qc]);

  const approve = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from("influencer_profiles")
        .update({ status: "approved", updated_at: new Date().toISOString() })
        .eq("user_id", userId)
        .eq("status", "pending");
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const reject = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from("influencer_profiles")
        .update({ status: "rejected", updated_at: new Date().toISOString() })
        .eq("user_id", userId)
        .eq("status", "pending");
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const setVerified = useMutation({
    mutationFn: async ({ userId, isVerified }: { userId: string; isVerified: boolean }) => {
      const { error } = await supabase
        .from("influencer_profiles")
        .update({ is_verified: isVerified, updated_at: new Date().toISOString() })
        .eq("user_id", userId)
        .eq("status", "approved");
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  return { approve, reject, setVerified };
}

export function useAdminUsersList() {
  return useQuery({
    queryKey: ["admin", "users-list"],
    queryFn: async (): Promise<UserWithRolesRow[]> => {
      const { data: profiles, error: pError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(300);

      if (pError) throw pError;

      const { data: rolesRows, error: rError } = await supabase.from("user_roles").select("user_id, role");

      if (rError) throw rError;

      const roleMap = new Map<string, AppRole[]>();
      for (const row of rolesRows ?? []) {
        const list = roleMap.get(row.user_id) ?? [];
        list.push(row.role);
        roleMap.set(row.user_id, list);
      }

      return (profiles ?? []).map((p) => ({
        ...p,
        roles: roleMap.get(p.user_id) ?? [],
      }));
    },
  });
}

export function useAdminPaymentsLog() {
  return useQuery({
    queryKey: ["admin", "payments-log"],
    queryFn: async (): Promise<PaymentRow[]> => {
      const { data, error } = await supabase
        .from("payments")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(150);

      if (error) throw error;
      return data ?? [];
    },
  });
}
