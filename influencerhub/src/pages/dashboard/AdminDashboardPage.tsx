import { BarChart3, CreditCard, LayoutDashboard, ShieldCheck, Users } from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";

import { cn } from "@/lib/utils";

const navClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card",
    isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground",
  );

export function AdminDashboardPage() {
  return (
    <div className="mx-auto grid min-h-[60vh] max-w-6xl gap-6 px-4 py-10 sm:px-6 lg:grid-cols-[240px_1fr] lg:px-8">
      <aside
        className="h-fit rounded-xl border border-border bg-card p-4 shadow-card lg:sticky lg:top-24"
        aria-label="Admin dashboard navigation"
      >
        <p className="font-display text-sm font-semibold text-navy">Admin</p>
        <p className="mt-2 text-xs text-muted-foreground">
          Operations console. All data access is gated by{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-[10px]">public.has_role(..., &apos;admin&apos;)</code> in
          RLS policies.
        </p>
        <nav className="mt-4 flex flex-col gap-1">
          <NavLink to="/dashboard/admin" end className={navClass}>
            <LayoutDashboard className="size-4 shrink-0 opacity-80" aria-hidden />
            Overview
          </NavLink>
          <NavLink to="/dashboard/admin/approvals" className={navClass}>
            <ShieldCheck className="size-4 shrink-0 opacity-80" aria-hidden />
            Approvals
          </NavLink>
          <NavLink to="/dashboard/admin/users" className={navClass}>
            <Users className="size-4 shrink-0 opacity-80" aria-hidden />
            Users
          </NavLink>
          <NavLink to="/dashboard/admin/payments" className={navClass}>
            <CreditCard className="size-4 shrink-0 opacity-80" aria-hidden />
            Payments
          </NavLink>
        </nav>
        <p className="mt-4 flex items-center gap-2 text-[10px] text-muted-foreground">
          <BarChart3 className="size-3.5 shrink-0 opacity-70" aria-hidden />
          KPIs use Recharts on the overview tab.
        </p>
      </aside>
      <div className="rounded-xl border border-border bg-card p-6 shadow-card">
        <Outlet />
      </div>
    </div>
  );
}
