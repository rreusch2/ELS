import { useState, type FormEvent } from "react";
import { CircleCheck } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Alert, Spinner } from "./ui";

const TIMES = ["Morning (9–12)", "Afternoon (12–4)", "Evening (4–7)", "Flexible"];

export function ShowingRequestForm({ listingId }: { listingId?: string }) {
  const [form, setForm] = useState({ name: "", email: "", phone: "", preferred_date: "", preferred_time: TIMES[3], message: "" });
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  const set = (key: keyof typeof form) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [key]: e.target.value }));

  async function submit(e: FormEvent) {
    e.preventDefault();
    setStatus("sending");
    const { error } = await supabase.from("showing_requests").insert({
      listing_id: listingId ?? null,
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim() || null,
      preferred_date: form.preferred_date || null,
      preferred_time: form.preferred_time,
      message: form.message.trim() || null,
    });
    setStatus(error ? "error" : "sent");
  }

  if (status === "sent") {
    return (
      <div className="flex flex-col items-center py-6 text-center">
        <CircleCheck className="h-10 w-10 text-emerald-600" />
        <p className="mt-3 font-semibold text-navy-900">Request received!</p>
        <p className="mt-1 text-sm text-slate-600">We'll contact you within one business day to confirm your showing.</p>
      </div>
    );
  }

  const today = new Date().toISOString().slice(0, 10);

  return (
    <form onSubmit={submit} className="space-y-3">
      <input className="input" placeholder="Full name *" required value={form.name} onChange={set("name")} />
      <input className="input" type="email" placeholder="Email *" required value={form.email} onChange={set("email")} />
      <input className="input" type="tel" placeholder="Phone" value={form.phone} onChange={set("phone")} />
      <div className="grid grid-cols-2 gap-3">
        <input className="input" type="date" min={today} value={form.preferred_date} onChange={set("preferred_date")} aria-label="Preferred date" />
        <select className="input" value={form.preferred_time} onChange={set("preferred_time")} aria-label="Preferred time">
          {TIMES.map((t) => <option key={t}>{t}</option>)}
        </select>
      </div>
      <textarea className="input" rows={3} placeholder="Questions or notes (optional)" value={form.message} onChange={set("message")} />
      {status === "error" && <Alert>Something went wrong. Please try again or give us a call.</Alert>}
      <button type="submit" className="btn-outline w-full" disabled={status === "sending"}>
        {status === "sending" ? <Spinner className="h-4 w-4" /> : null}
        Request a Showing
      </button>
    </form>
  );
}
