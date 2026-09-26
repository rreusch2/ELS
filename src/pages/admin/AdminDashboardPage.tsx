import { Link } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { Building2, CalendarDays, ClipboardList, DollarSign } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { applicationStatusLabels, formatCurrency, formatDateTime } from "@/lib/format";
import type { Application } from "@/lib/types";
import { PageLoader } from "@/components/ui";
import { AdminPageHeader } from "./AdminLayout";
import { ApplicationStatusBadge } from "./badges";

export function AdminDashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "dashboard"],
    queryFn: async () => {
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);

      const [listings, newApps, showings, paidThisMonth, recent] = await Promise.all([
        supabase.from("listings").select("id", { count: "exact", head: true }).eq("status", "available"),
        supabase.from("applications").select("id", { count: "exact", head: true }).eq("status", "submitted"),
        supabase.from("showing_requests").select("id", { count: "exact", head: true }).eq("status", "new"),
        supabase.from("applications").select("fee_total_cents").not("paid_at", "is", null).gte("paid_at", monthStart.toISOString()),
        supabase
          .from("applications")
          .select("*, listing:listings(id, title, slug, address_line1)")
          .neq("status", "pending_payment")
          .order("created_at", { ascending: false })
          .limit(6),
      ]);

      return {
        availableListings: listings.count ?? 0,
        newApplications: newApps.count ?? 0,
        newShowings: showings.count ?? 0,
        feesThisMonth: (paidThisMonth.data ?? []).reduce((sum, a) => sum + a.fee_total_cents, 0),
        recent: (recent.data ?? []) as Application[],
      };
    },
  });

  if (isLoading || !data) return <PageLoader />;

  const stats = [
    { label: "Available listings", value: data.availableListings, icon: Building2, to: "/admin/listings" },
    { label: "Applications to review", value: data.newApplications, icon: ClipboardList, to: "/admin/applications" },
    { label: "New showing requests", value: data.newShowings, icon: CalendarDays, to: "/admin/showings" },
    { label: "Fees collected this month", value: formatCurrency(data.feesThisMonth), icon: DollarSign, to: "/admin/applications" },
  ];

  return (
    <>
      <AdminPageHeader title="Dashboard" subtitle="Here's what's happening at ELS Properties." />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(({ label, value, icon: Icon, to }) => (
          <Link key={label} to={to} className="card flex items-center gap-4 p-5 transition hover:shadow-md">
            <span className="grid h-12 w-12 place-items-center rounded-xl bg-navy-900 text-gold-300"><Icon className="h-6 w-6" /></span>
            <div>
              <p className="text-2xl font-semibold text-navy-900">{value}</p>
              <p className="text-sm text-slate-500">{label}</p>
            </div>
          </Link>
        ))}
      </div>

      <div className="card mt-8 overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 className="font-semibold">Recent applications</h2>
          <Link to="/admin/applications" className="text-sm font-medium text-navy-600 hover:text-navy-900">View all</Link>
        </div>
        {data.recent.length === 0 ? (
          <p className="px-6 py-10 text-center text-sm text-slate-500">No applications yet.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {data.recent.map((a) => (
              <li key={a.id}>
                <Link to={`/admin/applications/${a.id}`} className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 hover:bg-slate-50">
                  <div>
                    <p className="font-medium text-navy-900">{a.first_name} {a.last_name}</p>
                    <p className="text-sm text-slate-500">{a.listing?.title ?? "Listing removed"} · {formatDateTime(a.created_at)}</p>
                  </div>
                  <ApplicationStatusBadge status={a.status} label={applicationStatusLabels[a.status]} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
