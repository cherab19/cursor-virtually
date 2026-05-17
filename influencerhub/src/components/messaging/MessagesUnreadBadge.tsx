import { useUnreadMessages } from "@/hooks/use-unread-messages";
import { cn } from "@/lib/utils";

export function MessagesUnreadBadge() {
  const { unreadCount, isLoading } = useUnreadMessages();
  const display = isLoading ? "…" : String(unreadCount);
  const highlight = unreadCount > 0;

  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-[10px] font-semibold tabular-nums",
        highlight
          ? "bg-accent/15 text-accent-foreground ring-1 ring-accent/30"
          : "bg-muted text-muted-foreground",
      )}
      aria-label={unreadCount > 0 ? `${unreadCount} unread messages` : "No unread messages"}
    >
      {display}
    </span>
  );
}
