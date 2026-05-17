import { ExternalLink, Star } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";

import { ContactInfluencerModal } from "@/components/influencers/ContactInfluencerModal";
import { VerifiedAvatarBadge } from "@/components/influencers/VerifiedBadge";
import { ReviewComposer } from "@/components/reviews/ReviewComposer";
import { Seo } from "@/components/seo/Seo";
import { Button } from "@/components/ui/button";
import { usePublicInfluencer } from "@/hooks/use-influencer-directory";
import { useAuth } from "@/hooks/use-auth";
import { useInfluencerReviews, useInfluencerSocialLinks } from "@/hooks/use-influencer-profile-data";
import { formatFollowers } from "@/lib/influencer-format";
import { cn } from "@/lib/utils";
import { DEFAULT_DESCRIPTION, getSiteOrigin } from "@/lib/site";

function clipMetaDescription(text: string, max: number) {
  const t = text.trim();
  if (!t) return DEFAULT_DESCRIPTION;
  return t.length > max ? `${t.slice(0, max - 1)}…` : t;
}

function PlanRibbon({ plan }: { plan: string }) {
  const p = plan.toLowerCase();
  return (
    <span
      className={cn(
        "rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide",
        p === "elite" && "border-accent/40 bg-accent/15 text-accent-foreground",
        p === "pro" && "border-primary/35 bg-primary/10 text-primary",
        p === "free" && "border-border bg-muted text-muted-foreground",
        !["elite", "pro", "free"].includes(p) && "border-border bg-muted/80 text-muted-foreground",
      )}
    >
      {plan} plan
    </span>
  );
}

export function InfluencerProfilePage() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const [contactOpen, setContactOpen] = useState(false);

  const profile = usePublicInfluencer(id);
  const social = useInfluencerSocialLinks(id);
  const reviews = useInfluencerReviews(id);
  const { user, session, hasRole } = useAuth();

  const row = profile.data;
  const loading = profile.isLoading || social.isLoading || reviews.isLoading;
  const error = profile.isError;

  const isOwnProfile = Boolean(user?.id && id && user.id === id);
  const canPostReview =
    Boolean(session && id && !isOwnProfile && (hasRole("advertiser") || hasRole("admin")));
  const reviewDisabledReason =
    !session ? "Sign in as a brand account to leave a review."
    : isOwnProfile ? undefined
    : !hasRole("advertiser") && !hasRole("admin") ?
      "Only advertiser or admin accounts can post reviews."
    : undefined;

  const profilePath = id ? `/influencer/${id}` : "/influencer";

  const displayName = row?.full_name?.trim() || "Creator";
  const seoTitle = row ? displayName : "Creator profile";
  const metaDescription = useMemo(
    () => clipMetaDescription(row?.bio ?? "", 155),
    [row?.bio],
  );

  const profileJsonLd = useMemo(() => {
    const origin = getSiteOrigin();
    if (!row || !origin) return undefined;
    return {
      "@context": "https://schema.org",
      "@type": "ProfilePage",
      name: seoTitle,
      description: metaDescription,
      url: `${origin}/influencer/${row.user_id}`,
    };
  }, [row, seoTitle, metaDescription]);

  if (error) {
    return (
      <>
        <Seo
          title="Profile unavailable"
          description="This creator profile could not be loaded."
          canonicalPath={profilePath}
          noindex
        />
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive">
            Something went wrong loading this profile.
            <Button type="button" variant="outline" className="mt-4" size="sm" onClick={() => void profile.refetch()}>
              Retry
            </Button>
          </div>
        </div>
      </>
    );
  }

  if (!loading && !row) {
    return (
      <>
        <Seo
          title="Creator not found"
          description="This creator is not listed in the public directory."
          canonicalPath={profilePath}
          noindex
        />
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
          <h1 className="font-display text-3xl font-bold text-navy">Creator not found</h1>
          <p className="mt-2 text-muted-foreground">
            This profile is not public yet or the link is incorrect.
          </p>
          <Button asChild className="mt-6" variant="outline">
            <Link to="/directory">Back to directory</Link>
          </Button>
        </div>
      </>
    );
  }

  const avgRating =
    reviews.data?.length ?
      reviews.data.reduce((s, r) => s + r.rating, 0) / reviews.data.length
    : null;

  return (
    <>
      <Seo
        title={seoTitle}
        description={metaDescription}
        canonicalPath={profilePath}
        jsonLd={profileJsonLd}
      />
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        {loading && !row ? (
          <div className="space-y-4" aria-busy="true" aria-label="Loading profile">
            <div className="h-10 w-2/3 max-w-md animate-pulse rounded-lg bg-muted" />
            <div className="h-40 animate-pulse rounded-xl bg-muted" />
          </div>
        ) : row ? (
          <>
            <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
              <div className="flex flex-1 gap-6">
                {row.avatar_url ? (
                  <div className="relative shrink-0">
                    <img
                      src={row.avatar_url}
                      alt=""
                      className="size-28 shrink-0 rounded-2xl object-cover shadow-card ring-2 ring-border sm:size-32"
                    />
                    {row.is_verified ? <VerifiedAvatarBadge className="size-6 sm:size-7 [&>svg]:size-4" /> : null}
                  </div>
                ) : (
                  <div className="relative shrink-0">
                    <div
                      className="flex size-28 shrink-0 items-center justify-center rounded-2xl bg-muted font-display text-xl font-semibold text-muted-foreground ring-2 ring-border sm:size-32"
                      aria-hidden
                    >
                      {displayName.slice(0, 2).toUpperCase()}
                    </div>
                    {row.is_verified ? <VerifiedAvatarBadge className="size-6 sm:size-7 [&>svg]:size-4" /> : null}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="font-display text-3xl font-bold text-navy">{displayName}</h1>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {[row.category, row.location].filter(Boolean).join(" · ")}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <PlanRibbon plan={row.subscription_plan} />
                    <span className="rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-muted-foreground">
                      {formatFollowers(row.followers_count)} followers
                    </span>
                    {row.ad_price_etb != null ? (
                      <span className="rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-foreground">
                        From {Number(row.ad_price_etb).toLocaleString()} ETB
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-6 max-w-2xl text-pretty text-muted-foreground">{row.bio || "No bio yet."}</p>
                  <div className="mt-6 flex flex-wrap gap-2">
                    <Button type="button" variant="accent" onClick={() => setContactOpen(true)}>
                      Contact
                    </Button>
                    <Button asChild variant="outline">
                      <Link to="/directory">Directory</Link>
                    </Button>
                  </div>
                </div>
              </div>
              <aside
                className="w-full shrink-0 rounded-xl border border-border bg-card p-5 shadow-card lg:max-w-xs"
                aria-label="Performance snapshot"
              >
                <p className="font-display text-sm font-semibold text-card-foreground">Snapshot</p>
                <dl className="mt-4 space-y-3 text-sm">
                  <div>
                    <dt className="text-muted-foreground">Engagement rate</dt>
                    <dd className="font-medium text-card-foreground">
                      {row.engagement_rate != null ? `${Number(row.engagement_rate).toFixed(1)}%` : "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Average review</dt>
                    <dd className="font-medium text-card-foreground flex items-center gap-1">
                      {avgRating != null ? (
                        <>
                          <Star className="size-4 fill-accent text-accent" aria-hidden />
                          {avgRating.toFixed(1)} ({reviews.data?.length ?? 0})
                        </>
                      ) : (
                        "No reviews yet"
                      )}
                    </dd>
                  </div>
                </dl>
              </aside>
            </div>

            <section className="mt-12" aria-labelledby="social-heading">
              <h2 id="social-heading" className="font-display text-xl font-semibold text-navy">
                Social links
              </h2>
              {social.isLoading ? (
                <p className="mt-4 text-sm text-muted-foreground" aria-busy="true">
                  Loading social links…
                </p>
              ) : social.isError ? (
                <p className="mt-2 text-sm text-destructive">Could not load social links.</p>
              ) : social.data?.length ? (
                <ul className="mt-4 flex flex-wrap gap-2">
                  {social.data.map((s) => (
                    <li key={s.id}>
                      {s.url ? (
                        <a
                          href={s.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-card-foreground shadow-sm transition-colors hover:border-primary/40 hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          {s.platform}
                          <ExternalLink className="size-3.5 text-muted-foreground" aria-hidden />
                          <span className="sr-only">(opens in new tab)</span>
                        </a>
                      ) : (
                        <span className="inline-flex rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
                          {s.platform}
                          {s.handle ? ` · @${s.handle}` : ""}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-4 text-sm text-muted-foreground">No social links published yet.</p>
              )}
            </section>

            <section className="mt-12" aria-labelledby="reviews-heading">
              <h2 id="reviews-heading" className="font-display text-xl font-semibold text-navy">
                Reviews
              </h2>
              {id ? (
                <ReviewComposer
                  revieweeId={id}
                  canSubmit={canPostReview}
                  disabledReason={reviewDisabledReason}
                />
              ) : null}
              {reviews.isLoading && reviews.data === undefined ? (
                <p className="mt-4 text-sm text-muted-foreground" aria-busy="true">
                  Loading reviews…
                </p>
              ) : reviews.isError ? (
                <p className="mt-2 text-sm text-destructive">Could not load reviews.</p>
              ) : reviews.data?.length ? (
                <ul className="mt-4 space-y-4">
                  {reviews.data.map((r) => (
                    <li key={r.id} className="rounded-xl border border-border bg-card p-4 shadow-sm">
                      <div className="flex items-center gap-1 text-accent" aria-label={`${r.rating} out of 5`}>
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={cn(
                              "size-4",
                              i < r.rating ? "fill-accent text-accent" : "text-muted opacity-30",
                            )}
                            aria-hidden
                          />
                        ))}
                      </div>
                      <p className="mt-2 text-sm text-card-foreground">{r.comment || "No comment."}</p>
                      <p className="mt-2 text-xs text-muted-foreground">
                        <span className="font-medium text-muted-foreground">{r.reviewer_label}</span>
                        {" · "}
                        {new Date(r.created_at).toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-4 text-sm text-muted-foreground">No reviews yet.</p>
              )}
            </section>
          </>
        ) : null}
      </div>

      <ContactInfluencerModal
        open={contactOpen}
        onOpenChange={setContactOpen}
        influencerName={displayName}
        returnPath={location.pathname}
      />
    </>
  );
}
