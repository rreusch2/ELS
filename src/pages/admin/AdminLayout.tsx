import type { ReactNode } from "react";
import { NavLink, Navigate, Outlet, useLocation } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { Building2, CalendarDays, ClipboardList, ExternalLink, Inbox, LayoutDashboard, LogOut, Settings } from "lucide-react";
import clsx from "clsx";
import { Logo } from "@/components/Logo";
import { PageLoader } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

function useBadgeCounts(enabled: boolean) {
  return useQuery({
    queryKey: ["admin", "badge-counts"],
    enabled,
    refetchInterval: 60_000,
    queryFn: async () => {
      const [apps, showings, messages] = await Promise.all([
        supabase.from("applications").select("id", { count: "exact", head: true }).eq("status", "submitted"),
        supabase.from("showing_requests").select("id", { count: "exact", head: true }).eq("status", "new"),
        supabase.from("contact_messages").select("id", { count: "exact", head: true }).eq("is_read", false),
      ]);
      return { applications: apps.count ?? 0, showings: showings.count ?? 0, messages: messages.count ?? 0 };
    },
  });
}

export function AdminLayout() {
  const { session, isAdmin, loading, signOut } = useAuth();
  const location = useLocation();
  const { data: counts } = useBadgeCounts(isAdmin);

  if (loading) return <PageLoader />;
  if (!session) return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  if (!isAdmin) {
    return (
      <div className="grid min-h-screen place-items-center bg-slate-50 p-6 text-center">
        <div className="card max-w-md p-8">
          <h1 className="font-serif text-2xl font-semibold">Access restricted</h1>
          <p className="mt-2 text-slate-600">
            You're signed in as {session.user.email}, but this account doesn't have staff access.
          </p>
          <button type="button" onClick={signOut} className="btn-primary mt-6">Sign out</button>
        </div>
      </div>
    );
  }

  const nav = [
    { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
    { to: "/admin/listings", label: "Listings", icon: Building2 },
    { to: "/admin/applications", label: "Applications", icon: ClipboardList, badge: counts?.applications },
    { to: "/admin/showings", label: "Showings", icon: CalendarDays, badge: counts?.showings },
    { to: "/admin/messages", label: "Messages", icon: Inbox, badge: counts?.messages },
    { to: "/admin/settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-50 lg:grid lg:grid-cols-[260px_1fr]">
      <aside className="flex flex-col bg-navy-950 text-navy-100 lg:sticky lg:top-0 lg:h-screen">
        <div className="flex items-center justify-between p-5">
          <Logo variant="light" />
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-1 lg:flex-col lg:overflow-visible">
          {nav.map(({ to, label, icon: Icon, end, badge }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                clsx(
                  "flex shrink-0 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition",
                  isActive ? "bg-white/10 text-white" : "text-navy-200 hover:bg-white/5 hover:text-white",
                )
              }
            >
              <Icon className="h-5 w-5" />
              {label}
              {!!badge && (
                <span className="ml-auto rounded-full bg-gold-400 px-2 py-0.5 text-xs font-bold text-navy-950">{badge}</span>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="hidden border-t border-white/10 p-4 lg:block">
          <a href="/" target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-navy-200 hover:bg-white/5 hover:text-white">
            <ExternalLink className="h-4 w-4" /> View website
          </a>
          <p className="mt-2 truncate px-3 text-xs text-navy-400">{session.user.email}</p>
          <button type="button" onClick={signOut} className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-navy-200 hover:bg-white/5 hover:text-white">
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      </aside>
      <main className="min-w-0 p-4 sm:p-8">
        <Outlet />
      </main>
    </div>
  );
}

export function AdminPageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-serif text-3xl font-semibold">{title}</h1>
        {subtitle && <p className="mt-1 text-slate-600">{subtitle}</p>}
      </div>
      {actions}
    </div>
  );
}
