import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { type FormEvent, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { useInfluencerMe } from "@/hooks/use-influencer-me";
import { useProfileMe, type ProfileRow } from "@/hooks/use-profile-me";
import { supabase } from "@/integrations/supabase/client";
import { uploadUserAvatar } from "@/lib/upload-avatar";
import { cn } from "@/lib/utils";

type SocialDraft = { platform: string; handle: string; url: string };

function firstIncompleteStep(
  hasInfluencerRow: boolean,
  bio: string,
  category: string,
  location: string,
  price: number | null,
  socialCount: number,
  avatarUrl: string | null | undefined,
  onboardingCompleted: boolean,
): number {
  if (!hasInfluencerRow || !bio.trim() || !category.trim()) return 1;
  if (!location.trim() || price == null) return 2;
  if (socialCount < 1) return 3;
  if (!avatarUrl?.trim()) return 4;
  if (!onboardingCompleted) return 5;
  return 5;
}

export interface InfluencerOnboardingWizardProps {
  open: boolean;
}

export function InfluencerOnboardingWizard({ open }: InfluencerOnboardingWizardProps) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const infQ = useInfluencerMe();
  const profQ = useProfileMe();

  const userId = user?.id;

  const socialQ = useQuery({
    queryKey: ["social-links-me", userId],
    enabled: Boolean(open && userId),
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from("social_links")
        .select("id, platform, handle, url, followers_count")
        .eq("influencer_id", userId)
        .order("platform");
      if (error) throw error;
      return data ?? [];
    },
  });

  const [step, setStep] = useState(1);
  const [bio, setBio] = useState("");
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");
  const [adPrice, setAdPrice] = useState("");
  const [socialDraft, setSocialDraft] = useState<SocialDraft[]>([
    { platform: "Instagram", handle: "", url: "" },
  ]);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [plan, setPlan] = useState<"free" | "pro" | "elite">("free");
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const sessionReadyRef = useRef(false);

  const inf = infQ.data;
  const prof = profQ.data;

  useEffect(() => {
    if (!open) {
      sessionReadyRef.current = false;
      return;
    }
    if (infQ.isLoading || profQ.isLoading || socialQ.isLoading) return;
    if (sessionReadyRef.current) return;
    sessionReadyRef.current = true;

    if (inf) {
      setBio(inf.bio ?? "");
      setCategory(inf.category ?? "");
      setLocation(inf.location ?? "");
      setAdPrice(inf.ad_price_etb != null ? String(inf.ad_price_etb) : "");
      const p = inf.subscription_plan?.toLowerCase();
      if (p === "pro" || p === "elite" || p === "free") setPlan(p);
    } else {
      setBio("");
      setCategory("");
      setLocation("");
      setAdPrice("");
      setPlan("free");
    }

    if (socialQ.data && socialQ.data.length > 0) {
      setSocialDraft(
        socialQ.data.map((r) => ({
          platform: r.platform,
          handle: r.handle ?? "",
          url: r.url ?? "",
        })),
      );
    } else {
      setSocialDraft([{ platform: "Instagram", handle: "", url: "" }]);
    }

    setAvatarFile(null);
    setAvatarPreview(null);
    setFormError(null);

    setStep(
      firstIncompleteStep(
        Boolean(inf),
        inf?.bio ?? "",
        inf?.category ?? "",
        inf?.location ?? "",
        inf?.ad_price_etb ?? null,
        socialQ.data?.length ?? 0,
        prof?.avatar_url,
        inf?.onboarding_completed ?? false,
      ),
    );
  }, [
    open,
    infQ.isLoading,
    profQ.isLoading,
    socialQ.isLoading,
    inf,
    prof?.avatar_url,
    socialQ.data,
  ]);

  const invalidateAll = () => {
    void qc.invalidateQueries({ queryKey: ["influencer-me"] });
    void qc.invalidateQueries({ queryKey: ["profile-me"] });
    void qc.invalidateQueries({ queryKey: ["social-links-me"] });
  };

  const saveStep1 = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error("Not signed in");
      if (!bio.trim() || !category.trim()) throw new Error("Bio and category are required.");
      const { error } = await supabase.from("influencer_profiles").upsert(
        {
          user_id: userId,
          bio: bio.trim(),
          category: category.trim(),
          onboarding_completed: false,
        },
        { onConflict: "user_id" },
      );
      if (error) throw error;
    },
    onSuccess: invalidateAll,
  });

  const saveStep2 = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error("Not signed in");
      if (!location.trim()) throw new Error("Location is required.");
      const price = Number.parseFloat(adPrice);
      if (!Number.isFinite(price) || price < 0) throw new Error("Enter a valid ad price in ETB.");
      const { error } = await supabase
        .from("influencer_profiles")
        .update({
          location: location.trim(),
          ad_price_etb: price,
          onboarding_completed: false,
        })
        .eq("user_id", userId);
      if (error) throw error;
    },
    onSuccess: invalidateAll,
  });

  const saveStep3 = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error("Not signed in");
      const rows = socialDraft
        .map((s) => ({
          platform: s.platform.trim(),
          handle: s.handle.trim(),
          url: s.url.trim() || null,
        }))
        .filter((s) => s.platform.length > 0);

      if (rows.length < 1) throw new Error("Add at least one social profile.");

      const { error: delErr } = await supabase.from("social_links").delete().eq("influencer_id", userId);
      if (delErr) throw delErr;

      const { error: insErr } = await supabase.from("social_links").insert(
        rows.map((r) => ({
          influencer_id: userId,
          platform: r.platform,
          handle: r.handle,
          url: r.url,
          followers_count: 0,
        })),
      );
      if (insErr) throw insErr;
    },
    onSuccess: invalidateAll,
  });

  const saveStep4 = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error("Not signed in");
      const cached = qc.getQueryData<ProfileRow | null>(["profile-me", userId]);
      let publicUrl: string;
      if (avatarFile) {
        publicUrl = await uploadUserAvatar(userId, avatarFile);
      } else if (cached?.avatar_url?.trim()) {
        publicUrl = cached.avatar_url.trim();
      } else {
        throw new Error("Choose an image to continue.");
      }
      const { error } = await supabase.from("profiles").update({ avatar_url: publicUrl }).eq("user_id", userId);
      if (error) throw error;
    },
    onSuccess: invalidateAll,
  });

  const finishStep5 = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error("Not signed in");
      const { error } = await supabase
        .from("influencer_profiles")
        .update({
          subscription_plan: plan,
          onboarding_completed: true,
        })
        .eq("user_id", userId);
      if (error) throw error;
    },
    onSuccess: invalidateAll,
  });

  const onAvatarChange = (file: File | null) => {
    setAvatarFile(file);
    if (avatarPreview) {
      URL.revokeObjectURL(avatarPreview);
      setAvatarPreview(null);
    }
    if (file) setAvatarPreview(URL.createObjectURL(file));
  };

  useEffect(() => {
    return () => {
      if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    };
  }, [avatarPreview]);

  const runStep = async (n: number) => {
    setFormError(null);
    setBusy(true);
    try {
      if (n === 1) await saveStep1.mutateAsync();
      else if (n === 2) await saveStep2.mutateAsync();
      else if (n === 3) await saveStep3.mutateAsync();
      else if (n === 4) await saveStep4.mutateAsync();
      else if (n === 5) {
        await finishStep5.mutateAsync();
        return;
      }

      if (n < 5) {
        setStep((s) => Math.min(5, s + 1));
      }
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    void runStep(step);
  };

  const goBack = () => {
    setFormError(null);
    setStep((s) => Math.max(1, s - 1));
  };

  if (!open || !userId) return null;

  const dataPending = infQ.isLoading || profQ.isLoading || socialQ.isLoading;
  const dataError = infQ.isError || profQ.isError || socialQ.isError;

  const steps = [
    { n: 1, label: "Story" },
    { n: 2, label: "Rates" },
    { n: 3, label: "Social" },
    { n: 4, label: "Photo" },
    { n: 5, label: "Plan" },
  ];

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-navy/50 p-4 backdrop-blur-sm"
      role="presentation"
    >
      <div
        className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-border bg-card p-6 shadow-card sm:p-8"
        role="dialog"
        aria-modal="true"
        aria-labelledby="onboarding-title"
      >
        <h2 id="onboarding-title" className="font-display text-xl font-bold text-card-foreground">
          Finish your creator profile
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Five quick steps — you can edit everything later in Profile.
        </p>

        {dataError ? (
          <div
            className="mt-4 rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            role="alert"
          >
            <p className="font-medium">Could not load your profile data.</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-3 border-destructive/30"
              onClick={() => {
                void infQ.refetch();
                void profQ.refetch();
                void socialQ.refetch();
              }}
            >
              Retry
            </Button>
          </div>
        ) : null}

        {dataPending ? (
          <div
            className="mt-4 flex items-center gap-2 text-sm text-muted-foreground"
            role="status"
            aria-live="polite"
            aria-busy="true"
          >
            <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden />
            Loading your profile…
          </div>
        ) : null}

        <ol className="mt-6 flex gap-1" aria-label="Onboarding progress">
          {steps.map((s) => (
            <li
              key={s.n}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-colors",
                step >= s.n ? "bg-primary" : "bg-muted",
              )}
              aria-current={step === s.n ? "step" : undefined}
            />
          ))}
        </ol>
        <p className="mt-2 text-xs font-medium text-muted-foreground">
          Step {step} of 5 · {steps[step - 1]?.label}
        </p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          {step === 1 ? (
            <>
              <div>
                <label htmlFor="ob-bio" className="text-sm font-medium text-card-foreground">
                  Bio
                </label>
                <textarea
                  id="ob-bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  required
                  rows={4}
                  disabled={busy || dataPending}
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  placeholder="Tell brands what you create and who you reach."
                />
              </div>
              <div>
                <label htmlFor="ob-cat" className="text-sm font-medium text-card-foreground">
                  Category
                </label>
                <Input id="ob-cat" value={category} onChange={(e) => setCategory(e.target.value)} required disabled={busy || dataPending} />
              </div>
            </>
          ) : null}

          {step === 2 ? (
            <>
              <div>
                <label htmlFor="ob-loc" className="text-sm font-medium text-card-foreground">
                  Location
                </label>
                <Input id="ob-loc" value={location} onChange={(e) => setLocation(e.target.value)} required disabled={busy || dataPending} />
              </div>
              <div>
                <label htmlFor="ob-price" className="text-sm font-medium text-card-foreground">
                  Typical ad price (ETB)
                </label>
                <Input
                  id="ob-price"
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step={1}
                  value={adPrice}
                  onChange={(e) => setAdPrice(e.target.value)}
                  required
                  disabled={busy || dataPending}
                />
              </div>
            </>
          ) : null}

          {step === 3 ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">Add at least one channel brands can verify.</p>
              {socialDraft.map((row, idx) => (
                <div key={idx} className="rounded-lg border border-border bg-muted/20 p-3 space-y-2">
                  <Input
                    aria-label={`Platform ${idx + 1}`}
                    placeholder="Platform"
                    value={row.platform}
                    disabled={busy || dataPending}
                    onChange={(e) => {
                      const next = [...socialDraft];
                      next[idx] = { ...next[idx], platform: e.target.value };
                      setSocialDraft(next);
                    }}
                  />
                  <Input
                    aria-label={`Handle ${idx + 1}`}
                    placeholder="Handle"
                    value={row.handle}
                    disabled={busy || dataPending}
                    onChange={(e) => {
                      const next = [...socialDraft];
                      next[idx] = { ...next[idx], handle: e.target.value };
                      setSocialDraft(next);
                    }}
                  />
                  <Input
                    aria-label={`Profile URL ${idx + 1}`}
                    placeholder="Profile URL (optional)"
                    value={row.url}
                    disabled={busy || dataPending}
                    onChange={(e) => {
                      const next = [...socialDraft];
                      next[idx] = { ...next[idx], url: e.target.value };
                      setSocialDraft(next);
                    }}
                  />
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={busy || dataPending}
                onClick={() => setSocialDraft((d) => [...d, { platform: "", handle: "", url: "" }])}
              >
                Add another platform
              </Button>
            </div>
          ) : null}

          {step === 4 ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Square or portrait photos work best. Max 5MB, JPG/PNG/WebP/GIF.
              </p>
              {prof?.avatar_url && !avatarPreview ? (
                <p className="text-xs text-muted-foreground">
                  Current avatar is saved — pick a new file to replace it for this step.
                </p>
              ) : null}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="text-sm text-muted-foreground file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-primary-foreground hover:file:bg-primary/90"
                disabled={busy || dataPending}
                onChange={(e) => onAvatarChange(e.target.files?.[0] ?? null)}
              />
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt=""
                  className="h-32 w-32 rounded-full object-cover ring-2 ring-border"
                />
              ) : prof?.avatar_url ? (
                <img
                  src={prof.avatar_url}
                  alt=""
                  className="h-32 w-32 rounded-full object-cover ring-2 ring-border"
                />
              ) : null}
            </div>
          ) : null}

          {step === 5 ? (
            <fieldset className="space-y-2">
              <legend className="text-sm font-medium text-card-foreground">Visibility plan</legend>
              {(
                [
                  { id: "free" as const, title: "Free", hint: "Start building your presence." },
                  { id: "pro" as const, title: "Pro · 299 ETB/mo", hint: "Stronger placement and analytics." },
                  { id: "elite" as const, title: "Elite · 699 ETB/mo", hint: "Top directory ranking and priority." },
                ] as const
              ).map((opt) => (
                <label
                  key={opt.id}
                  className={cn(
                    "flex cursor-pointer items-start gap-3 rounded-lg border p-3 text-sm transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring",
                    plan === opt.id ? "border-primary bg-primary/5" : "border-border bg-background",
                  )}
                >
                  <input
                    type="radio"
                    name="plan"
                    checked={plan === opt.id}
                    onChange={() => setPlan(opt.id)}
                    disabled={busy || dataPending}
                    className="mt-1"
                  />
                  <span>
                    <span className="font-medium text-card-foreground">{opt.title}</span>
                    <span className="mt-0.5 block text-muted-foreground">{opt.hint}</span>
                  </span>
                </label>
              ))}
              <p className="text-xs text-muted-foreground">
                Billing through Chapa arrives in a later phase — your selection is stored on{" "}
                <code className="rounded bg-muted px-1">influencer_profiles.subscription_plan</code>.
              </p>
            </fieldset>
          ) : null}

          {formError ? (
            <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {formError}
            </p>
          ) : null}

          <div className="flex flex-wrap gap-2 pt-2">
            {step > 1 ? (
              <Button type="button" variant="outline" disabled={busy || dataPending} onClick={goBack}>
                Back
              </Button>
            ) : (
              <span className="text-xs text-muted-foreground self-center">You&apos;re almost there.</span>
            )}
            <Button type="submit" disabled={busy || dataPending} className="min-w-[120px]">
              {busy ? "Saving…" : step === 5 ? "Finish setup" : "Save & continue"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
