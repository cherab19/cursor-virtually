import { useMutation, useQueryClient } from "@tanstack/react-query";
import { type FormEvent, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { useInfluencerMe } from "@/hooks/use-influencer-me";
import { useProfileMe, type ProfileRow } from "@/hooks/use-profile-me";
import { supabase } from "@/integrations/supabase/client";
import type { SubscriptionPlanName } from "@/integrations/supabase/database.types";
import { uploadUserAvatar } from "@/lib/upload-avatar";
import { cn } from "@/lib/utils";

export function InfluencerProfileSettingsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const infQ = useInfluencerMe();
  const profQ = useProfileMe();

  const [fullName, setFullName] = useState("");
  const [bio, setBio] = useState("");
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");
  const [adPrice, setAdPrice] = useState("");
  const [plan, setPlan] = useState<SubscriptionPlanName>("free");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const inf = infQ.data;
    const prof = profQ.data;
    if (!inf || !prof) return;
    setFullName(prof.full_name ?? "");
    setBio(inf.bio ?? "");
    setCategory(inf.category ?? "");
    setLocation(inf.location ?? "");
    setAdPrice(inf.ad_price_etb != null ? String(inf.ad_price_etb) : "");
    const p = inf.subscription_plan?.toLowerCase();
    if (p === "free" || p === "pro" || p === "elite") setPlan(p);
  }, [infQ.data, profQ.data]);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("Not signed in");
      const price = Number.parseFloat(adPrice);
      if (!Number.isFinite(price) || price < 0) throw new Error("Enter a valid ETB price.");

      let avatarUrl: string | undefined;
      if (file) {
        avatarUrl = await uploadUserAvatar(user.id, file);
      }

      const profileUpdate: Partial<ProfileRow> = {
        full_name: fullName.trim(),
      };
      if (avatarUrl) profileUpdate.avatar_url = avatarUrl;

      const { error: pErr } = await supabase.from("profiles").update(profileUpdate).eq("user_id", user.id);
      if (pErr) throw pErr;

      const { error: iErr } = await supabase
        .from("influencer_profiles")
        .update({
          bio: bio.trim(),
          category: category.trim(),
          location: location.trim(),
          ad_price_etb: price,
          subscription_plan: plan,
        })
        .eq("user_id", user.id);
      if (iErr) throw iErr;
    },
    onSuccess: async () => {
      setMessage("Profile saved.");
      setError(null);
      setFile(null);
      if (preview) URL.revokeObjectURL(preview);
      setPreview(null);
      await qc.invalidateQueries({ queryKey: ["profile-me"] });
      await qc.invalidateQueries({ queryKey: ["influencer-me"] });
    },
    onError: (e: Error) => {
      setError(e.message);
      setMessage(null);
    },
  });

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setError(null);
    saveMutation.mutate();
  };

  if (infQ.isLoading || profQ.isLoading) {
    return <div className="h-40 animate-pulse rounded-xl bg-muted" aria-busy="true" />;
  }

  if (infQ.isError || profQ.isError) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6">
        <p className="text-sm text-destructive font-medium">Could not load your profile.</p>
        <p className="mt-1 text-sm text-destructive/90">
          Check your connection and try again, or sign out and back in.
        </p>
        <Button
          type="button"
          variant="outline"
          className="mt-4"
          size="sm"
          onClick={() => {
            void infQ.refetch();
            void profQ.refetch();
          }}
        >
          Retry
        </Button>
      </div>
    );
  }

  if (!infQ.data || !profQ.data) {
    return (
      <p className="text-sm text-muted-foreground">
        Complete onboarding first — we&apos;ll unlock full editing once your creator row exists.
      </p>
    );
  }

  const prof = profQ.data;

  return (
    <form className="space-y-8" onSubmit={onSubmit}>
      <div>
        <h1 className="font-display text-2xl font-bold text-card-foreground">Profile & visibility</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Updates write to <code className="rounded bg-muted px-1 text-xs">profiles</code> and{" "}
          <code className="rounded bg-muted px-1 text-xs">influencer_profiles</code> under RLS.
        </p>
      </div>

      <section className="rounded-xl border border-border bg-card p-6 shadow-card" aria-labelledby="avatar-heading">
        <h2 id="avatar-heading" className="font-display text-lg font-semibold text-card-foreground">
          Avatar
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">Stored in Supabase Storage bucket `avatars` under your user id.</p>
        <div className="mt-4 flex flex-wrap items-center gap-6">
          {preview || prof.avatar_url ? (
            <img
              src={preview ?? prof.avatar_url ?? ""}
              alt=""
              className="size-24 rounded-full object-cover ring-2 ring-border"
            />
          ) : (
            <div className="flex size-24 items-center justify-center rounded-full bg-muted text-muted-foreground">
              No photo
            </div>
          )}
          <div>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="text-sm text-muted-foreground file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-primary-foreground"
              onChange={(e) => {
                const f = e.target.files?.[0] ?? null;
                setFile(f);
                if (preview) URL.revokeObjectURL(preview);
                setPreview(f ? URL.createObjectURL(f) : null);
              }}
            />
            <p className="mt-2 text-xs text-muted-foreground">5MB max. JPG, PNG, WebP, or GIF.</p>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-6 shadow-card space-y-4">
        <div>
          <label htmlFor="pf-name" className="text-sm font-medium text-card-foreground">
            Display name
          </label>
          <Input id="pf-name" value={fullName} onChange={(e) => setFullName(e.target.value)} required className="mt-1" />
        </div>
        <div>
          <label htmlFor="pf-bio" className="text-sm font-medium text-card-foreground">
            Bio
          </label>
          <textarea
            id="pf-bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={4}
            className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="pf-cat" className="text-sm font-medium text-card-foreground">
              Category
            </label>
            <Input id="pf-cat" value={category} onChange={(e) => setCategory(e.target.value)} className="mt-1" />
          </div>
          <div>
            <label htmlFor="pf-loc" className="text-sm font-medium text-card-foreground">
              Location
            </label>
            <Input id="pf-loc" value={location} onChange={(e) => setLocation(e.target.value)} className="mt-1" />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="pf-price" className="text-sm font-medium text-card-foreground">
              Ad price (ETB)
            </label>
            <Input
              id="pf-price"
              type="number"
              min={0}
              step={1}
              value={adPrice}
              onChange={(e) => setAdPrice(e.target.value)}
              className="mt-1"
              required
            />
          </div>
          <fieldset>
            <legend className="text-sm font-medium text-card-foreground">Plan preference</legend>
            <div className="mt-2 flex flex-wrap gap-3">
              {(["free", "pro", "elite"] as const).map((p) => (
                <label
                  key={p}
                  className={cn(
                    "flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm capitalize has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring",
                    plan === p ? "border-primary bg-primary/5" : "border-border",
                  )}
                >
                  <input type="radio" name="plan" checked={plan === p} onChange={() => setPlan(p)} />
                  {p}
                </label>
              ))}
            </div>
          </fieldset>
        </div>
      </section>

      {message ? (
        <p className="rounded-md border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">{message}</p>
      ) : null}
      {error ? (
        <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <Button type="submit" disabled={saveMutation.isPending}>
        {saveMutation.isPending ? "Saving…" : "Save changes"}
      </Button>
    </form>
  );
}
