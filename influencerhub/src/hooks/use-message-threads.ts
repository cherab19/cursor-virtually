import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect } from "react";

import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/database.types";

export type MessageRow = Database["public"]["Tables"]["messages"]["Row"];

export interface MessageThreadPreview {
  partnerId: string;
  lastMessage: MessageRow;
  unread: number;
  label: string;
}

export function useMessageThreads() {
  const { user } = useAuth();
  const userId = user?.id;

  return useQuery({
    queryKey: ["message-threads", userId],
    enabled: Boolean(userId),
    queryFn: async (): Promise<MessageThreadPreview[]> => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
        .order("created_at", { ascending: false });

      if (error) throw error;
      const rows = data ?? [];

      const byPartner = new Map<string, MessageRow[]>();
      for (const m of rows) {
        const other = m.sender_id === userId ? m.recipient_id : m.sender_id;
        const list = byPartner.get(other) ?? [];
        list.push(m);
        byPartner.set(other, list);
      }

      const partnerIds = Array.from(byPartner.keys());
      const labelResults = await Promise.all(
        partnerIds.map(async (pid) => {
          const { data: label, error: rpcError } = await supabase.rpc("messaging_peer_label", {
            peer_id: pid,
          });
          if (rpcError) throw rpcError;
          return { pid, label: label ?? "Member" };
        }),
      );
      const labelByPartner = new Map(labelResults.map((r) => [r.pid, r.label]));

      const previews: MessageThreadPreview[] = [];
      for (const [partnerId, msgs] of byPartner) {
        const sorted = [...msgs].sort(
          (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
        );
        const last = sorted[sorted.length - 1];
        if (!last) continue;
        const unread = msgs.filter((m) => m.recipient_id === userId && !m.is_read).length;
        previews.push({
          partnerId,
          lastMessage: last,
          unread,
          label: labelByPartner.get(partnerId) ?? "Member",
        });
      }

      previews.sort(
        (a, b) =>
          new Date(b.lastMessage.created_at).getTime() - new Date(a.lastMessage.created_at).getTime(),
      );
      return previews;
    },
  });
}

export function useThreadMessages(partnerId: string | null) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["message-thread", user?.id, partnerId],
    enabled: Boolean(user?.id && partnerId),
    queryFn: async (): Promise<MessageRow[]> => {
      const uid = user!.id;
      const pid = partnerId!;
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .or(
          `and(sender_id.eq.${uid},recipient_id.eq.${pid}),and(sender_id.eq.${pid},recipient_id.eq.${uid})`,
        )
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useMarkThreadRead(partnerId: string | null) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const userId = user?.id;

  const mark = useCallback(async () => {
    if (!userId || !partnerId) return;

    const { data: rows, error: readError } = await supabase
      .from("messages")
      .select("id")
      .eq("recipient_id", userId)
      .eq("sender_id", partnerId)
      .eq("is_read", false);

    if (readError) throw readError;
    const ids = (rows ?? []).map((r) => r.id);
    if (!ids.length) return;

    const { error: updateError } = await supabase.from("messages").update({ is_read: true }).in("id", ids);

    if (updateError) throw updateError;

    if (userId) {
      void queryClient.invalidateQueries({ queryKey: ["messages-unread", userId] });
      void queryClient.invalidateQueries({ queryKey: ["message-threads", userId] });
      void queryClient.invalidateQueries({ queryKey: ["message-thread", userId, partnerId] });
    }
  }, [partnerId, queryClient, userId]);

  return mark;
}

export function useMarkThreadReadEffect(partnerId: string | null, messages: MessageRow[] | undefined) {
  const { user } = useAuth();
  const mark = useMarkThreadRead(partnerId);
  const userId = user?.id;

  useEffect(() => {
    if (!userId || !partnerId || !messages?.length) return;

    const hasUnread = messages.some(
      (m) => m.recipient_id === userId && m.sender_id === partnerId && !m.is_read,
    );
    if (!hasUnread) return;

    void mark();
  }, [userId, partnerId, messages, mark]);
}
