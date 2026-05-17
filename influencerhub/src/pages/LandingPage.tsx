import { Link } from "react-router-dom";
import { useMemo } from "react";

import { InfluencerCard } from "@/components/influencers/InfluencerCard";
import { Seo } from "@/components/seo/Seo";
import { Button } from "@/components/ui/button";
import { directoryErrorMessage } from "@/lib/directory-api";
import { useFeaturedEliteInfluencers } from "@/hooks/use-influencer-directory";
import { DEFAULT_DESCRIPTION, getSiteOrigin } from "@/lib/site";

export function LandingPage() {
  const featured = useFeaturedEliteInfluencers(6);

  const jsonLd = useMemo(() => {
    const origin = getSiteOrigin();
    if (!origin) return undefined;
    return [
      {
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: "InfluencerHub",
        description: DEFAULT_DESCRIPTION,
        url: `${origin}/`,
      },
      {
        "@context": "https://schema.org",
        "@type": "Organization",
        name: "InfluencerHub",
        url: origin,
      },
    ];
  }, []);

  return (
    <>
      <Seo
        title="Hire creators in ETB"
        description={DEFAULT_DESCRIPTION}
        canonicalPath="/"
        jsonLd={jsonLd}
      />
      <section className="relative isolate overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.12),transparent_55%)]"
        />
        <div className="mx-auto flex max-w-6xl flex-col gap-12 px-4 py-16 sm:px-6 lg:flex-row lg:items-center lg:gap-16 lg:px-8 lg:py-24">
          <div className="flex-1 space-y-6">
            <p className="inline-flex rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm">
              Ethiopia&apos;s verified creator directory
            </p>
            <h1 className="text-balance font-display text-4xl font-bold tracking-tight text-navy sm:text-5xl lg:text-6xl">
              Hire creators. Run campaigns. Pay in ETB.
            </h1>
            <p className="max-w-xl text-pretty text-lg text-muted-foreground">
              InfluencerHub connects brands with local talent — tiered visibility, campaign workflows, and Chapa
              checkout built for teams who ship.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link to="/directory">Browse directory</Link>
              </Button>
              <Button asChild variant="navy" size="lg">
                <Link to="/pricing">View pricing</Link>
              </Button>
              <Button asChild variant="accent" size="lg">
                <Link to="/auth">Create account</Link>
              </Button>
            </div>
          </div>
          <div
            className="flex flex-1 justify-center lg:justify-end"
            aria-label="Product highlight"
          >
            <div className="w-full max-w-md space-y-4 rounded-xl border border-border bg-card p-6 shadow-card">
              <p className="font-display text-lg font-semibold text-card-foreground">Why teams switch</p>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex gap-2">
                  <span className="mt-0.5 size-1.5 shrink-0 rounded-full bg-primary" aria-hidden />
                  <span>Verified profiles and moderation tools admins actually use.</span>
                </li>
                <li className="flex gap-2">
                  <span className="mt-0.5 size-1.5 shrink-0 rounded-full bg-accent" aria-hidden />
                  <span>Elite plans rank first — Free, Pro, and Elite subscriptions in ETB.</span>
                </li>
                <li className="flex gap-2">
                  <span className="mt-0.5 size-1.5 shrink-0 rounded-full bg-navy" aria-hidden />
                  <span>One place for briefs, applications, and payouts via Chapa.</span>
                </li>
              </ul>
              <div className="rounded-lg bg-gradient-to-br from-primary/15 via-accent/10 to-navy/20 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Live directory
                </p>
                <p className="mt-1 font-display text-sm font-semibold text-card-foreground">
                  Elite creators surface automatically with ranking you control.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-muted/30 py-16 sm:py-20" aria-labelledby="featured-heading">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 id="featured-heading" className="font-display text-2xl font-bold text-navy sm:text-3xl">
                Featured Elite creators
              </h2>
              <p className="mt-2 max-w-2xl text-muted-foreground">
                Elite subscriptions boost ranking in the directory. Discover voices your customers already trust.
              </p>
            </div>
            <Button asChild variant="outline">
              <Link to="/directory">See all creators</Link>
            </Button>
          </div>

          {featured.isLoading ? (
            <div
              className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
              aria-busy="true"
              aria-label="Loading featured creators"
            >
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="h-56 animate-pulse rounded-xl border border-border bg-card/80"
                />
              ))}
            </div>
          ) : featured.isError ? (
            <div className="mt-10 rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive">
              <p className="font-medium">We couldn&apos;t load featured creators.</p>
              <p className="mt-1 text-destructive/90">
                Run{" "}
                <code className="rounded bg-muted px-1 py-0.5 text-xs text-foreground">npm run db:build-sql</code> then
                paste{" "}
                <code className="rounded bg-muted px-1 py-0.5 text-xs text-foreground">supabase/APPLY_IN_SQL_EDITOR.sql</code>{" "}
                in the{" "}
                <a
                  href="https://supabase.com/dashboard/project/sqapdmmczjlrwuibbtsr/sql/new"
                  className="underline underline-offset-2"
                  target="_blank"
                  rel="noreferrer"
                >
                  Supabase SQL Editor
                </a>
                . For local dev: <code className="rounded bg-muted px-1 py-0.5 text-xs text-foreground">npx supabase start</code>{" "}
                and use <code className="rounded bg-muted px-1 py-0.5 text-xs text-foreground">.env.local</code>.
              </p>
              {import.meta.env.DEV && featured.error ? (
                <p className="mt-2 font-mono text-xs text-destructive/80">
                  {directoryErrorMessage(featured.error)}
                </p>
              ) : null}
              <Button type="button" variant="outline" className="mt-4" size="sm" onClick={() => void featured.refetch()}>
                Try again
              </Button>
            </div>
          ) : featured.data?.length ? (
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {featured.data.map((inf) => (
                <InfluencerCard key={inf.user_id} influencer={inf} />
              ))}
            </div>
          ) : (
            <div className="mt-10 rounded-xl border border-border bg-card p-10 text-center shadow-card">
              <p className="font-display text-lg font-semibold text-card-foreground">
                Elite spotlight opens soon
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                There are no approved Elite creators yet. Publish your profile and upgrade to Elite to land here.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                <Button asChild>
                  <Link to="/auth">Join as creator</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link to="/directory">Browse directory</Link>
                </Button>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="font-display text-2xl font-bold text-navy sm:text-3xl">Ready when your campaign is</h2>
          <p className="mx-auto mt-3 max-w-2xl text-muted-foreground">
            Start with the directory, upgrade visibility with Pro or Elite, and keep every brief inside one modern
            workspace.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg">
              <Link to="/directory">Open directory</Link>
            </Button>
            <Button asChild variant="secondary" size="lg">
              <Link to="/pricing">Compare plans</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
