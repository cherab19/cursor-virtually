import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { useAdvertiserApplications } from "@/hooks/use-advertiser-applications";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/database.types";
import { cn } from "@/lib/utils";

type AppStatus = Database["public"]["Enums"]["application_status"];

function appBadge(status: AppStatus) {
  return (
    <span
      className={cn(
        "rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
        status === "pending" && "border-accent/40 bg-accent/10 text-accent-foreground",
        status === "accepted" && "border-primary/30 bg-primary/10 text-primary",
        status === "rejected" && "border-muted-foreground/30 bg-muted text-muted-foreground",
        status === "withdrawn" && "border-border bg-muted/60 text-muted-foreground",
      )}
    >
      {status}
    </span>
  );
}

export function AdvertiserApplicationsPage() {
  const qc = useQueryClient();
  const { data, isLoading, isError, refetch } = useAdvertiserApplications();

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: AppStatus }) => {
      const { error } = await supabase.from("campaign_applications").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["advertiser-applications"] }),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-card-foreground">Applications</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          One-click decisions update <code className="rounded bg-muted px-1 text-xs">campaign_applications</code>{" "}
          under RLS — only campaigns you own appear here.
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-xl bg-muted/40" />
          ))}
        </div>
      ) : isError ? (
        <p className="text-sm text-destructive">
          Failed to load applications.{" "}
          <button type="button" className="underline" onClick={() => void refetch()}>
            Retry
          </button>
        </p>
      ) : data?.length ? (
        <ul className="space-y-4">
          {data.map((a) => (
            <li
              key={a.id}
              className="rounded-xl border border-border bg-card p-4 shadow-card sm:p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {a.campaign.title}
                  </p>
                  <p className="mt-1 font-display text-lg font-semibold text-card-foreground">
                    <Link
                      to={`/influencer/${a.influencer_id}`}
                      className="rounded-sm hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {a.creator_name}
                    </Link>
                    {a.creator_category ? (
                      <span className="ml-2 text-sm font-normal text-muted-foreground">
                        · {a.creator_category}
                      </span>
                    ) : null}
                  </p>
                </div>
                {appBadge(a.status)}
              </div>
              {a.price_proposal != null ? (
                <p className="mt-2 text-sm text-muted-foreground">
                  Proposed rate:{" "}
                  <strong className="text-card-foreground">
                    {Number(a.price_proposal).toLocaleString()} ETB
                  </strong>
                </p>
              ) : null}
              <p className="mt-3 text-sm text-card-foreground">{a.proposal || "No proposal text."}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                Applied {new Date(a.created_at).toLocaleString()}
              </p>
              {a.status === "pending" ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    disabled={updateStatus.isPending}
                    onClick={() => updateStatus.mutate({ id: a.id, status: "accepted" })}
                  >
                    Accept
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={updateStatus.isPending}
                    onClick={() => updateStatus.mutate({ id: a.id, status: "rejected" })}
                  >
                    Reject
                  </Button>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <div className="rounded-xl border border-dashed border-border bg-muted/10 p-8 text-center text-sm text-muted-foreground">
          No applications yet — publish an <Link className="text-primary underline" to="/dashboard/advertiser/campaigns">active campaign</Link>{" "}
          to collect briefs from creators.
        </div>
      )}
    </div>
  );
}
