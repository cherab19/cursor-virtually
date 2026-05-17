import { isSupabaseConfigured } from "@/integrations/supabase/client";

export function ConfigBanner() {
  if (isSupabaseConfigured) return null;

  return (
    <div
      role="status"
      className="border-b border-accent/30 bg-accent/10 px-4 py-2 text-center text-sm text-foreground"
    >
      <strong className="font-medium">Demo mode:</strong> Add{" "}
      <code className="rounded bg-card px-1 py-0.5 text-xs">VITE_SUPABASE_URL</code> and{" "}
      <code className="rounded bg-card px-1 py-0.5 text-xs">VITE_SUPABASE_PUBLISHABLE_KEY</code> to{" "}
      <code className="rounded bg-card px-1 py-0.5 text-xs">.env</code> (see{" "}
      <code className="rounded bg-card px-1 py-0.5 text-xs">.env.example</code>) to enable auth and
      live data.
    </div>
  );
}
