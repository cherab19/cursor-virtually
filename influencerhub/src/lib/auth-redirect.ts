import type { AppRole } from "@/integrations/supabase/database.types";

/** First matching dashboard for known roles (admin sees admin first). */
export function dashboardPathForRoles(roles: AppRole[]): string {
  if (roles.includes("admin")) return "/dashboard/admin";
  if (roles.includes("advertiser")) return "/dashboard/advertiser";
  if (roles.includes("influencer")) return "/dashboard/influencer";
  return "/";
}
