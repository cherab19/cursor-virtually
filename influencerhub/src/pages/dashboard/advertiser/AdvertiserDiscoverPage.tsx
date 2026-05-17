import { useDeferredValue, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { InfluencerCard } from "@/components/influencers/InfluencerCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { type DirectoryFilters, useDirectoryInfluencers } from "@/hooks/use-influencer-directory";
import { cn } from "@/lib/utils";

const PLATFORM_OPTIONS = [
  { value: "", label: "All platforms" },
  { value: "tiktok", label: "TikTok" },
  { value: "instagram", label: "Instagram" },
  { value: "youtube", label: "YouTube" },
  { value: "facebook", label: "Facebook" },
  { value: "x", label: "X" },
];

const initialFilters: DirectoryFilters = {
  search: "",
  category: "",
  location: "",
  platform: "",
  minFollowers: "",
  maxFollowers: "",
};

export function AdvertiserDiscoverPage() {
  const [draft, setDraft] = useState<DirectoryFilters>(initialFilters);
  const deferredSearch = useDeferredValue(draft.search);
  const filters = useMemo(
    () => ({
      ...draft,
      search: deferredSearch,
    }),
    [draft, deferredSearch],
  );
  const q = useDirectoryInfluencers(filters);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-card-foreground">Discover creators</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Same directory experience as the public page — Elite creators rank first. Shortlist talent and open their
          public profile to message after sign-off.
        </p>
        <Button asChild className="mt-4" variant="outline" size="sm">
          <Link to="/directory">Open public directory</Link>
        </Button>
      </div>

      <div className="rounded-xl border border-border bg-card p-5 shadow-card sm:p-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="md:col-span-2 lg:col-span-3">
            <label htmlFor="adv-dir-search" className="text-sm font-medium text-card-foreground">
              Search
            </label>
            <Input
              id="adv-dir-search"
              value={draft.search}
              onChange={(e) => setDraft((d) => ({ ...d, search: e.target.value }))}
              placeholder="Name, niche, city…"
              className="mt-1"
            />
          </div>
          <div>
            <label htmlFor="adv-dir-cat" className="text-sm font-medium text-card-foreground">
              Category
            </label>
            <Input
              id="adv-dir-cat"
              value={draft.category}
              onChange={(e) => setDraft((d) => ({ ...d, category: e.target.value }))}
              className="mt-1"
            />
          </div>
          <div>
            <label htmlFor="adv-dir-loc" className="text-sm font-medium text-card-foreground">
              Location
            </label>
            <Input
              id="adv-dir-loc"
              value={draft.location}
              onChange={(e) => setDraft((d) => ({ ...d, location: e.target.value }))}
              className="mt-1"
            />
          </div>
          <div>
            <label htmlFor="adv-dir-plat" className="text-sm font-medium text-card-foreground">
              Platform
            </label>
            <select
              id="adv-dir-plat"
              value={draft.platform}
              onChange={(e) => setDraft((d) => ({ ...d, platform: e.target.value }))}
              className={cn(
                "mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              )}
            >
              {PLATFORM_OPTIONS.map((o) => (
                <option key={o.value || "all"} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <Button type="button" variant="ghost" size="sm" className="mt-3" onClick={() => setDraft(initialFilters)}>
          Reset filters
        </Button>
      </div>

      {q.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-56 animate-pulse rounded-xl border border-border bg-muted/30" />
          ))}
        </div>
      ) : q.isError ? (
        <p className="text-sm text-destructive">Could not load creators.</p>
      ) : q.data?.length ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {q.data.map((inf) => (
            <InfluencerCard key={inf.user_id} influencer={inf} />
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No public profiles match these filters yet.</p>
      )}
    </div>
  );
}
