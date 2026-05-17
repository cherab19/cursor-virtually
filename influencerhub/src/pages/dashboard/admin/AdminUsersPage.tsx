import { Loader2 } from "lucide-react";

import { useAdminUsersList } from "@/hooks/use-admin-dashboard";
import { cn } from "@/lib/utils";

function RoleBadges({ roles }: { roles: string[] }) {
  if (!roles.length) {
    return <span className="text-xs text-muted-foreground">No role row</span>;
  }
  return (
    <div className="flex flex-wrap gap-1">
      {roles.map((r) => (
        <span
          key={r}
          className={cn(
            "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
            r === "admin"
              ? "bg-destructive/15 text-destructive"
              : r === "advertiser"
                ? "bg-secondary text-secondary-foreground"
                : "bg-primary/10 text-primary",
          )}
        >
          {r}
        </span>
      ))}
    </div>
  );
}

export function AdminUsersPage() {
  const q = useAdminUsersList();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-2xl font-bold text-card-foreground">Users</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Registered profiles with roles from <code className="rounded bg-muted px-1 py-0.5 text-xs">user_roles</code>.
          Listing capped for performance; extend with search in a later phase.
        </p>
      </header>

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-border bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">User ID</th>
              <th className="px-4 py-3 font-medium">Roles</th>
              <th className="px-4 py-3 font-medium">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-card">
            {q.isLoading ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                    Loading users…
                  </span>
                </td>
              </tr>
            ) : q.isError ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-destructive">
                  Could not load users.
                </td>
              </tr>
            ) : !(q.data?.length) ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  No profiles found.
                </td>
              </tr>
            ) : (
              q.data.map((row) => (
                <tr key={row.user_id}>
                  <td className="px-4 py-3 font-medium text-card-foreground">{row.full_name || "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{row.email || "—"}</td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{row.user_id}</td>
                  <td className="px-4 py-3">
                    <RoleBadges roles={row.roles} />
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(row.created_at).toLocaleString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
