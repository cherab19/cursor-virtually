import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";

import { useAuth } from "@/hooks/use-auth";
import type { AppRole } from "@/integrations/supabase/database.types";
import { dashboardPathForRoles } from "@/lib/auth-redirect";

export interface ProtectedRouteProps {
  allowedRoles: AppRole[];
  children: ReactNode;
}

export function ProtectedRoute({ allowedRoles, children }: ProtectedRouteProps) {
  const { session, roles, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div
        className="flex min-h-dvh items-center justify-center bg-background px-4"
        role="status"
        aria-live="polite"
        aria-busy="true"
      >
        <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-card px-8 py-10 shadow-card">
          <div
            className="size-9 animate-spin rounded-full border-2 border-muted border-t-primary"
            aria-hidden
          />
          <p className="text-sm text-muted-foreground">Loading your session…</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/auth" replace state={{ from: location }} />;
  }

  const allowed = allowedRoles.some((r) => roles.includes(r));
  if (!allowed) {
    return <Navigate to={dashboardPathForRoles(roles)} replace />;
  }

  return <>{children}</>;
}
