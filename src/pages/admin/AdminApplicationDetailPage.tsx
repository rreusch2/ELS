import { useEffect, useState, type ReactNode } from "react";
import { Link, useParams } from "react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Download, FileText, Mail, Phone } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { applicationStatusLabels, formatCurrency, formatDate, formatDateTime } from "@/lib/format";
import type { Application, ApplicationStatus } from "@/lib/types";
import { Alert, PageLoader, Spinner } from "@/components/ui";
import { ApplicationStatusBadge } from "./badges";

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="card p-6">
      <h2 className="mb-4 font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function Rows({ rows }: { rows: [string, ReactNode][] }) {
  return (
    <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
      {rows.map(([k, v]) => (
        <div key={k}>
          <dt className="text-xs text-slate-500">{k}</dt>
          <dd className="mt-0.5 font-medium break-words text-navy-900">{v || "—"}</dd>
        </div>
      ))}
    </dl>
  );
}

export function AdminApplicationDetailPage() {
  const { id } = useParams();
  const queryClient = useQueryClient();

  const { data: app, isLoading } = useQuery({
    queryKey: ["admin", "application", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("applications")
        .select("*, listing:listings(id, title, slug, address_line1)")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data as Application;
    },
  });

  const [status, setStatus] = useState<ApplicationStatus>("submitted");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (app) {
      setStatus(app.status);
      setNotes(app.admin_notes ?? "");
    }
  }, [app]);

  async function save() {
    setSaving(true);
    setMessage(null);
    const { error } = await supabase.from("applications").update({ status, admin_notes: notes || null }).eq("id", id!);
    setSaving(false);
    setMessage(error ? { tone: "error", text: error.message } : { tone: "success", text: "Saved." });
    queryClient.invalidateQueries({ queryKey: ["admin"] });
  }

  async function openDocument(path: string) {
    const { data, error } = await supabase.storage.from("application-documents").createSignedUrl(path, 300);
    if (error) alert(error.message);
    else window.open(data.signedUrl, "_blank", "noopener");
  }

  if (isLoading || !app) return <PageLoader />;

  const d = app.data;
  const income = Number(String(d.employment?.monthly_income ?? "").replace(/[^0-9.]/g, ""));

  return (
    <>
      <Link to="/admin/applications" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-navy-900">
        <ArrowLeft className="h-4 w-4" /> All applications
      </Link>

      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-serif text-3xl font-semibold">{app.first_name} {app.last_name}</h1>
            <ApplicationStatusBadge status={app.status} label={applicationStatusLabels[app.status]} />
          </div>
          <p className="mt-1 text-slate-600">
            Applied for{" "}
            {app.listing ? <Link to={`/listings/${app.listing.slug}`} target="_blank" className="font-medium text-navy-700 hover:underline">{app.listing.title}</Link> : "a removed listing"}
            {" "}· {formatDateTime(app.created_at)}
          </p>
        </div>
        <div className="flex gap-2">
          <a href={`mailto:${app.email}`} className="btn-outline"><Mail className="h-4 w-4" /> Email</a>
          <a href={`tel:${app.phone}`} className="btn-outline"><Phone className="h-4 w-4" /> Call</a>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <Section title="Primary applicant">
            <Rows rows={[
              ["Name", `${app.first_name} ${app.last_name}`],
              ["Email", app.email],
              ["Phone", app.phone],
              ["Date of birth", formatDate(d.date_of_birth)],
              ["Desired move-in", formatDate(app.desired_move_in)],
              ["Adults / minors", `${app.adult_count} adults · ${d.minors_count ?? 0} minors`],
            ]} />
          </Section>

          <Section title="Residence history">
            <h3 className="mb-3 text-xs font-semibold tracking-wide text-slate-500 uppercase">Current</h3>
            <Rows rows={[
              ["Address", `${d.current_address.street}, ${d.current_address.city}, ${d.current_address.state} ${d.current_address.zip}`],
              ["Moved in", d.current_address.move_in_date],
              ["Monthly rent", d.current_address.monthly_rent],
              ["Landlord", d.current_address.landlord_name],
              ["Landlord phone", d.current_address.landlord_phone],
              ["Reason for moving", d.current_address.reason_for_leaving],
            ]} />
            {d.previous_address?.street && (
              <>
                <h3 className="mt-6 mb-3 text-xs font-semibold tracking-wide text-slate-500 uppercase">Previous</h3>
                <Rows rows={[
                  ["Address", `${d.previous_address.street}, ${d.previous_address.city}, ${d.previous_address.state} ${d.previous_address.zip}`],
                  ["Landlord", d.previous_address.landlord_name],
                  ["Landlord phone", d.previous_address.landlord_phone],
                ]} />
              </>
            )}
          </Section>

          <Section title="Employment & income">
            <Rows rows={[
              ["Status", d.employment.status],
              ["Employer", d.employment.employer],
              ["Position", d.employment.position],
              ["Start date", d.employment.start_date],
              ["Supervisor", d.employment.supervisor_name],
              ["Supervisor phone", d.employment.supervisor_phone],
              ["Gross monthly income", d.employment.monthly_income],
              ["Other income", d.employment.other_income],
            ]} />
          </Section>

          {d.co_applicants?.length > 0 && (
            <Section title="Other adult applicants">
              <div className="space-y-5">
                {d.co_applicants.map((c, i) => (
                  <Rows key={i} rows={[
                    ["Name", `${c.first_name} ${c.last_name}`],
                    ["Relationship", c.relationship],
                    ["Email", c.email],
                    ["Phone", c.phone],
                    ["Date of birth", formatDate(c.date_of_birth)],
                  ]} />
                ))}
              </div>
            </Section>
          )}

          <Section title="Household, pets & vehicles">
            <Rows rows={[
              ["Pets", d.pets?.length ? d.pets.map((p) => `${p.type}${p.breed ? ` (${p.breed})` : ""}${p.weight_lbs ? `, ${p.weight_lbs} lbs` : ""}`).join("; ") : "None"],
              ["Vehicles", d.vehicles?.length ? d.vehicles.map((v) => `${v.year} ${v.make_model}${v.plate ? ` · ${v.plate}` : ""}`).join("; ") : "None"],
            ]} />
          </Section>

          <Section title="References & history">
            <Rows rows={[
              ...(d.references ?? []).filter((r) => r.name).map((r, i) => [`Reference ${i + 1}`, `${r.name}${r.relationship ? ` (${r.relationship})` : ""} · ${r.phone}`] as [string, string]),
              ["Ever evicted?", d.history.evicted],
              ["Ever broken a lease?", d.history.broken_lease],
              ...(d.history.explanation ? [["Explanation", d.history.explanation] as [string, string]] : []),
              ...(d.additional_notes ? [["Additional notes", d.additional_notes] as [string, string]] : []),
            ]} />
          </Section>
        </div>

        <div className="space-y-6 xl:sticky xl:top-8 xl:self-start">
          <section className="card space-y-4 p-6">
            <h2 className="font-semibold">Decision</h2>
            <select className="input" value={status} onChange={(e) => setStatus(e.target.value as ApplicationStatus)}>
              {(Object.keys(applicationStatusLabels) as ApplicationStatus[]).map((s) => (
                <option key={s} value={s}>{applicationStatusLabels[s]}</option>
              ))}
            </select>
            <textarea className="input" rows={5} placeholder="Internal notes (not visible to applicant)" value={notes} onChange={(e) => setNotes(e.target.value)} />
            {message && <Alert tone={message.tone}>{message.text}</Alert>}
            <button type="button" onClick={save} className="btn-primary w-full" disabled={saving}>
              {saving && <Spinner className="h-4 w-4" />} Save
            </button>
          </section>

          <section className="card p-6">
            <h2 className="mb-4 font-semibold">Quick facts</h2>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-slate-500">Fee paid</dt><dd className="font-medium">{app.paid_at ? formatCurrency(app.fee_total_cents, { cents: true }) : "Unpaid"}</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Paid at</dt><dd className="font-medium">{formatDateTime(app.paid_at)}</dd></div>
              {income > 0 && (
                <div className="flex justify-between"><dt className="text-slate-500">Primary income</dt><dd className="font-medium">${income.toLocaleString()}/mo</dd></div>
              )}
            </dl>
          </section>

          <section className="card p-6">
            <h2 className="mb-4 font-semibold">Documents</h2>
            {app.document_paths.length === 0 ? (
              <p className="text-sm text-slate-500">No documents uploaded.</p>
            ) : (
              <ul className="space-y-2">
                {app.document_paths.map((p) => (
                  <li key={p}>
                    <button type="button" onClick={() => openDocument(p)} className="flex w-full items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-left text-sm hover:bg-slate-50">
                      <FileText className="h-4 w-4 shrink-0 text-navy-400" />
                      <span className="flex-1 truncate">{p.split("/").pop()}</span>
                      <Download className="h-4 w-4 text-slate-400" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </>
  );
}
