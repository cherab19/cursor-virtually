import type { Session, User } from "@supabase/supabase-js";
import { createContext } from "react";

import type { AppRole } from "@/integrations/supabase/database.types";

export interface AuthContextValue {
  session: Session | null;
  user: User | null;
  roles: AppRole[];
  loading: boolean;
  signOut: () => Promise<void>;
  hasRole: (role: AppRole) => boolean;
  refreshRoles: (explicitUserId?: string) => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
