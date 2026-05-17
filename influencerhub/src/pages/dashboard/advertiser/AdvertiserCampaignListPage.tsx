import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useAdvertiserCampaigns, type CampaignRow } from "@/hooks/use-advertiser-campaigns";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/database.types";
import { cn } from "@/lib/utils";

type CampaignStatus = Database["public"]["Enums"]["campaign_status"];

function statusBadge(status: CampaignStatus) {
  return (
    <span
      className={cn(
        "rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
        status === "active" && "border-primary/30 bg-primary/10 text-primary",
        status === "draft" && "border-border bg-muted text-muted-foreground",
        status === "paused" && "border-accent/40 bg-accent/10 text-accent-foreground",
        status === "completed" && "border-border bg-muted/80 text-foreground",
        status === "cancelled" && "border-destructive/30 bg-destructive/10 text-destructive",
      )}
    >
      {status}
    </span>
  );
}

export function AdvertiserCampaignListPage() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const { data, isLoading, isError, refetch } = useAdvertiserCampaigns();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("campaigns").delete().eq("id", id).eq("advertiser_id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["advertiser-campaigns"] });
      void qc.invalidateQueries({ queryKey: ["advertiser-applications"] });
    },
  });

  const onDelete = (row: CampaignRow) => {
    if (
      !window.confirm(
        `Delete “${row.title}”? Applications linked to this campaign will be removed.`,
      )
    ) {
      return;
    }
    setDeletingId(row.id);
    remove.mutate(row.id, {
      onSettled: () => setDeletingId(null),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-card-foreground">Campaigns</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Create, edit, and retire briefs. Only your rows are visible thanks to RLS.
          </p>
        </div>
        <Button asChild>
          <Link to="/dashboard/advertiser/campaigns/new">New campaign</Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-muted/40" />
          ))}
        </div>
      ) : isError ? (
        <p className="text-sm text-destructive">
          Could not load campaigns.{" "}
          <button type="button" className="underline" onClick={() => void refetch()}>
            Retry
          </button>
        </p>
      ) : data?.length ? (
        <ul className="space-y-3" aria-label="Your campaigns">
          {data.map((c) => (
            <li
              key={c.id}
              className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-card sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-display font-semibold text-card-foreground">{c.title}</h2>
                  {statusBadge(c.status)}
                </div>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{c.description || "No brief yet."}</p>
                <dl className="mt-2 flex flex-wrap gap-4 text-xs text-muted-foreground">
                  <div>
                    <dt className="inline">Budget: </dt>
                    <dd className="inline text-card-foreground">
                      {c.budget != null ? `${Number(c.budget).toLocaleString()} ETB` : "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="inline">Deadline: </dt>
                    <dd className="inline text-card-foreground">
                      {c.deadline ? new Date(c.deadline).toLocaleString() : "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="inline">Targets: </dt>
                    <dd className="inline text-card-foreground">
                      {[c.target_category, c.target_platform].filter(Boolean).join(" · ") || "—"}
                    </dd>
                  </div>
                </dl>
              </div>
              <div className="flex shrink-0 flex-wrap gap-2">
                <Button asChild variant="outline" size="sm">
                  <Link to={`/dashboard/advertiser/campaigns/${c.id}`}>Edit</Link>
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  disabled={deletingId === c.id || remove.isPending}
                  onClick={() => onDelete(c)}
                >
                  Delete
                </Button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="rounded-xl border border-dashed border-border bg-muted/10 p-8 text-center">
          <p className="text-sm text-muted-foreground">No campaigns yet.</p>
          <Button asChild className="mt-4">
            <Link to="/dashboard/advertiser/campaigns/new">Create your first</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
