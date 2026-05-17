import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { useAdminOverviewSeries } from "@/hooks/use-admin-dashboard";

const chartPrimary = "hsl(var(--primary) / 1)";
const chartAccent = "hsl(var(--accent) / 1)";
const chartGrid = "hsl(var(--border) / 1)";

function KpiCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-card">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-2 font-display text-2xl font-semibold text-card-foreground">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export function AdminOverviewPage() {
  const q = useAdminOverviewSeries();

  if (q.isLoading) {
    return (
      <div className="space-y-4">
        <h1 className="font-display text-2xl font-bold text-card-foreground">Overview</h1>
        <p className="text-sm text-muted-foreground">Loading platform metrics…</p>
      </div>
    );
  }

  if (q.isError || !q.data) {
    return (
      <div className="space-y-4">
        <h1 className="font-display text-2xl font-bold text-card-foreground">Overview</h1>
        <p className="text-sm text-destructive">Could not load admin metrics. Check your connection and try again.</p>
      </div>
    );
  }

  const { kpis, signupsSeries, paymentsSeries } = q.data;

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-2xl font-bold text-card-foreground">Overview</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          High-level KPIs and the last 30 days of signups and completed payment volume. Figures respect RLS — only
          admins can aggregate across accounts.
        </p>
      </header>

      <section aria-label="Key performance indicators">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <KpiCard label="Total users" value={kpis.totalUsers} hint="Profiles table" />
          <KpiCard label="Pending approvals" value={kpis.pendingApprovals} hint="Creator profiles" />
          <KpiCard label="Approved creators" value={kpis.approvedInfluencers} hint="Directory-ready" />
          <KpiCard label="Campaigns" value={kpis.campaigns} hint="All statuses" />
          <KpiCard
            label="Completed payments"
            value={kpis.completedPaymentVolume.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            hint="Sum ETB (completed)"
          />
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2" aria-label="Trend charts">
        <div className="rounded-xl border border-border bg-card p-4 shadow-card">
          <h2 className="font-display text-sm font-semibold text-secondary-foreground">New signups (30d)</h2>
          <p className="mt-1 text-xs text-muted-foreground">Count of profiles created per day</p>
          <div className="mt-4 h-64 w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={signupsSeries} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="fillSignups" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={chartPrimary} stopOpacity={0.35} />
                    <stop offset="100%" stopColor={chartPrimary} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={chartGrid} strokeDasharray="4 4" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                  tickLine={false}
                  axisLine={{ stroke: chartGrid }}
                />
                <YAxis
                  width={36}
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                  tickLine={false}
                  axisLine={{ stroke: chartGrid }}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "var(--radius)",
                    color: "hsl(var(--card-foreground))",
                  }}
                  labelStyle={{ color: "hsl(var(--muted-foreground))" }}
                />
                <Area
                  type="monotone"
                  dataKey="signups"
                  stroke={chartPrimary}
                  fill="url(#fillSignups)"
                  strokeWidth={2}
                  name="Signups"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 shadow-card">
          <h2 className="font-display text-sm font-semibold text-secondary-foreground">Payment volume (30d)</h2>
          <p className="mt-1 text-xs text-muted-foreground">Completed payments only</p>
          <div className="mt-4 h-64 w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={paymentsSeries} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="fillPay" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={chartAccent} stopOpacity={0.35} />
                    <stop offset="100%" stopColor={chartAccent} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke={chartGrid} strokeDasharray="4 4" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                  tickLine={false}
                  axisLine={{ stroke: chartGrid }}
                />
                <YAxis
                  width={44}
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                  tickLine={false}
                  axisLine={{ stroke: chartGrid }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "var(--radius)",
                    color: "hsl(var(--card-foreground))",
                  }}
                  labelStyle={{ color: "hsl(var(--muted-foreground))" }}
                  formatter={(value: number) => [`${value.toLocaleString()} ETB`, "Volume"]}
                />
                <Area
                  type="monotone"
                  dataKey="volume"
                  stroke={chartAccent}
                  fill="url(#fillPay)"
                  strokeWidth={2}
                  name="Volume"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>
    </div>
  );
}
