import { BadgeCheck } from "lucide-react";

import { cn } from "@/lib/utils";

export interface VerifiedAvatarBadgeProps {
  className?: string;
  title?: string;
}

/** Small verified mark for avatars (directory cards, profile hero). */
export function VerifiedAvatarBadge({
  className,
  title = "Verified creator",
}: VerifiedAvatarBadgeProps) {
  return (
    <span
      className={cn(
        "absolute -bottom-0.5 -right-0.5 flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-card",
        className,
      )}
      title={title}
    >
      <BadgeCheck className="size-3.5" aria-hidden />
      <span className="sr-only">Verified</span>
    </span>
  );
}

export interface VerifiedInlineBadgeProps {
  className?: string;
}

/** Text chip with check icon for headings (optional next to name). */
export function VerifiedInlineBadge({ className }: VerifiedInlineBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-primary/25 bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary",
        className,
      )}
    >
      <BadgeCheck className="size-3.5 shrink-0" aria-hidden />
      Verified
    </span>
  );
}
