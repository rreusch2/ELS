import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link, useParams } from "react-router";
import { FunctionsHttpError } from "@supabase/supabase-js";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  FileText,
  Lock,
  Plus,
  ShieldCheck,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import clsx from "clsx";
import { Alert, Field, PageLoader, Spinner } from "@/components/ui";
import { useListing, useSiteSettings } from "@/lib/queries";
import { supabase } from "@/lib/supabase";
import { formatCurrency, formatDate } from "@/lib/format";
import type { Listing } from "@/lib/types";
import { NotFoundPage } from "../NotFoundPage";
import {
  STEPS,
  emptyCoApplicant,
  initialFormState,
  validateStep,
  type ApplicationFormState,
} from "./applicationForm";

const MAX_FILES = 5;
const MAX_FILE_BYTES = 10 * 1024 * 1024;
const ACCEPTED = "image/jpeg,image/png,image/webp,image/heic,application/pdf";

function storageKey(slug: string) {
  return `els-application:${slug}`;
}

export function ApplyPage() {
  const { slug } = useParams();
  const { data: listing, isLoading } = useListing(slug);
  const { data: settings } = useSiteSettings();

  if (isLoading || !settings) return <PageLoader />;
  if (!listing || !["available", "pending"].includes(listing.status)) {
    return <NotFoundPage message="This property isn't currently accepting applications." />;
  }
  return <ApplicationWizard listing={listing} feeCents={settings.application_fee_cents} />;
}

function ApplicationWizard({ listing, feeCents }: { listing: Listing; feeCents: number }) {
  const [form, setForm] = useState<ApplicationFormState>(() => {
    try {
      const saved = sessionStorage.getItem(storageKey(listing.slug));
      if (saved) return { ...initialFormState(), ...JSON.parse(saved), consents: initialFormState().consents };
    } catch {
      /* ignore corrupt saved state */
    }
    return initialFormState();
  });
  const [step, setStep] = useState(0);
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const topRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const { consents: _consents, ...rest } = form;
    sessionStorage.setItem(storageKey(listing.slug), JSON.stringify(rest));
  }, [form, listing.slug]);

  // Keep the co-applicant list in sync with the number of adults.
  useEffect(() => {
    setForm((f) => {
      const needed = Math.max(0, f.adult_count - 1);
      const current = f.data.co_applicants;
      if (current.length === needed) return f;
      const next = current.length > needed
        ? current.slice(0, needed)
        : [...current, ...Array.from({ length: needed - current.length }, emptyCoApplicant)];
      return { ...f, data: { ...f.data, co_applicants: next } };
    });
  }, [form.adult_count]);

  const update = (patch: Partial<ApplicationFormState>) => setForm((f) => ({ ...f, ...patch }));
  const updateData = <K extends keyof ApplicationFormState["data"]>(key: K, value: ApplicationFormState["data"][K]) =>
    setForm((f) => ({ ...f, data: { ...f.data, [key]: value } }));

  function scrollTop() {
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function next() {
    const message = validateStep(step, form);
    setError(message);
    if (message) return;
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
    scrollTop();
  }

  function back() {
    setError(null);
    setStep((s) => Math.max(s - 1, 0));
    scrollTop();
  }

  async function submit() {
    for (let i = 0; i < STEPS.length; i++) {
      const message = validateStep(i, form);
      if (message) {
        setError(message);
        setStep(i);
        return;
      }
    }

    setSubmitting(true);
    setError(null);
    try {
      const uploadId = crypto.randomUUID();
      const documentPaths: string[] = [];
      for (const [i, file] of files.entries()) {
        const safeName = file.name.replace(/[^\w.\-]+/g, "_").slice(-120);
        const path = `${uploadId}/${i + 1}-${safeName}`;
        const { error: uploadError } = await supabase.storage
          .from("application-documents")
          .upload(path, file, { contentType: file.type, upsert: false });
        if (uploadError) throw new Error(`Couldn't upload ${file.name}. Please try a different file.`);
        documentPaths.push(path);
      }

      const { data, error: fnError } = await supabase.functions.invoke("submit-application", {
        body: {
          listing_id: listing.id,
          applicant: { first_name: form.first_name, last_name: form.last_name, email: form.email, phone: form.phone },
          desired_move_in: form.desired_move_in,
          adult_count: form.adult_count,
          data: form.data,
          document_paths: documentPaths,
        },
      });

      if (fnError) {
        if (fnError instanceof FunctionsHttpError) {
          const body = await fnError.context.json().catch(() => null);
          throw new Error(body?.error ?? "We couldn't submit your application.");
        }
        throw fnError;
      }

      sessionStorage.removeItem(storageKey(listing.slug));
      window.location.assign(data.checkout_url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setSubmitting(false);
    }
  }

  const total = feeCents * form.adult_count;

  return (
    <div className="bg-slate-50 pb-20">
      <div ref={topRef} className="scroll-mt-32" />
      <div className="border-b border-slate-200 bg-white">
        <div className="container-page py-8">
          <Link to={`/listings/${listing.slug}`} className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-navy-900">
            <ArrowLeft className="h-4 w-4" /> Back to listing
          </Link>
          <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center">
            {listing.listing_photos[0] && (
              <img src={listing.listing_photos[0].url} alt="" className="h-20 w-28 rounded-xl object-cover" />
            )}
            <div>
              <p className="eyebrow">Rental Application</p>
              <h1 className="mt-1 font-serif text-2xl font-semibold sm:text-3xl">{listing.title}</h1>
              <p className="text-sm text-slate-600">
                {listing.address_line1}, {listing.city} · {formatCurrency(listing.rent_cents)}/month
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container-page mt-8 grid gap-8 lg:grid-cols-[240px_1fr]">
        <ol className="flex gap-2 overflow-x-auto lg:flex-col lg:gap-1">
          {STEPS.map((s, i) => {
            const done = i < step;
            const active = i === step;
            return (
              <li key={s.key} className="shrink-0">
                <button
                  type="button"
                  disabled={i > step}
                  onClick={() => { setError(null); setStep(i); }}
                  className={clsx(
                    "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition",
                    active ? "bg-white shadow-sm ring-1 ring-slate-200" : "hover:bg-white/60 disabled:hover:bg-transparent",
                  )}
                >
                  <span
                    className={clsx(
                      "grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm font-semibold",
                      done ? "bg-emerald-600 text-white" : active ? "bg-navy-900 text-white" : "bg-slate-200 text-slate-500",
                    )}
                  >
                    {done ? <Check className="h-4 w-4" /> : i + 1}
                  </span>
                  <span className="hidden sm:block">
                    <span className={clsx("block text-sm font-semibold", active ? "text-navy-900" : "text-slate-600")}>{s.title}</span>
                    <span className="hidden text-xs text-slate-500 lg:block">{s.description}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ol>

        <div className="card p-6 sm:p-10">
          <h2 className="font-serif text-2xl font-semibold">{STEPS[step].title === "Review & Pay" ? "Review & submit" : STEPS[step].description}</h2>

          <div className="mt-8">
            {step === 0 && <ApplicantStep form={form} update={update} updateData={updateData} feeCents={feeCents} />}
            {step === 1 && <ResidenceStep form={form} updateData={updateData} />}
            {step === 2 && <IncomeStep form={form} updateData={updateData} />}
            {step === 3 && <HouseholdStep form={form} updateData={updateData} />}
            {step === 4 && <DocumentsStep form={form} updateData={updateData} files={files} setFiles={setFiles} setError={setError} />}
            {step === 5 && <ReviewStep form={form} update={update} listing={listing} feeCents={feeCents} files={files} goTo={setStep} />}
          </div>

          {error && <div className="mt-6"><Alert>{error}</Alert></div>}

          <div className="mt-10 flex items-center justify-between border-t border-slate-100 pt-6">
            <button type="button" onClick={back} className={clsx("btn-ghost", step === 0 && "invisible")} disabled={submitting}>
              <ArrowLeft className="h-4 w-4" /> Back
            </button>
            {step < STEPS.length - 1 ? (
              <button type="button" onClick={next} className="btn-primary px-6">
                Continue <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button type="button" onClick={submit} className="btn-gold px-6 py-3" disabled={submitting}>
                {submitting ? <Spinner className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                {submitting ? "Submitting…" : `Pay ${formatCurrency(total, { cents: true })} & Submit`}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

type UpdateData = <K extends keyof ApplicationFormState["data"]>(key: K, value: ApplicationFormState["data"][K]) => void;

function ApplicantStep({
  form,
  update,
  updateData,
  feeCents,
}: {
  form: ApplicationFormState;
  update: (p: Partial<ApplicationFormState>) => void;
  updateData: UpdateData;
  feeCents: number;
}) {
  const today = new Date().toISOString().slice(0, 10);
  return (
    <div className="space-y-8">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="First name" required><input className="input" value={form.first_name} onChange={(e) => update({ first_name: e.target.value })} autoComplete="given-name" /></Field>
        <Field label="Last name" required><input className="input" value={form.last_name} onChange={(e) => update({ last_name: e.target.value })} autoComplete="family-name" /></Field>
        <Field label="Email" required><input className="input" type="email" value={form.email} onChange={(e) => update({ email: e.target.value })} autoComplete="email" /></Field>
        <Field label="Phone" required><input className="input" type="tel" value={form.phone} onChange={(e) => update({ phone: e.target.value })} autoComplete="tel" /></Field>
        <Field label="Date of birth" required><input className="input" type="date" max={today} value={form.data.date_of_birth} onChange={(e) => updateData("date_of_birth", e.target.value)} /></Field>
        <Field label="Desired move-in date" required><input className="input" type="date" min={today} value={form.desired_move_in} onChange={(e) => update({ desired_move_in: e.target.value })} /></Field>
      </div>

      <div className="rounded-xl bg-navy-50 p-5">
        <Field label="How many adults (18+) will live in the home, including you?" required>
          <select className="input mt-1 max-w-xs" value={form.adult_count} onChange={(e) => update({ adult_count: Number(e.target.value) })}>
            {Array.from({ length: 6 }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{n} {n === 1 ? "adult" : "adults"}</option>)}
          </select>
        </Field>
        <p className="mt-3 text-sm text-navy-800">
          Each adult is screened individually, so the application fee is{" "}
          <strong>{formatCurrency(feeCents)} per adult</strong>. You'll enter the other adults' details in the Household step.
        </p>
      </div>
    </div>
  );
}

function ResidenceStep({ form, updateData }: { form: ApplicationFormState; updateData: UpdateData }) {
  const c = form.data.current_address;
  const p = form.data.previous_address;
  const setC = (patch: Partial<typeof c>) => updateData("current_address", { ...c, ...patch });
  const setP = (patch: Partial<typeof p>) => updateData("previous_address", { ...p, ...patch });

  return (
    <div className="space-y-10">
      <section>
        <h3 className="text-lg font-semibold">Current address</h3>
        <div className="mt-4 grid gap-5 sm:grid-cols-6">
          <Field label="Street address" required className="sm:col-span-6"><input className="input" value={c.street} onChange={(e) => setC({ street: e.target.value })} autoComplete="street-address" /></Field>
          <Field label="City" required className="sm:col-span-3"><input className="input" value={c.city} onChange={(e) => setC({ city: e.target.value })} /></Field>
          <Field label="State" required className="sm:col-span-1"><input className="input" maxLength={2} value={c.state} onChange={(e) => setC({ state: e.target.value.toUpperCase() })} /></Field>
          <Field label="ZIP" required className="sm:col-span-2"><input className="input" value={c.zip} onChange={(e) => setC({ zip: e.target.value })} /></Field>
          <Field label="Moved in" className="sm:col-span-3"><input className="input" type="month" value={c.move_in_date} onChange={(e) => setC({ move_in_date: e.target.value })} /></Field>
          <Field label="Monthly rent / mortgage" className="sm:col-span-3"><input className="input" inputMode="decimal" placeholder="$" value={c.monthly_rent} onChange={(e) => setC({ monthly_rent: e.target.value })} /></Field>
          <Field label="Landlord / property manager" className="sm:col-span-3"><input className="input" value={c.landlord_name} onChange={(e) => setC({ landlord_name: e.target.value })} /></Field>
          <Field label="Landlord phone" className="sm:col-span-3"><input className="input" type="tel" value={c.landlord_phone} onChange={(e) => setC({ landlord_phone: e.target.value })} /></Field>
          <Field label="Reason for moving" className="sm:col-span-6"><input className="input" value={c.reason_for_leaving} onChange={(e) => setC({ reason_for_leaving: e.target.value })} /></Field>
        </div>
      </section>

      <section>
        <h3 className="text-lg font-semibold">Previous address <span className="text-sm font-normal text-slate-500">(if less than 2 years at current)</span></h3>
        <div className="mt-4 grid gap-5 sm:grid-cols-6">
          <Field label="Street address" className="sm:col-span-6"><input className="input" value={p.street} onChange={(e) => setP({ street: e.target.value })} /></Field>
          <Field label="City" className="sm:col-span-3"><input className="input" value={p.city} onChange={(e) => setP({ city: e.target.value })} /></Field>
          <Field label="State" className="sm:col-span-1"><input className="input" maxLength={2} value={p.state} onChange={(e) => setP({ state: e.target.value.toUpperCase() })} /></Field>
          <Field label="ZIP" className="sm:col-span-2"><input className="input" value={p.zip} onChange={(e) => setP({ zip: e.target.value })} /></Field>
          <Field label="Landlord name" className="sm:col-span-3"><input className="input" value={p.landlord_name} onChange={(e) => setP({ landlord_name: e.target.value })} /></Field>
          <Field label="Landlord phone" className="sm:col-span-3"><input className="input" type="tel" value={p.landlord_phone} onChange={(e) => setP({ landlord_phone: e.target.value })} /></Field>
        </div>
      </section>
    </div>
  );
}

function IncomeStep({ form, updateData }: { form: ApplicationFormState; updateData: UpdateData }) {
  const e = form.data.employment;
  const set = (patch: Partial<typeof e>) => updateData("employment", { ...e, ...patch });
  const employed = e.status.startsWith("Employed") || e.status === "Self-employed";

  return (
    <div className="grid gap-5 sm:grid-cols-2">
      <Field label="Employment status" required className="sm:col-span-2">
        <select className="input" value={e.status} onChange={(ev) => set({ status: ev.target.value })}>
          {["Employed full-time", "Employed part-time", "Self-employed", "Retired", "Student", "Not currently employed"].map((s) => <option key={s}>{s}</option>)}
        </select>
      </Field>
      {employed && (
        <>
          <Field label="Employer" required><input className="input" value={e.employer} onChange={(ev) => set({ employer: ev.target.value })} /></Field>
          <Field label="Position / title"><input className="input" value={e.position} onChange={(ev) => set({ position: ev.target.value })} /></Field>
          <Field label="Supervisor name"><input className="input" value={e.supervisor_name} onChange={(ev) => set({ supervisor_name: ev.target.value })} /></Field>
          <Field label="Supervisor / HR phone"><input className="input" type="tel" value={e.supervisor_phone} onChange={(ev) => set({ supervisor_phone: ev.target.value })} /></Field>
          <Field label="Start date"><input className="input" type="month" value={e.start_date} onChange={(ev) => set({ start_date: ev.target.value })} /></Field>
        </>
      )}
      <Field label="Gross monthly income" required hint="Before taxes. Include all income sources for you only.">
        <input className="input" inputMode="decimal" placeholder="$" value={e.monthly_income} onChange={(ev) => set({ monthly_income: ev.target.value })} />
      </Field>
      <Field label="Other income" hint="e.g. Social Security, child support, retirement, housing assistance" className="sm:col-span-2">
        <input className="input" value={e.other_income} onChange={(ev) => set({ other_income: ev.target.value })} />
      </Field>
    </div>
  );
}

function HouseholdStep({ form, updateData }: { form: ApplicationFormState; updateData: UpdateData }) {
  const d = form.data;

  return (
    <div className="space-y-10">
      {d.co_applicants.length > 0 && (
        <section>
          <h3 className="text-lg font-semibold">Other adult applicants</h3>
          <p className="mt-1 text-sm text-slate-600">We'll contact each adult if additional information is needed.</p>
          <div className="mt-4 space-y-4">
            {d.co_applicants.map((co, i) => {
              const set = (patch: Partial<typeof co>) =>
                updateData("co_applicants", d.co_applicants.map((c, j) => (j === i ? { ...c, ...patch } : c)));
              return (
                <div key={i} className="rounded-xl border border-slate-200 p-5">
                  <p className="mb-4 text-sm font-semibold text-navy-900">Adult applicant #{i + 2}</p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="First name" required><input className="input" value={co.first_name} onChange={(e) => set({ first_name: e.target.value })} /></Field>
                    <Field label="Last name" required><input className="input" value={co.last_name} onChange={(e) => set({ last_name: e.target.value })} /></Field>
                    <Field label="Email" required><input className="input" type="email" value={co.email} onChange={(e) => set({ email: e.target.value })} /></Field>
                    <Field label="Phone"><input className="input" type="tel" value={co.phone} onChange={(e) => set({ phone: e.target.value })} /></Field>
                    <Field label="Date of birth"><input className="input" type="date" value={co.date_of_birth} onChange={(e) => set({ date_of_birth: e.target.value })} /></Field>
                    <Field label="Relationship to you"><input className="input" value={co.relationship} onChange={(e) => set({ relationship: e.target.value })} /></Field>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <section>
        <Field label="Number of occupants under 18">
          <select className="input max-w-xs" value={d.minors_count} onChange={(e) => updateData("minors_count", e.target.value)}>
            {Array.from({ length: 9 }, (_, i) => String(i)).map((n) => <option key={n}>{n}</option>)}
          </select>
        </Field>
      </section>

      <RepeatableSection
        title="Pets"
        subtitle="Assistance animals are not pets — you may list them in the notes section instead."
        items={d.pets}
        empty={{ type: "", breed: "", weight_lbs: "" }}
        onChange={(pets) => updateData("pets", pets)}
        addLabel="Add a pet"
        render={(pet, set) => (
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Type"><input className="input" placeholder="Dog, cat…" value={pet.type} onChange={(e) => set({ type: e.target.value })} /></Field>
            <Field label="Breed"><input className="input" value={pet.breed} onChange={(e) => set({ breed: e.target.value })} /></Field>
            <Field label="Weight (lbs)"><input className="input" inputMode="numeric" value={pet.weight_lbs} onChange={(e) => set({ weight_lbs: e.target.value })} /></Field>
          </div>
        )}
      />

      <RepeatableSection
        title="Vehicles"
        items={d.vehicles}
        empty={{ make_model: "", year: "", plate: "" }}
        onChange={(vehicles) => updateData("vehicles", vehicles)}
        addLabel="Add a vehicle"
        render={(v, set) => (
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Make & model"><input className="input" value={v.make_model} onChange={(e) => set({ make_model: e.target.value })} /></Field>
            <Field label="Year"><input className="input" inputMode="numeric" value={v.year} onChange={(e) => set({ year: e.target.value })} /></Field>
            <Field label="License plate"><input className="input" value={v.plate} onChange={(e) => set({ plate: e.target.value })} /></Field>
          </div>
        )}
      />
    </div>
  );
}

function RepeatableSection<T extends object>({
  title,
  subtitle,
  items,
  empty,
  onChange,
  addLabel,
  render,
}: {
  title: string;
  subtitle?: string;
  items: T[];
  empty: T;
  onChange: (items: T[]) => void;
  addLabel: string;
  render: (item: T, set: (patch: Partial<T>) => void) => ReactNode;
}) {
  return (
    <section>
      <h3 className="text-lg font-semibold">{title}</h3>
      {subtitle && <p className="mt-1 text-sm text-slate-600">{subtitle}</p>}
      <div className="mt-4 space-y-3">
        {items.map((item, i) => (
          <div key={i} className="relative rounded-xl border border-slate-200 p-5 pr-14">
            {render(item, (patch) => onChange(items.map((it, j) => (j === i ? { ...it, ...patch } : it))))}
            <button
              type="button"
              onClick={() => onChange(items.filter((_, j) => j !== i))}
              className="absolute top-4 right-4 rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600"
              aria-label="Remove"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
        {items.length < 5 && (
          <button type="button" onClick={() => onChange([...items, { ...empty }])} className="btn-outline">
            <Plus className="h-4 w-4" /> {addLabel}
          </button>
        )}
      </div>
    </section>
  );
}

function DocumentsStep({
  form,
  updateData,
  files,
  setFiles,
  setError,
}: {
  form: ApplicationFormState;
  updateData: UpdateData;
  files: File[];
  setFiles: (f: File[]) => void;
  setError: (e: string | null) => void;
}) {
  const d = form.data;
  const setRef = (i: number, patch: Partial<(typeof d.references)[number]>) =>
    updateData("references", d.references.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  const setHistory = (patch: Partial<typeof d.history>) => updateData("history", { ...d.history, ...patch });

  function addFiles(list: FileList | null) {
    if (!list) return;
    const incoming = Array.from(list);
    const tooBig = incoming.find((f) => f.size > MAX_FILE_BYTES);
    if (tooBig) {
      setError(`${tooBig.name} is larger than 10 MB.`);
      return;
    }
    const combined = [...files, ...incoming].slice(0, MAX_FILES);
    setFiles(combined);
    setError(null);
  }

  return (
    <div className="space-y-10">
      <section>
        <h3 className="text-lg font-semibold">Personal references</h3>
        <p className="mt-1 text-sm text-slate-600">Non-relatives who can speak to your character. At least one is required.</p>
        <div className="mt-4 space-y-4">
          {d.references.map((r, i) => (
            <div key={i} className="grid gap-4 sm:grid-cols-3">
              <Field label={`Reference ${i + 1} name`} required={i === 0}><input className="input" value={r.name} onChange={(e) => setRef(i, { name: e.target.value })} /></Field>
              <Field label="Relationship"><input className="input" value={r.relationship} onChange={(e) => setRef(i, { relationship: e.target.value })} /></Field>
              <Field label="Phone" required={i === 0}><input className="input" type="tel" value={r.phone} onChange={(e) => setRef(i, { phone: e.target.value })} /></Field>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h3 className="text-lg font-semibold">Rental history questions</h3>
        <div className="mt-4 grid gap-5 sm:grid-cols-2">
          <Field label="Have you ever been evicted?">
            <select className="input" value={d.history.evicted} onChange={(e) => setHistory({ evicted: e.target.value })}><option>No</option><option>Yes</option></select>
          </Field>
          <Field label="Have you ever broken a lease?">
            <select className="input" value={d.history.broken_lease} onChange={(e) => setHistory({ broken_lease: e.target.value })}><option>No</option><option>Yes</option></select>
          </Field>
          {(d.history.evicted === "Yes" || d.history.broken_lease === "Yes") && (
            <Field label="Please explain" className="sm:col-span-2">
              <textarea className="input" rows={3} value={d.history.explanation} onChange={(e) => setHistory({ explanation: e.target.value })} />
            </Field>
          )}
        </div>
      </section>

      <section>
        <h3 className="text-lg font-semibold">Supporting documents</h3>
        <p className="mt-1 text-sm text-slate-600">
          Upload a photo ID and proof of income (e.g. two recent pay stubs). PDF or images, up to {MAX_FILES} files, 10 MB each.
          Documents are stored securely and only visible to ELS Properties staff.
        </p>
        <label className="mt-4 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center transition hover:border-navy-400 hover:bg-navy-50/50">
          <Upload className="h-8 w-8 text-navy-400" />
          <span className="mt-3 text-sm font-semibold text-navy-900">Click to upload files</span>
          <span className="mt-1 text-xs text-slate-500">JPG, PNG, HEIC, or PDF</span>
          <input
            type="file"
            multiple
            accept={ACCEPTED}
            className="sr-only"
            disabled={files.length >= MAX_FILES}
            onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }}
          />
        </label>
        {files.length > 0 && (
          <ul className="mt-4 divide-y divide-slate-100 rounded-xl border border-slate-200">
            {files.map((f, i) => (
              <li key={`${f.name}-${i}`} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                <span className="flex min-w-0 items-center gap-2">
                  <FileText className="h-4 w-4 shrink-0 text-navy-400" />
                  <span className="truncate">{f.name}</span>
                  <span className="shrink-0 text-xs text-slate-400">{(f.size / 1024 / 1024).toFixed(1)} MB</span>
                </span>
                <button type="button" onClick={() => setFiles(files.filter((_, j) => j !== i))} className="rounded p-1 text-slate-400 hover:text-red-600" aria-label={`Remove ${f.name}`}>
                  <X className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <Field label="Anything else we should know?">
          <textarea className="input" rows={3} value={d.additional_notes} onChange={(e) => updateData("additional_notes", e.target.value)} maxLength={2000} />
        </Field>
      </section>
    </div>
  );
}

function ReviewStep({
  form,
  update,
  listing,
  feeCents,
  files,
  goTo,
}: {
  form: ApplicationFormState;
  update: (p: Partial<ApplicationFormState>) => void;
  listing: Listing;
  feeCents: number;
  files: File[];
  goTo: (step: number) => void;
}) {
  const d = form.data;
  const setConsent = (key: keyof ApplicationFormState["consents"], value: boolean) =>
    update({ consents: { ...form.consents, [key]: value } });

  const sections: { title: string; step: number; rows: [string, string][] }[] = [
    {
      title: "Applicant",
      step: 0,
      rows: [
        ["Name", `${form.first_name} ${form.last_name}`],
        ["Email", form.email],
        ["Phone", form.phone],
        ["Desired move-in", formatDate(form.desired_move_in)],
        ["Adults", String(form.adult_count)],
      ],
    },
    {
      title: "Current residence",
      step: 1,
      rows: [
        ["Address", `${d.current_address.street}, ${d.current_address.city}, ${d.current_address.state} ${d.current_address.zip}`],
        ["Landlord", d.current_address.landlord_name || "—"],
      ],
    },
    {
      title: "Income",
      step: 2,
      rows: [
        ["Status", d.employment.status],
        ["Employer", d.employment.employer || "—"],
        ["Monthly income", d.employment.monthly_income ? `$${d.employment.monthly_income.replace(/^\$/, "")}` : "—"],
      ],
    },
    {
      title: "Household",
      step: 3,
      rows: [
        ["Other adults", d.co_applicants.map((c) => `${c.first_name} ${c.last_name}`).join(", ") || "None"],
        ["Minors", d.minors_count],
        ["Pets", d.pets.length ? d.pets.map((p) => p.type || "Pet").join(", ") : "None"],
      ],
    },
    {
      title: "Documents",
      step: 4,
      rows: [["Uploaded files", files.length ? `${files.length} file${files.length > 1 ? "s" : ""}` : "None"]],
    },
  ];

  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-2">
        {sections.map((s) => (
          <div key={s.title} className="rounded-xl border border-slate-200 p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-semibold">{s.title}</h3>
              <button type="button" onClick={() => goTo(s.step)} className="text-xs font-semibold text-navy-600 hover:text-navy-900">Edit</button>
            </div>
            <dl className="space-y-1.5 text-sm">
              {s.rows.map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4">
                  <dt className="text-slate-500">{k}</dt>
                  <dd className="text-right font-medium text-navy-900">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </div>

      <div className="rounded-xl bg-navy-900 p-6 text-white">
        <h3 className="font-semibold text-white">Application fee</h3>
        <div className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between text-navy-100">
            <span>{formatCurrency(feeCents, { cents: true })} × {form.adult_count} {form.adult_count === 1 ? "adult" : "adults"}</span>
            <span>{formatCurrency(feeCents * form.adult_count, { cents: true })}</span>
          </div>
          <div className="flex justify-between border-t border-white/20 pt-2 text-lg font-semibold">
            <span>Total due today</span>
            <span className="text-gold-300">{formatCurrency(feeCents * form.adult_count, { cents: true })}</span>
          </div>
        </div>
        <p className="mt-4 flex items-center gap-2 text-xs text-navy-200">
          <ShieldCheck className="h-4 w-4 text-gold-300" /> You'll be redirected to Stripe's secure checkout. We never see or store your card details.
        </p>
      </div>

      <div className="space-y-3">
        {([
          ["accurate", "I certify that the information in this application is true and complete. False or incomplete information may result in denial."],
          ["screening", `I authorize ELS Properties to verify the information provided, including contacting landlords, employers, and references, and to obtain credit and background reports for all adult applicants.`],
          ["fee", `I understand the application fee is non-refundable once my application for ${listing.address_line1} is submitted, and that submitting an application does not guarantee approval.`],
        ] as const).map(([key, text]) => (
          <label key={key} className="flex cursor-pointer gap-3 rounded-xl border border-slate-200 p-4 text-sm text-slate-700 hover:bg-slate-50">
            <input
              type="checkbox"
              checked={form.consents[key]}
              onChange={(e) => setConsent(key, e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 accent-navy-900"
            />
            {text}
          </label>
        ))}
      </div>
    </div>
  );
}
