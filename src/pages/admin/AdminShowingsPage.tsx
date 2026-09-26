import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { formatDate, formatDateTime, showingStatusLabels } from "@/lib/format";
import type { ShowingRequest, ShowingStatus } from "@/lib/types";
import { PageLoader } from "@/components/ui";
import { AdminPageHeader } from "./AdminLayout";
import { ShowingStatusBadge } from "./badges";

export function AdminShowingsPage() {
  const queryClient = useQueryClient();
  const { data: showings, isLoading } = useQuery({
    queryKey: ["admin", "showings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("showing_requests")
        .select("*, listing:listings(title, slug)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as ShowingRequest[];
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: ShowingStatus }) => {
      const { error } = await supabase.from("showing_requests").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin"] }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("showing_requests").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin"] }),
  });

  return (
    <>
      <AdminPageHeader title="Showing requests" subtitle="Prospective renters who'd like to tour a property." />
      {isLoading ? (
        <PageLoader />
      ) : !showings?.length ? (
        <div className="card p-12 text-center text-slate-500">No showing requests yet.</div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {showings.map((s) => (
            <div key={s.id} className="card p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-navy-900">{s.name}</p>
                  <p className="text-sm text-slate-500">{s.listing?.title ?? "General request"}</p>
                </div>
                <ShowingStatusBadge status={s.status} />
              </div>
              <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div><dt className="text-xs text-slate-500">Email</dt><dd><a href={`mailto:${s.email}`} className="font-medium text-navy-700 hover:underline">{s.email}</a></dd></div>
                <div><dt className="text-xs text-slate-500">Phone</dt><dd>{s.phone ? <a href={`tel:${s.phone}`} className="font-medium text-navy-700 hover:underline">{s.phone}</a> : "—"}</dd></div>
                <div><dt className="text-xs text-slate-500">Preferred date</dt><dd className="font-medium">{formatDate(s.preferred_date)}</dd></div>
                <div><dt className="text-xs text-slate-500">Preferred time</dt><dd className="font-medium">{s.preferred_time ?? "—"}</dd></div>
              </dl>
              {s.message && <p className="mt-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-700">{s.message}</p>}
              <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
                <span className="text-xs text-slate-400">{formatDateTime(s.created_at)}</span>
                <div className="flex items-center gap-2">
                  <select
                    className="input w-auto py-1.5 text-xs"
                    value={s.status}
                    onChange={(e) => updateStatus.mutate({ id: s.id, status: e.target.value as ShowingStatus })}
                  >
                    {(Object.keys(showingStatusLabels) as ShowingStatus[]).map((k) => <option key={k} value={k}>{showingStatusLabels[k]}</option>)}
                  </select>
                  <button
                    type="button"
                    className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
                    onClick={() => confirm("Delete this showing request?") && remove.mutate(s.id)}
                    aria-label="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
