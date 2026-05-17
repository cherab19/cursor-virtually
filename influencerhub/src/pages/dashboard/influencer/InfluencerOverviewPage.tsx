import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { useInfluencerAnalyticsPlaceholder } from "@/hooks/use-influencer-analytics-placeholder";
import { useInfluencerMe } from "@/hooks/use-influencer-me";
import { useProfileMe } from "@/hooks/use-profile-me";
import { cn } from "@/lib/utils";

export function InfluencerOverviewPage() {
  const infQ = useInfluencerMe();
  const profQ = useProfileMe();
  const analytics = useInfluencerAnalyticsPlaceholder();

  const inf = infQ.data;
  const prof = profQ.data;

  if (infQ.isLoading || profQ.isLoading) {
    return (
      <div className="space-y-4" aria-busy="true" aria-label="Loading overview">
        <div className="h-10 w-48 animate-pulse rounded-lg bg-muted" />
        <div className="h-36 animate-pulse rounded-xl bg-muted" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-card-foreground">
          Hey {prof?.full_name?.trim() || "creator"}, ready to grow?
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This overview pulls live profile data now; interactive charts plug into the placeholder analytics hook below.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          {
            label: "Followers (manual)",
            value: inf ? inf.followers_count.toLocaleString() : "—",
            hint: "Sync creator stats in a later phase.",
          },
          {
            label: "Plan",
            value: inf?.subscription_plan ?? "—",
            hint: "Upgrade anytime from Subscription.",
          },
          {
            label: "Verification",
            value: inf?.is_verified ? "Verified" : "Pending",
            hint: "Admins approve badges from the admin console.",
          },
        ].map((c) => (
          <div
            key={c.label}
            className="rounded-xl border border-border bg-card p-4 shadow-card"
          >
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{c.label}</p>
            <p className="mt-2 font-display text-xl font-semibold text-card-foreground capitalize">{c.value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{c.hint}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-card p-6 shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-semibold text-card-foreground">Analytics preview</h2>
            <p className="text-sm text-muted-foreground">
              Hook: <code className="rounded bg-muted px-1 text-xs">useInfluencerAnalyticsPlaceholder</code> — swap
              for real queries later.
            </p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link to="/dashboard/influencer/analytics">Open analytics</Link>
          </Button>
        </div>

        {analytics.isLoading ? (
          <p className="mt-4 text-sm text-muted-foreground">Preparing chart data…</p>
        ) : analytics.isError ? (
          <p className="mt-4 text-sm text-destructive">Could not load placeholder analytics.</p>
        ) : (
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border border-border bg-muted/20 p-4">
              <p className="text-xs font-medium text-muted-foreground">Followers trend</p>
              <ul className="mt-3 flex gap-2">
                {analytics.data?.followersSeries.map((pt) => (
                  <li
                    key={pt.label}
                    className="flex flex-1 flex-col items-center gap-1 text-xs text-muted-foreground"
                  >
                    <span
                      className={cn(
                        "w-full rounded-md bg-primary/80",
                        pt.value <= 0 ? "h-2 bg-muted" : "h-16",
                      )}
                      style={pt.value > 0 ? { height: `${Math.min(96, 12 + pt.value * 6)}px` } : undefined}
                      aria-hidden
                    />
                    <span>{pt.label}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-lg border border-border bg-muted/20 p-4">
              <p className="text-xs font-medium text-muted-foreground">Engagement trend</p>
              <ul className="mt-3 flex gap-2">
                {analytics.data?.engagementSeries.map((pt) => (
                  <li
                    key={pt.label}
                    className="flex flex-1 flex-col items-center gap-1 text-xs text-muted-foreground"
                  >
                    <span
                      className={cn("w-full rounded-md", pt.value <= 0 ? "h-2 bg-muted" : "h-12 bg-accent/80")}
                      style={pt.value > 0 ? { height: `${Math.min(80, 10 + pt.value * 5)}px` } : undefined}
                      aria-hidden
                    />
                    <span>{pt.label}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-xs text-muted-foreground">
                Estimated monthly earnings (placeholder):{" "}
                <strong className="text-card-foreground">
                  {(analytics.data?.earningsMonthlyEtb ?? 0).toLocaleString()} ETB
                </strong>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
