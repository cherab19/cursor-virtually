import { VerifiedAvatarBadge } from "@/components/influencers/VerifiedBadge";
import { Link } from "react-router-dom";

import type { PublicInfluencerRow } from "@/lib/influencer-format";
import { formatFollowers, truncateText } from "@/lib/influencer-format";
import { cn } from "@/lib/utils";

function PlanBadge({ plan }: { plan: string }) {
  const key = plan.toLowerCase();
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
        key === "elite" &&
          "border-accent/40 bg-accent/15 text-accent-foreground",
        key === "pro" && "border-primary/35 bg-primary/10 text-primary",
        key === "free" && "border-border bg-muted text-muted-foreground",
        !["elite", "pro", "free"].includes(key) &&
          "border-border bg-muted/80 text-muted-foreground",
      )}
    >
      {plan}
    </span>
  );
}

export interface InfluencerCardProps {
  influencer: PublicInfluencerRow;
  className?: string;
}

export function InfluencerCard({ influencer, className }: InfluencerCardProps) {
  const name = influencer.full_name?.trim() || "Creator";
  const initials =
    name
      .split(/\s+/)
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "IH";

  return (
    <article
      className={cn(
        "group flex flex-col rounded-xl border border-border bg-card p-5 shadow-card transition-shadow hover:shadow-lg",
        className,
      )}
    >
      <div className="flex gap-3">
        <div className="relative shrink-0">
          {influencer.avatar_url ? (
            <img
              src={influencer.avatar_url}
              alt=""
              className="size-14 rounded-full object-cover ring-2 ring-border"
            />
          ) : (
            <div
              className="flex size-14 items-center justify-center rounded-full bg-muted font-display text-sm font-semibold text-muted-foreground ring-2 ring-border"
              aria-hidden
            >
              {initials}
            </div>
          )}
          {influencer.is_verified ? <VerifiedAvatarBadge /> : null}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-display font-semibold text-card-foreground">
              <Link
                to={`/influencer/${influencer.user_id}`}
                className="rounded-sm transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
              >
                {name}
              </Link>
            </h2>
            <PlanBadge plan={influencer.subscription_plan} />
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {[influencer.category, influencer.location].filter(Boolean).join(" · ") ||
              "Creator"}
          </p>
        </div>
      </div>
      <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">
        {truncateText(influencer.bio || "No bio yet.", 140)}
      </p>
      <dl className="mt-4 grid grid-cols-2 gap-2 border-t border-border pt-4 text-xs">
        <div>
          <dt className="text-muted-foreground">Followers</dt>
          <dd className="font-medium text-card-foreground">
            {formatFollowers(influencer.followers_count)}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Rate</dt>
          <dd className="font-medium text-card-foreground">
            {influencer.ad_price_etb != null
              ? `${Number(influencer.ad_price_etb).toLocaleString()} ETB`
              : "—"}
          </dd>
        </div>
      </dl>
    </article>
  );
}
