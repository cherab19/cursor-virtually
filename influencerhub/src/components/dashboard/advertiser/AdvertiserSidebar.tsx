import {
  BarChart3,
  CreditCard,
  LayoutDashboard,
  Megaphone,
  MessageSquare,
  Search,
  Users,
} from "lucide-react";
import { NavLink } from "react-router-dom";

import { MessagesUnreadBadge } from "@/components/messaging/MessagesUnreadBadge";
import { cn } from "@/lib/utils";

const navClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card",
    isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground",
  );

export function AdvertiserSidebar() {
  return (
    <aside
      className="h-fit rounded-xl border border-border bg-card p-4 shadow-card lg:sticky lg:top-24"
      aria-label="Advertiser dashboard navigation"
    >
      <p className="font-display text-sm font-semibold text-navy">Brand workspace</p>
      <p className="mt-1 text-xs text-muted-foreground">Run briefs, review talent, track spend.</p>
      <nav className="mt-4 flex flex-col gap-1">
        <NavLink to="/dashboard/advertiser" end className={navClass}>
          <LayoutDashboard className="size-4 shrink-0 opacity-80" aria-hidden />
          Overview
        </NavLink>
        <NavLink to="/dashboard/advertiser/discover" className={navClass}>
          <Search className="size-4 shrink-0 opacity-80" aria-hidden />
          Discover
        </NavLink>
        <NavLink to="/dashboard/advertiser/campaigns" className={navClass}>
          <Megaphone className="size-4 shrink-0 opacity-80" aria-hidden />
          Campaigns
        </NavLink>
        <NavLink to="/dashboard/advertiser/applications" className={navClass}>
          <Users className="size-4 shrink-0 opacity-80" aria-hidden />
          Applications
        </NavLink>
        <NavLink to="/dashboard/advertiser/messages" className={navClass}>
          <MessageSquare className="size-4 shrink-0 opacity-80" aria-hidden />
          <span className="flex-1 text-left">Messages</span>
          <MessagesUnreadBadge />
        </NavLink>
        <NavLink to="/dashboard/advertiser/billing" className={navClass}>
          <CreditCard className="size-4 shrink-0 opacity-80" aria-hidden />
          Billing
        </NavLink>
        <NavLink to="/dashboard/advertiser/analytics" className={navClass}>
          <BarChart3 className="size-4 shrink-0 opacity-80" aria-hidden />
          Analytics
        </NavLink>
      </nav>
    </aside>
  );
}
