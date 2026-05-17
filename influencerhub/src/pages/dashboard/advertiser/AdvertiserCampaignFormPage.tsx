import { useMutation, useQueryClient } from "@tanstack/react-query";
import { type FormEvent, useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { useAdvertiserCampaign } from "@/hooks/use-advertiser-campaigns";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/database.types";
import { cn } from "@/lib/utils";

type CampaignStatus = Database["public"]["Enums"]["campaign_status"];

const STATUSES: CampaignStatus[] = ["draft", "active", "paused", "completed", "cancelled"];

function toDatetimeLocalValue(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function AdvertiserCampaignFormPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams<{ campaignId: string }>();

  const isNew = location.pathname.endsWith("/campaigns/new");
  const editingId = isNew ? undefined : params.campaignId;

  const existing = useAdvertiserCampaign(editingId);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [budget, setBudget] = useState("");
  const [targetCategory, setTargetCategory] = useState("");
  const [targetPlatform, setTargetPlatform] = useState("");
  const [deadlineLocal, setDeadlineLocal] = useState("");
  const [status, setStatus] = useState<CampaignStatus>("draft");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const row = existing.data;
    if (!row) return;
    setTitle(row.title);
    setDescription(row.description ?? "");
    setBudget(row.budget != null ? String(row.budget) : "");
    setTargetCategory(row.target_category ?? "");
    setTargetPlatform(row.target_platform ?? "");
    setDeadlineLocal(toDatetimeLocalValue(row.deadline));
    setStatus(row.status);
  }, [existing.data]);

  const save = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("Not signed in");
      if (!title.trim()) throw new Error("Title is required.");

      const budgetNum = budget.trim() === "" ? null : Number.parseFloat(budget);
      if (budgetNum != null && (!Number.isFinite(budgetNum) || budgetNum < 0)) {
        throw new Error("Budget must be a positive number.");
      }

      let deadlineIso: string | null = null;
      if (deadlineLocal.trim()) {
        const d = new Date(deadlineLocal);
        if (Number.isNaN(d.getTime())) throw new Error("Invalid deadline.");
        deadlineIso = d.toISOString();
      }

      if (isNew) {
        const { data, error: insErr } = await supabase
          .from("campaigns")
          .insert({
            advertiser_id: user.id,
            title: title.trim(),
            description: description.trim(),
            budget: budgetNum,
            target_category: targetCategory.trim() || null,
            target_platform: targetPlatform.trim() || null,
            deadline: deadlineIso,
            status,
          })
          .select("id")
          .single();
        if (insErr) throw insErr;
        return data?.id;
      }

      if (!editingId) throw new Error("Missing campaign id.");

      const { error: updErr } = await supabase
        .from("campaigns")
        .update({
          title: title.trim(),
          description: description.trim(),
          budget: budgetNum,
          target_category: targetCategory.trim() || null,
          target_platform: targetPlatform.trim() || null,
          deadline: deadlineIso,
          status,
        })
        .eq("id", editingId)
        .eq("advertiser_id", user.id);
      if (updErr) throw updErr;
      return editingId;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["advertiser-campaigns"] });
      await qc.invalidateQueries({ queryKey: ["advertiser-campaign", editingId] });
      navigate("/dashboard/advertiser/campaigns");
    },
    onError: (e: Error) => setError(e.message),
  });

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    save.mutate();
  };

  if (!isNew && existing.isLoading) {
    return (
      <div
        className="mx-auto max-w-2xl rounded-xl border border-border bg-card p-8 shadow-card"
        aria-busy="true"
        aria-label="Loading campaign"
      >
        <p className="text-sm font-medium text-muted-foreground">Loading campaign…</p>
        <div className="mt-4 h-32 animate-pulse rounded-lg bg-muted" />
      </div>
    );
  }

  if (!isNew && existing.isError) {
    return (
      <p className="text-sm text-destructive">
        Campaign not found or you don&apos;t have access.
        <Button asChild variant="link" className="px-2">
          <Link to="/dashboard/advertiser/campaigns">Back</Link>
        </Button>
      </p>
    );
  }

  return (
    <form className="mx-auto max-w-2xl space-y-6" onSubmit={onSubmit}>
      <div>
        <h1 className="font-display text-2xl font-bold text-card-foreground">
          {isNew ? "New campaign" : "Edit campaign"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Briefs with status <strong className="text-foreground">active</strong> are visible in the influencer marketplace
          (RLS allows authenticated creators to read active rows).
        </p>
      </div>

      <div className="space-y-4 rounded-xl border border-border bg-card p-6 shadow-card">
        <div>
          <label htmlFor="camp-title" className="text-sm font-medium text-card-foreground">
            Title
          </label>
          <Input
            id="camp-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="mt-1"
          />
        </div>
        <div>
          <label htmlFor="camp-desc" className="text-sm font-medium text-card-foreground">
            Brief
          </label>
          <textarea
            id="camp-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
            className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            placeholder="Deliverables, tone, timeline…"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="camp-budget" className="text-sm font-medium text-card-foreground">
              Budget (ETB)
            </label>
            <Input
              id="camp-budget"
              type="number"
              min={0}
              step={1}
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <label htmlFor="camp-deadline" className="text-sm font-medium text-card-foreground">
              Deadline
            </label>
            <Input
              id="camp-deadline"
              type="datetime-local"
              value={deadlineLocal}
              onChange={(e) => setDeadlineLocal(e.target.value)}
              className="mt-1"
            />
            <p className="mt-1 text-xs text-muted-foreground">Must be on or after the saved created time (server rule).</p>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="camp-cat" className="text-sm font-medium text-card-foreground">
              Target category
            </label>
            <Input
              id="camp-cat"
              value={targetCategory}
              onChange={(e) => setTargetCategory(e.target.value)}
              placeholder="Beauty, FinTech…"
              className="mt-1"
            />
          </div>
          <div>
            <label htmlFor="camp-plat" className="text-sm font-medium text-card-foreground">
              Target platform
            </label>
            <Input
              id="camp-plat"
              value={targetPlatform}
              onChange={(e) => setTargetPlatform(e.target.value)}
              placeholder="TikTok, Instagram…"
              className="mt-1"
            />
          </div>
        </div>
        <div>
          <label htmlFor="camp-status" className="text-sm font-medium text-card-foreground">
            Status
          </label>
          <select
            id="camp-status"
            value={status}
            onChange={(e) => setStatus(e.target.value as CampaignStatus)}
            className={cn(
              "mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            )}
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error ? (
        <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={save.isPending}>
          {save.isPending ? "Saving…" : "Save campaign"}
        </Button>
        <Button asChild type="button" variant="outline">
          <Link to="/dashboard/advertiser/campaigns">Cancel</Link>
        </Button>
      </div>
    </form>
  );
}
