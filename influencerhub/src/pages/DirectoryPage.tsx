import { useDeferredValue, useMemo, useState } from "react";

import { InfluencerCard } from "@/components/influencers/InfluencerCard";
import { Seo } from "@/components/seo/Seo";
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
  { value: "telegram", label: "Telegram" },
];

const initialFilters: DirectoryFilters = {
  search: "",
  category: "",
  location: "",
  platform: "",
  minFollowers: "",
  maxFollowers: "",
};

export function DirectoryPage() {
  const [draft, setDraft] = useState<DirectoryFilters>(initialFilters);
  const deferredSearch = useDeferredValue(draft.search);

  const filters = useMemo<DirectoryFilters>(
    () => ({
      ...draft,
      search: deferredSearch,
    }),
    [draft, deferredSearch],
  );

  const q = useDirectoryInfluencers(filters);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <Seo
        title="Creator directory"
        description="Search verified Ethiopian creators by category, platform, and audience. Elite and Pro plans rank higher in results."
        canonicalPath="/directory"
      />
      <h1 className="font-display text-3xl font-bold text-navy">Creator directory</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        Elite and Pro creators are listed before Free accounts. Within each tier, verified profiles are boosted, then
        follower count breaks ties.
      </p>

      <div className="mt-8 rounded-xl border border-border bg-card p-5 shadow-card sm:p-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="md:col-span-2 lg:col-span-3">
            <label htmlFor="dir-search" className="text-sm font-medium text-card-foreground">
              Search
            </label>
            <Input
              id="dir-search"
              value={draft.search}
              onChange={(e) => setDraft((d) => ({ ...d, search: e.target.value }))}
              placeholder="Name, category, location, or bio keywords"
              className="mt-1"
              autoComplete="off"
            />
          </div>
          <div>
            <label htmlFor="dir-category" className="text-sm font-medium text-card-foreground">
              Category
            </label>
            <Input
              id="dir-category"
              value={draft.category}
              onChange={(e) => setDraft((d) => ({ ...d, category: e.target.value }))}
              placeholder="e.g. Lifestyle"
              className="mt-1"
            />
          </div>
          <div>
            <label htmlFor="dir-location" className="text-sm font-medium text-card-foreground">
              Location
            </label>
            <Input
              id="dir-location"
              value={draft.location}
              onChange={(e) => setDraft((d) => ({ ...d, location: e.target.value }))}
              placeholder="City or region"
              className="mt-1"
            />
          </div>
          <div>
            <label htmlFor="dir-platform" className="text-sm font-medium text-card-foreground">
              Platform
            </label>
            <select
              id="dir-platform"
              value={draft.platform}
              onChange={(e) => setDraft((d) => ({ ...d, platform: e.target.value }))}
              className={cn(
                "mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              )}
            >
              {PLATFORM_OPTIONS.map((o) => (
                <option key={o.value || "all"} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="dir-min-f" className="text-sm font-medium text-card-foreground">
              Min followers
            </label>
            <Input
              id="dir-min-f"
              inputMode="numeric"
              value={draft.minFollowers}
              onChange={(e) => setDraft((d) => ({ ...d, minFollowers: e.target.value }))}
              placeholder="0"
              className="mt-1"
            />
          </div>
          <div>
            <label htmlFor="dir-max-f" className="text-sm font-medium text-card-foreground">
              Max followers
            </label>
            <Input
              id="dir-max-f"
              inputMode="numeric"
              value={draft.maxFollowers}
              onChange={(e) => setDraft((d) => ({ ...d, maxFollowers: e.target.value }))}
              placeholder="No limit"
              className="mt-1"
            />
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => setDraft(initialFilters)}>
            Reset filters
          </Button>
          {deferredSearch !== draft.search ? (
            <span className="self-center text-xs text-muted-foreground">Updating results…</span>
          ) : null}
        </div>
      </div>

      {q.isLoading ? (
        <div
          className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
          aria-busy="true"
          aria-label="Loading directory"
        >
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-56 animate-pulse rounded-xl border border-border bg-card/80" />
          ))}
        </div>
      ) : q.isError ? (
        <div className="mt-8 rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive">
          <p className="font-medium">Unable to load the directory.</p>
          <Button type="button" variant="outline" className="mt-4" size="sm" onClick={() => void q.refetch()}>
            Retry
          </Button>
        </div>
      ) : q.data?.length ? (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {q.data.map((inf) => (
            <InfluencerCard key={inf.user_id} influencer={inf} />
          ))}
        </div>
      ) : (
        <div className="mt-8 rounded-xl border border-dashed border-border bg-muted/20 p-12 text-center">
          <p className="font-display text-lg font-semibold text-foreground">No creators match</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Loosen filters or check back after more influencers are approved.
          </p>
        </div>
      )}
    </div>
  );
}
