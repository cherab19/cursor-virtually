import { Link, NavLink, Outlet } from "react-router-dom";

import { ConfigBanner } from "@/components/layout/ConfigBanner";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { dashboardPathForRoles } from "@/lib/auth-redirect";
import { cn } from "@/lib/utils";

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    "rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
    isActive ? "bg-muted text-foreground" : "text-muted-foreground",
  );

export function AppShell() {
  const { session, roles, loading, signOut } = useAuth();
  const dash = dashboardPathForRoles(roles);

  return (
    <div className="flex min-h-dvh flex-col">
      <ConfigBanner />
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-card focus:px-4 focus:py-2 focus:text-card-foreground focus:shadow-card"
      >
        Skip to content
      </a>
      <header className="sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link
            to="/"
            className="font-display text-lg font-semibold text-navy transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            InfluencerHub
          </Link>
          <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
            <NavLink to="/directory" className={navLinkClass}>
              Directory
            </NavLink>
            <NavLink to="/pricing" className={navLinkClass}>
              Pricing
            </NavLink>
            {!loading && session ? (
              <NavLink to={dash} className={navLinkClass}>
                Dashboard
              </NavLink>
            ) : (
              <NavLink to="/auth" className={navLinkClass}>
                Sign in
              </NavLink>
            )}
          </nav>
          <div className="flex items-center gap-2">
            {!loading && session ? (
              <>
                <Button type="button" variant="outline" size="sm" onClick={() => void signOut()}>
                  Sign out
                </Button>
                <Button asChild size="sm" className="hidden sm:inline-flex">
                  <Link to={dash}>Dashboard</Link>
                </Button>
              </>
            ) : (
              <>
                <Button asChild variant="outline" size="sm" className="hidden sm:inline-flex">
                  <Link to="/auth">Sign in</Link>
                </Button>
                <Button asChild size="sm" className="hidden sm:inline-flex">
                  <Link to="/auth">Get started</Link>
                </Button>
              </>
            )}
            <Button asChild variant="accent" size="sm" className="md:hidden">
              <Link to="/auth">Menu</Link>
            </Button>
          </div>
        </div>
      </header>
      <main id="main-content" className="flex-1">
        <Outlet />
      </main>
      <footer className="border-t border-border bg-card py-10">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p>Influencer marketplace for Ethiopian creators and brands.</p>
          <div className="flex flex-wrap gap-4">
            <Link to="/directory" className="hover:text-foreground">
              Directory
            </Link>
            <Link to="/pricing" className="hover:text-foreground">
              Pricing
            </Link>
            <Link to="/dashboard/admin" className="hover:text-foreground">
              Admin
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
