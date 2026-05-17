import { useMessaging } from "@/context/messaging-context";

export function useUnreadMessages() {
  const { unreadCount, unreadLoading, refreshUnread } = useMessaging();
  return {
    unreadCount,
    isLoading: unreadLoading,
    refresh: refreshUnread,
  };
}
