import { useEffect, useState, type FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useSiteSettings } from "@/lib/queries";
import { Alert, Field, PageLoader, Spinner } from "@/components/ui";
import { AdminPageHeader } from "./AdminLayout";

export function AdminSettingsPage() {
  const { data: settings, isLoading } = useSiteSettings();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    application_fee: "",
    company_name: "",
    phone: "",
    email: "",
    address_line1: "",
    city: "",
    state: "",
    zip: "",
    office_hours: "",
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (settings) {
      setForm({
        application_fee: (settings.application_fee_cents / 100).toFixed(2),
        company_name: settings.company_name,
        phone: settings.phone,
        email: settings.email,
        address_line1: settings.address_line1,
        city: settings.city,
        state: settings.state,
        zip: settings.zip,
        office_hours: settings.office_hours,
      });
    }
  }, [settings]);

  const set = (key: keyof typeof form) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [key]: e.target.value }));

  async function submit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    const { application_fee, ...rest } = form;
    const { error } = await supabase
      .from("site_settings")
      .update({ ...rest, application_fee_cents: Math.round(Number(application_fee) * 100) })
      .eq("id", 1);
    setSaving(false);
    setMessage(error ? { tone: "error", text: error.message } : { tone: "success", text: "Settings saved." });
    queryClient.invalidateQueries({ queryKey: ["site_settings"] });
  }

  if (isLoading || !settings) return <PageLoader />;

  return (
    <>
      <AdminPageHeader title="Settings" subtitle="Application fee and company contact information shown across the site." />
      <form onSubmit={submit} className="max-w-3xl space-y-6">
        <section className="card space-y-5 p-6">
          <h2 className="font-semibold">Application fee</h2>
          <Field label="Fee per adult applicant ($)" hint="Changes apply to new applications immediately.">
            <input className="input max-w-xs" type="number" min="0" step="0.01" required value={form.application_fee} onChange={set("application_fee")} />
          </Field>
        </section>

        <section className="card space-y-5 p-6">
          <h2 className="font-semibold">Company information</h2>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Company name" required><input className="input" required value={form.company_name} onChange={set("company_name")} /></Field>
            <Field label="Office hours" required><input className="input" required value={form.office_hours} onChange={set("office_hours")} /></Field>
            <Field label="Phone" required><input className="input" required value={form.phone} onChange={set("phone")} /></Field>
            <Field label="Email" required><input className="input" type="email" required value={form.email} onChange={set("email")} /></Field>
            <Field label="Street address" required className="sm:col-span-2"><input className="input" required value={form.address_line1} onChange={set("address_line1")} /></Field>
            <Field label="City" required><input className="input" required value={form.city} onChange={set("city")} /></Field>
            <div className="grid grid-cols-2 gap-5">
              <Field label="State" required><input className="input" required maxLength={2} value={form.state} onChange={set("state")} /></Field>
              <Field label="ZIP" required><input className="input" required value={form.zip} onChange={set("zip")} /></Field>
            </div>
          </div>
        </section>

        {message && <Alert tone={message.tone}>{message.text}</Alert>}
        <button type="submit" className="btn-primary px-8" disabled={saving}>
          {saving && <Spinner className="h-4 w-4" />} Save settings
        </button>
      </form>
    </>
  );
}
