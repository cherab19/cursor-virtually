import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";

import { AuthContext, type AuthContextValue } from "@/context/auth-state";
import { assertSupabaseConfig, isSupabaseConfigured, supabase } from "@/integrations/supabase/client";
import type { AppRole } from "@/integrations/supabase/database.types";

async function fetchRolesForUser(userId: string): Promise<AppRole[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase.from("user_roles").select("role").eq("user_id", userId);

  if (error) {
    if (import.meta.env.DEV) {
      console.error("[auth] user_roles fetch failed", error.message);
    }
    return [];
  }

  return (data ?? []).map((row) => row.role);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthContextValue["session"]>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [initialized, setInitialized] = useState(false);
  const [rolesLoading, setRolesLoading] = useState(false);

  useEffect(() => {
    assertSupabaseConfig();
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setSession(null);
      setInitialized(true);
      return;
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    void supabase.auth
      .getSession()
      .then(({ data: { session: initial } }) => {
        setSession(initial);
      })
      .catch((err) => {
        if (import.meta.env.DEV) {
          console.warn("[auth] getSession failed", err);
        }
      })
      .finally(() => {
        setInitialized(true);
      });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const userId = session?.user?.id;

  useEffect(() => {
    if (!initialized) return;

    if (!userId) {
      setRoles([]);
      setRolesLoading(false);
      return;
    }

    let cancelled = false;
    setRolesLoading(true);

    void fetchRolesForUser(userId).then((nextRoles) => {
      if (!cancelled) {
        setRoles(nextRoles);
        setRolesLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [initialized, userId]);

  const signOut = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setSession(null);
      setRoles([]);
      return;
    }
    await supabase.auth.signOut();
  }, []);

  const refreshRoles = useCallback(async (explicitUserId?: string) => {
    const id = explicitUserId ?? userId;
    if (!id) {
      setRoles([]);
      return;
    }
    setRolesLoading(true);
    const next = await fetchRolesForUser(id);
    setRoles(next);
    setRolesLoading(false);
  }, [userId]);

  const hasRole = useCallback((role: AppRole) => roles.includes(role), [roles]);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      roles,
      loading: !initialized || rolesLoading,
      signOut,
      hasRole,
      refreshRoles,
    }),
    [session, roles, initialized, rolesLoading, signOut, hasRole, refreshRoles],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
