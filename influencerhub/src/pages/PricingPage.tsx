import { Link } from "react-router-dom";

import { Seo } from "@/components/seo/Seo";
import { Button } from "@/components/ui/button";
import { useSubscriptionPlans } from "@/hooks/use-subscription-plans";
import type { Database, Json } from "@/integrations/supabase/database.types";
import { cn } from "@/lib/utils";

type PlanRow = Database["public"]["Tables"]["subscription_plans"]["Row"];

function featureList(features: Json): { label: string; value: string }[] {
  if (!features || typeof features !== "object" || Array.isArray(features)) return [];
  return Object.entries(features as Record<string, unknown>).map(([key, raw]) => ({
    label: key.replace(/_/g, " "),
    value: typeof raw === "boolean" ? (raw ? "Yes" : "No") : String(raw),
  }));
}

const FALLBACK_PLANS: PlanRow[] = [
  {
    name: "free",
    display_name: "Free",
    price_monthly: 0,
    features: {
      directory_listing: true,
      rank_boost: 0,
      verified_badge: false,
    } as Json,
    created_at: new Date(0).toISOString(),
  },
  {
    name: "pro",
    display_name: "Pro",
    price_monthly: 299,
    features: {
      directory_listing: true,
      rank_boost: 1,
      analytics: true,
      monthly_price_etb: 299,
    } as Json,
    created_at: new Date(0).toISOString(),
  },
  {
    name: "elite",
    display_name: "Elite",
    price_monthly: 699,
    features: {
      directory_listing: true,
      rank_boost: 2,
      analytics: true,
      priority_placement: true,
      monthly_price_etb: 699,
    } as Json,
    created_at: new Date(0).toISOString(),
  },
];

export function PricingPage() {
  const { data, isPending, isError, refetch } = useSubscriptionPlans();
  const plans = data && data.length > 0 ? data : FALLBACK_PLANS;

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <Seo
        title="Pricing"
        description="Free, Pro, and Elite creator plans in ETB. Upgrade for directory ranking, analytics, and campaign tools."
        canonicalPath="/pricing"
      />
      <h1 className="font-display text-3xl font-bold text-navy">Pricing</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        Start free, upgrade to Pro for serious visibility, or choose Elite for top placement in the directory and
        campaign workflows. All prices in ETB.
      </p>

      {isError ? (
        <div className="mt-6 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          Live plan metadata failed to load — showing defaults.{" "}
          <button
            type="button"
            className="font-medium underline underline-offset-2 hover:opacity-90"
            onClick={() => void refetch()}
          >
            Retry
          </button>
        </div>
      ) : null}

      {isPending ? (
        <div className="mt-10 grid gap-6 md:grid-cols-3" aria-busy="true" aria-label="Loading pricing">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-72 animate-pulse rounded-xl border border-border bg-card" />
          ))}
        </div>
      ) : plans.length === 0 ? (
        <div className="mt-10 rounded-xl border border-border bg-card p-10 text-center shadow-card">
          <p className="font-medium text-card-foreground">No plans available</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Subscription tiers have not been seeded yet. Apply core migrations and refresh.
          </p>
          <Button type="button" variant="outline" className="mt-6" onClick={() => void refetch()}>
            Retry
          </Button>
        </div>
      ) : (
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {plans.map((tier) => {
            const isPro = tier.name === "pro";
            const priceLabel =
              Number(tier.price_monthly) <= 0 ?
                "0 ETB"
              : `${Number(tier.price_monthly).toLocaleString()} ETB / mo`;
            const lines = featureList(tier.features);

            return (
              <div
                key={tier.name}
                className={cn(
                  "flex flex-col rounded-xl border bg-card p-6 shadow-card",
                  isPro ? "border-primary ring-2 ring-primary/25" : "border-border",
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h2 className="font-display text-xl font-semibold text-card-foreground">
                      {tier.display_name}
                    </h2>
                    <p className="mt-2 text-3xl font-bold text-primary">{priceLabel}</p>
                  </div>
                  {isPro ? (
                    <span className="shrink-0 rounded-full bg-accent/15 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-accent-foreground">
                      Popular
                    </span>
                  ) : null}
                </div>
                <ul className="mt-6 flex-1 space-y-2 text-sm text-muted-foreground">
                  {lines.length ?
                    lines.map((line) => (
                      <li key={line.label} className="flex gap-2">
                        <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary/80" aria-hidden />
                        <span>
                          <span className="capitalize text-card-foreground">{line.label}</span>
                          <span className="text-muted-foreground"> — {line.value}</span>
                        </span>
                      </li>
                    ))
                  : <li className="text-muted-foreground">Details coming soon.</li>}
                </ul>
                <Button asChild className="mt-8 w-full" variant={isPro ? "default" : "outline"}>
                  <Link to="/auth">{tier.name === "free" ? "Start free" : "Choose plan"}</Link>
                </Button>
              </div>
            );
          })}
        </div>
      )}

      <p className="mt-10 max-w-2xl text-sm text-muted-foreground">
        Payments run through Chapa in production. Successful checkouts update{" "}
        <code className="rounded bg-muted px-1 py-0.5 text-xs">subscriptions</code> and{" "}
        <code className="rounded bg-muted px-1 py-0.5 text-xs">payments</code> on the server — nothing sensitive lives
        in the browser.
      </p>
    </div>
  );
}
