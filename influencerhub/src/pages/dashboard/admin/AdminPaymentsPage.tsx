import { Loader2 } from "lucide-react";

import { useAdminPaymentsLog } from "@/hooks/use-admin-dashboard";
import { cn } from "@/lib/utils";

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
        status === "completed"
          ? "bg-primary/15 text-primary"
          : status === "pending"
            ? "bg-accent/15 text-accent-foreground"
            : status === "failed"
              ? "bg-destructive/15 text-destructive"
              : status === "refunded"
                ? "bg-muted text-muted-foreground"
                : "bg-secondary text-secondary-foreground",
      )}
    >
      {status}
    </span>
  );
}

export function AdminPaymentsPage() {
  const q = useAdminPaymentsLog();

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-2xl font-bold text-card-foreground">Payment logs</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Recent payment rows (newest first). Admins can read all payments under RLS; ordinary users only see their
          own.
        </p>
      </header>

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[800px] text-left text-sm">
          <thead className="border-b border-border bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">When</th>
              <th className="px-4 py-3 font-medium">User</th>
              <th className="px-4 py-3 font-medium">Amount</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Method</th>
              <th className="px-4 py-3 font-medium">Reference</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-card">
            {q.isLoading ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                    Loading payments…
                  </span>
                </td>
              </tr>
            ) : q.isError ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-destructive">
                  Could not load payments.
                </td>
              </tr>
            ) : !(q.data?.length) ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  No payments recorded yet.
                </td>
              </tr>
            ) : (
              q.data.map((row) => (
                <tr key={row.id}>
                  <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                    {new Date(row.created_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{row.user_id}</td>
                  <td className="px-4 py-3 text-card-foreground">
                    {Number(row.amount).toLocaleString(undefined, { maximumFractionDigits: 2 })} {row.currency}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={row.status} />
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{row.payment_method}</td>
                  <td className="max-w-[200px] truncate px-4 py-3 font-mono text-xs text-muted-foreground">
                    {row.transaction_ref || "—"}
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
