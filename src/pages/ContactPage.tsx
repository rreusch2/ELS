import { useState, type FormEvent } from "react";
import { CircleCheck, Clock, Mail, MapPin, Phone } from "lucide-react";
import { Alert, Field, PageHero, Spinner } from "@/components/ui";
import { ShowingRequestForm } from "@/components/ShowingRequestForm";
import { useSiteSettings } from "@/lib/queries";
import { supabase } from "@/lib/supabase";

export function ContactPage() {
  const { data: s } = useSiteSettings();
  const [form, setForm] = useState({ name: "", email: "", phone: "", subject: "General question", message: "" });
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  const set = (key: keyof typeof form) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [key]: e.target.value }));

  async function submit(e: FormEvent) {
    e.preventDefault();
    setStatus("sending");
    const { error } = await supabase.from("contact_messages").insert({
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim() || null,
      subject: form.subject,
      message: form.message.trim(),
    });
    setStatus(error ? "error" : "sent");
  }

  return (
    <>
      <PageHero
        eyebrow="Contact Us"
        title="We'd love to hear from you"
        subtitle="Questions about a property, the application process, or anything else? Reach out and a member of our team will get back to you within one business day."
      />

      <section className="bg-slate-50 py-16">
        <div className="container-page grid gap-8 lg:grid-cols-[1fr_400px]">
          <div className="card p-6 sm:p-10">
            <h2 className="font-serif text-2xl font-semibold">Send us a message</h2>
            {status === "sent" ? (
              <div className="flex flex-col items-center py-16 text-center">
                <CircleCheck className="h-12 w-12 text-emerald-600" />
                <p className="mt-4 text-lg font-semibold text-navy-900">Thanks, {form.name.split(" ")[0]}!</p>
                <p className="mt-1 text-slate-600">Your message has been sent. We'll be in touch soon.</p>
              </div>
            ) : (
              <form onSubmit={submit} className="mt-6 grid gap-5 sm:grid-cols-2">
                <Field label="Full name" required><input className="input" required value={form.name} onChange={set("name")} /></Field>
                <Field label="Email" required><input className="input" type="email" required value={form.email} onChange={set("email")} /></Field>
                <Field label="Phone"><input className="input" type="tel" value={form.phone} onChange={set("phone")} /></Field>
                <Field label="Subject">
                  <select className="input" value={form.subject} onChange={set("subject")}>
                    <option>General question</option>
                    <option>Available rentals</option>
                    <option>Application status</option>
                    <option>Current resident</option>
                    <option>Property owner services</option>
                  </select>
                </Field>
                <Field label="Message" required className="sm:col-span-2">
                  <textarea className="input" rows={6} required maxLength={5000} value={form.message} onChange={set("message")} />
                </Field>
                {status === "error" && <div className="sm:col-span-2"><Alert>Something went wrong. Please try again or call us.</Alert></div>}
                <div className="sm:col-span-2">
                  <button type="submit" className="btn-primary px-8 py-3" disabled={status === "sending"}>
                    {status === "sending" && <Spinner className="h-4 w-4" />} Send Message
                  </button>
                </div>
              </form>
            )}
          </div>

          <div className="space-y-6">
            {s && (
              <div className="card space-y-5 p-6">
                <h3 className="font-serif text-xl font-semibold">Office information</h3>
                {[
                  { icon: MapPin, label: "Address", value: <>{s.address_line1}<br />{s.city}, {s.state} {s.zip}</> },
                  { icon: Phone, label: "Phone", value: <a href={`tel:${s.phone}`} className="hover:text-gold-700">{s.phone}</a> },
                  { icon: Mail, label: "Email", value: <a href={`mailto:${s.email}`} className="hover:text-gold-700">{s.email}</a> },
                  { icon: Clock, label: "Office hours", value: s.office_hours },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex gap-4">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-navy-50 text-navy-700"><Icon className="h-5 w-5" /></span>
                    <div>
                      <p className="text-xs text-slate-500">{label}</p>
                      <p className="text-sm font-medium text-navy-900">{value}</p>
                    </div>
                  </div>
                ))}
                <p className="rounded-lg bg-gold-50 p-3 text-xs text-gold-900">
                  <strong>Maintenance emergency?</strong> Current residents can call our main line 24/7 for emergencies such as flooding, gas leaks, or no heat.
                </p>
              </div>
            )}

            <div className="card p-6">
              <h3 className="font-serif text-xl font-semibold">Request a showing</h3>
              <p className="mt-1 mb-4 text-sm text-slate-600">Not sure which home yet? Send a general request and we'll help you find the right fit.</p>
              <ShowingRequestForm />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
