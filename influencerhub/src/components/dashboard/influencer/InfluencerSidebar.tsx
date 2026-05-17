import {
  BarChart3,
  CreditCard,
  LayoutDashboard,
  Megaphone,
  MessageSquare,
  UserCircle,
} from "lucide-react";
import { NavLink } from "react-router-dom";

import { MessagesUnreadBadge } from "@/components/messaging/MessagesUnreadBadge";
import { cn } from "@/lib/utils";

const navClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card",
    isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground",
  );

export function InfluencerSidebar() {
  return (
    <aside
      className="h-fit rounded-xl border border-border bg-card p-4 shadow-card lg:sticky lg:top-24"
      aria-label="Influencer dashboard navigation"
    >
      <p className="font-display text-sm font-semibold text-navy">Creator studio</p>
      <p className="mt-1 text-xs text-muted-foreground">
        Manage visibility, campaigns, and subscription.
      </p>
      <nav className="mt-4 flex flex-col gap-1">
        <NavLink to="/dashboard/influencer" end className={navClass}>
          <LayoutDashboard className="size-4 shrink-0 opacity-80" aria-hidden />
          Overview
        </NavLink>
        <NavLink to="/dashboard/influencer/profile" className={navClass}>
          <UserCircle className="size-4 shrink-0 opacity-80" aria-hidden />
          Profile
        </NavLink>
        <NavLink to="/dashboard/influencer/campaigns" className={navClass}>
          <Megaphone className="size-4 shrink-0 opacity-80" aria-hidden />
          Campaigns
        </NavLink>
        <NavLink to="/dashboard/influencer/messages" className={navClass}>
          <MessageSquare className="size-4 shrink-0 opacity-80" aria-hidden />
          <span className="flex-1 text-left">Messages</span>
          <MessagesUnreadBadge />
        </NavLink>
        <NavLink to="/dashboard/influencer/subscription" className={navClass}>
          <CreditCard className="size-4 shrink-0 opacity-80" aria-hidden />
          Subscription
        </NavLink>
        <NavLink to="/dashboard/influencer/analytics" className={navClass}>
          <BarChart3 className="size-4 shrink-0 opacity-80" aria-hidden />
          Analytics
        </NavLink>
      </nav>
    </aside>
  );
}
