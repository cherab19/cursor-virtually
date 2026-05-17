import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { useAdvertiserApplications } from "@/hooks/use-advertiser-applications";
import { useAdvertiserCampaigns } from "@/hooks/use-advertiser-campaigns";

export function AdvertiserOverviewPage() {
  const camps = useAdvertiserCampaigns();
  const apps = useAdvertiserApplications();

  const activeCampaigns =
    camps.data?.filter((c) => c.status === "active" || c.status === "paused").length ?? 0;
  const pendingApps = apps.data?.filter((a) => a.status === "pending").length ?? 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-card-foreground">Overview</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Draft briefs, publish to the marketplace, and approve creator applications — all under advertiser RLS.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-4 shadow-card">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Total campaigns</p>
          <p className="mt-2 font-display text-2xl font-bold text-card-foreground">
            {camps.isLoading ? "—" : (camps.data?.length ?? 0)}
          </p>
          <Button asChild variant="link" className="mt-2 h-auto px-0 text-primary">
            <Link to="/dashboard/advertiser/campaigns">Manage</Link>
          </Button>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 shadow-card">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Active / paused</p>
          <p className="mt-2 font-display text-2xl font-bold text-card-foreground">
            {camps.isLoading ? "—" : activeCampaigns}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 shadow-card">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Pending applications</p>
          <p className="mt-2 font-display text-2xl font-bold text-card-foreground">
            {apps.isLoading ? "—" : pendingApps}
          </p>
          <Button asChild variant="link" className="mt-2 h-auto px-0 text-primary">
            <Link to="/dashboard/advertiser/applications">Review</Link>
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-dashed border-border bg-muted/10 p-6">
        <p className="font-display text-sm font-semibold text-card-foreground">Next steps</p>
        <ul className="mt-3 list-inside list-disc space-y-1 text-sm text-muted-foreground">
          <li>
            <Link className="text-primary underline-offset-4 hover:underline" to="/dashboard/advertiser/discover">
              Discover creators
            </Link>{" "}
            for your vertical.
          </li>
          <li>
            <Link className="text-primary underline-offset-4 hover:underline" to="/dashboard/advertiser/campaigns/new">
              Post a campaign brief
            </Link>{" "}
            with budget + deadlines.
          </li>
        </ul>
      </div>
    </div>
  );
}
