import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  type ReactNode,
} from "react";
import { toast } from "sonner";

import { useAuth } from "@/hooks/use-auth";
import { isSupabaseConfigured, supabase } from "@/integrations/supabase/client";

export interface MessagingContextValue {
  unreadCount: number;
  unreadLoading: boolean;
  refreshUnread: () => void;
}

const MessagingContext = createContext<MessagingContextValue | null>(null);

async function fetchUnreadCount(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from("messages")
    .select("*", { count: "exact", head: true })
    .eq("recipient_id", userId)
    .eq("is_read", false);

  if (error) throw error;
  return count ?? 0;
}

export function MessagingProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const userId = user?.id;

  const unreadQuery = useQuery({
    queryKey: ["messages-unread", userId],
    enabled: Boolean(userId),
    queryFn: () => fetchUnreadCount(userId!),
  });

  const invalidateMessaging = useCallback(() => {
    if (!userId) return;
    void queryClient.invalidateQueries({ queryKey: ["messages-unread", userId] });
    void queryClient.invalidateQueries({ queryKey: ["message-threads", userId] });
    void queryClient.invalidateQueries({ queryKey: ["message-thread", userId] });
  }, [queryClient, userId]);

  useEffect(() => {
    if (!isSupabaseConfigured || !userId) {
      return;
    }

    const channel = supabase
      .channel(`messages-realtime-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `recipient_id=eq.${userId}`,
        },
        (payload) => {
          invalidateMessaging();
          const row = payload.new as { sender_id?: string; body?: string | null; subject?: string | null };
          if (row.sender_id && row.sender_id !== userId) {
            const raw = row.body || row.subject || "New message";
            const preview = raw.length > 80 ? `${raw.slice(0, 80)}…` : raw;
            toast.message("New message", { description: preview });
          }
        },
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `sender_id=eq.${userId}`,
        },
        () => {
          invalidateMessaging();
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
          filter: `recipient_id=eq.${userId}`,
        },
        () => {
          invalidateMessaging();
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [userId, invalidateMessaging]);

  const value = useMemo<MessagingContextValue>(
    () => ({
      unreadCount: unreadQuery.data ?? 0,
      unreadLoading: unreadQuery.isLoading,
      refreshUnread: () => {
        void unreadQuery.refetch();
      },
    }),
    [unreadQuery.data, unreadQuery.isLoading, unreadQuery.refetch],
  );

  return <MessagingContext.Provider value={value}>{children}</MessagingContext.Provider>;
}

export function useMessaging(): MessagingContextValue {
  const ctx = useContext(MessagingContext);
  if (!ctx) {
    return { unreadCount: 0, unreadLoading: false, refreshUnread: () => {} };
  }
  return ctx;
}
