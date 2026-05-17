import { type FormEvent, useMemo, useRef, useState } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";

import { Seo } from "@/components/seo/Seo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { isSupabaseConfigured, supabase } from "@/integrations/supabase/client";
import type { AppRole } from "@/integrations/supabase/database.types";
import { formatAuthError } from "@/lib/auth-errors";
import { dashboardPathForRoles } from "@/lib/auth-redirect";
import { getSiteOrigin } from "@/lib/site";
import { cn } from "@/lib/utils";

type AuthMode = "signin" | "signup";
type SignupRole = Extract<AppRole, "influencer" | "advertiser">;

export function AuthPage() {
  const { session, roles, loading, refreshRoles } = useAuth();
  const location = useLocation();

  const fromPath = useMemo(() => {
    const state = location.state as { from?: { pathname?: string } } | null;
    const p = state?.from?.pathname;
    return p && p !== "/auth" ? p : null;
  }, [location.state]);

  const [mode, setMode] = useState<AuthMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [signupRole, setSignupRole] = useState<SignupRole>("influencer");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const submitInFlight = useRef(false);

  if (loading) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center justify-center px-4 py-24 sm:px-6 lg:px-8">
        <Seo
          title="Sign in"
          description="Sign in or create an InfluencerHub account as a creator or brand."
          canonicalPath="/auth"
          noindex
        />
        <div
          className="flex flex-col items-center gap-3 rounded-xl border border-border bg-card px-10 py-12 shadow-card"
          role="status"
          aria-live="polite"
          aria-busy="true"
        >
          <div
            className="size-9 animate-spin rounded-full border-2 border-muted border-t-primary"
            aria-hidden
          />
          <p className="text-sm text-muted-foreground">Checking your session…</p>
        </div>
      </div>
    );
  }

  if (!loading && session) {
    const target = fromPath ?? dashboardPathForRoles(roles);
    return <Navigate to={target} replace />;
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (submitInFlight.current || busy) return;

    setError(null);
    setInfo(null);
    submitInFlight.current = true;
    setBusy(true);

    try {
      if (!isSupabaseConfigured) {
        setError("Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY to .env, then restart the dev server.");
        return;
      }
      if (mode === "signup") {
        const origin = getSiteOrigin();
        const emailRedirectTo = origin ? `${origin}/auth` : undefined;
        const { error: signUpError, data } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo,
            data: {
              full_name: fullName.trim(),
              role: signupRole,
            },
          },
        });

        if (signUpError) {
          setError(formatAuthError(signUpError));
          return;
        }

        if (data.user && !data.session) {
          setInfo("Check your email to confirm your account, then sign in.");
          return;
        }

        if (data.session?.user) {
          await refreshRoles(data.session.user.id);
        }
      } else {
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (signInError) {
          setError(formatAuthError(signInError));
          return;
        }

        if (signInData.user) {
          await refreshRoles(signInData.user.id);
        }
      }
    } finally {
      submitInFlight.current = false;
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg px-4 py-16 sm:px-6 lg:px-8">
      <Seo
        title="Sign in"
        description="Sign in or create an InfluencerHub account as a creator or brand."
        canonicalPath="/auth"
        noindex
      />
      <h1 className="font-display text-3xl font-bold text-navy">Account</h1>
      <p className="mt-2 text-muted-foreground">
        Sign in with email and password, or create an account and choose how you&apos;ll use InfluencerHub.
      </p>

      <div
        className="mt-6 flex gap-2 rounded-lg border border-border bg-muted/40 p-1"
        role="tablist"
        aria-label="Authentication mode"
      >
        <button
          type="button"
          role="tab"
          aria-selected={mode === "signin"}
          className={cn(
            "flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-50",
            mode === "signin"
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:bg-card/60 hover:text-foreground",
          )}
          onClick={() => {
            setMode("signin");
            setError(null);
            setInfo(null);
          }}
        >
          Sign in
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "signup"}
          className={cn(
            "flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-50",
            mode === "signup"
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:bg-card/60 hover:text-foreground",
          )}
          onClick={() => {
            setMode("signup");
            setError(null);
            setInfo(null);
          }}
        >
          Sign up
        </button>
      </div>

      <form
        className="mt-8 space-y-4 rounded-xl border border-border bg-card p-6 shadow-card"
        onSubmit={onSubmit}
        aria-label={mode === "signin" ? "Sign in form" : "Sign up form"}
      >
        {mode === "signup" ? (
          <div>
            <label htmlFor="full_name" className="text-sm font-medium text-card-foreground">
              Full name
            </label>
            <Input
              id="full_name"
              name="full_name"
              type="text"
              autoComplete="name"
              value={fullName}
              onChange={(ev) => setFullName(ev.target.value)}
              required={mode === "signup"}
              disabled={busy}
              className="mt-1"
              placeholder="Selam Tesfaye"
            />
          </div>
        ) : null}

        <div>
          <label htmlFor="email" className="text-sm font-medium text-card-foreground">
            Email
          </label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(ev) => setEmail(ev.target.value)}
            required
            disabled={busy}
            className="mt-1"
            placeholder="you@brand.com"
          />
        </div>

        <div>
          <label htmlFor="password" className="text-sm font-medium text-card-foreground">
            Password
          </label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
            value={password}
            onChange={(ev) => setPassword(ev.target.value)}
            required
            minLength={6}
            disabled={busy}
            className="mt-1"
            placeholder="••••••••"
          />
          {mode === "signup" ? (
            <p className="mt-1 text-xs text-muted-foreground">At least 6 characters.</p>
          ) : null}
        </div>

        {mode === "signup" ? (
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium text-card-foreground">I am signing up as</legend>
            <div className="flex flex-col gap-2 sm:flex-row">
              {(
                [
                  { value: "influencer" as const, label: "Influencer / creator" },
                  { value: "advertiser" as const, label: "Advertiser / brand" },
                ] as const
              ).map((opt) => (
                <label
                  key={opt.value}
                  className={cn(
                    "flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring",
                    signupRole === opt.value
                      ? "border-primary bg-primary/5 text-foreground"
                      : "border-border bg-background text-muted-foreground hover:border-muted-foreground/40",
                  )}
                >
                  <input
                    type="radio"
                    name="signup_role"
                    value={opt.value}
                    checked={signupRole === opt.value}
                    onChange={() => setSignupRole(opt.value)}
                    disabled={busy}
                    className="size-4 border-input text-primary focus:ring-ring"
                    aria-label={opt.label}
                  />
                  <span>{opt.label}</span>
                </label>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Your role is stored in <code className="rounded bg-muted px-1 py-0.5 text-[10px]">user_roles</code>{" "}
              on the server — never on <code className="rounded bg-muted px-1 py-0.5 text-[10px]">profiles</code>.
            </p>
          </fieldset>
        ) : null}

        {error ? (
          <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        ) : null}

        {info ? (
          <p className="rounded-md border border-border bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
            {info}
          </p>
        ) : null}

        <Button type="submit" className="w-full" disabled={busy}>
          {busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        <Link to="/" className="text-primary underline-offset-4 hover:underline">
          Back to home
        </Link>
      </p>
    </div>
  );
}
