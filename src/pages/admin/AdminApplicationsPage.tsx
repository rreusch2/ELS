import { Link, useSearchParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import clsx from "clsx";
import { supabase } from "@/lib/supabase";
import { applicationStatusLabels, formatCurrency, formatDate, formatDateTime } from "@/lib/format";
import type { Application, ApplicationStatus } from "@/lib/types";
import { PageLoader } from "@/components/ui";
import { AdminPageHeader } from "./AdminLayout";
import { ApplicationStatusBadge } from "./badges";

const FILTERS: { value: string; label: string }[] = [
  { value: "active", label: "Needs attention" },
  { value: "all", label: "All paid" },
  { value: "approved", label: "Approved" },
  { value: "denied", label: "Denied" },
  { value: "pending_payment", label: "Unpaid" },
];

export function AdminApplicationsPage() {
  const [params, setParams] = useSearchParams();
  const filter = params.get("filter") ?? "active";

  const { data: apps, isLoading } = useQuery({
    queryKey: ["admin", "applications", filter],
    queryFn: async () => {
      let query = supabase
        .from("applications")
        .select("*, listing:listings(id, title, slug, address_line1)")
        .order("created_at", { ascending: false });

      if (filter === "active") query = query.in("status", ["submitted", "under_review"] satisfies ApplicationStatus[]);
      else if (filter === "all") query = query.neq("status", "pending_payment");
      else query = query.eq("status", filter);

      const { data, error } = await query;
      if (error) throw error;
      return data as Application[];
    },
  });

  return (
    <>
      <AdminPageHeader title="Applications" subtitle="Review rental applications and make decisions." />

      <div className="mb-6 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setParams(f.value === "active" ? {} : { filter: f.value })}
            className={clsx(
              "rounded-full px-4 py-1.5 text-sm font-medium transition",
              filter === f.value ? "bg-navy-900 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200 hover:text-navy-900",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filter === "pending_payment" && (
        <p className="mb-4 text-sm text-slate-500">
          These applicants started an application but didn't finish paying. They are not ready for review.
        </p>
      )}

      {isLoading ? (
        <PageLoader />
      ) : !apps?.length ? (
        <div className="card p-12 text-center text-slate-500">No applications in this view.</div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50 text-xs tracking-wide text-slate-500 uppercase">
              <tr>
                <th className="px-5 py-3 font-medium">Applicant</th>
                <th className="px-5 py-3 font-medium">Property</th>
                <th className="px-5 py-3 font-medium">Adults</th>
                <th className="px-5 py-3 font-medium">Move-in</th>
                <th className="px-5 py-3 font-medium">Fee</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Submitted</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {apps.map((a) => (
                <tr key={a.id} className="hover:bg-slate-50">
                  <td className="px-5 py-3">
                    <Link to={`/admin/applications/${a.id}`} className="font-medium text-navy-900 hover:text-gold-700">
                      {a.first_name} {a.last_name}
                    </Link>
                    <p className="text-xs text-slate-500">{a.email}</p>
                  </td>
                  <td className="px-5 py-3 text-slate-600">{a.listing?.title ?? "—"}</td>
                  <td className="px-5 py-3">{a.adult_count}</td>
                  <td className="px-5 py-3 text-slate-600">{formatDate(a.desired_move_in)}</td>
                  <td className="px-5 py-3">{formatCurrency(a.fee_total_cents, { cents: true })}</td>
                  <td className="px-5 py-3"><ApplicationStatusBadge status={a.status} label={applicationStatusLabels[a.status]} /></td>
                  <td className="px-5 py-3 text-slate-500">{formatDateTime(a.paid_at ?? a.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
