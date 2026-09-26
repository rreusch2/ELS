import { useState } from "react";
import { Link, useSearchParams } from "react-router";
import { FunctionsHttpError } from "@supabase/supabase-js";
import { CircleAlert, CircleCheck, Mail } from "lucide-react";
import { Alert, Spinner } from "@/components/ui";
import { supabase } from "@/lib/supabase";
import { useSiteSettings } from "@/lib/queries";

export function ApplySuccessPage() {
  const { data: s } = useSiteSettings();
  return (
    <div className="bg-slate-50 py-20">
      <div className="container-page max-w-2xl">
        <div className="card p-10 text-center">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-100">
            <CircleCheck className="h-9 w-9 text-emerald-600" />
          </span>
          <h1 className="mt-6 font-serif text-3xl font-semibold">Application submitted!</h1>
          <p className="mt-3 text-lg text-slate-600">Thank you — your payment was received and your application is in our review queue.</p>

          <div className="mt-8 rounded-xl bg-navy-50 p-6 text-left">
            <h2 className="font-semibold">What happens next</h2>
            <ol className="mt-3 space-y-2 text-sm text-slate-700">
              <li><strong>1.</strong> You'll receive a receipt from Stripe and a confirmation email from us.</li>
              <li><strong>2.</strong> We'll verify your rental history, income, and references.</li>
              <li><strong>3.</strong> Most applications are reviewed within 2–3 business days. We'll contact you with a decision.</li>
            </ol>
          </div>

          {s && (
            <p className="mt-6 flex items-center justify-center gap-2 text-sm text-slate-600">
              <Mail className="h-4 w-4" /> Questions? Email <a href={`mailto:${s.email}`} className="font-medium text-navy-700">{s.email}</a> or call {s.phone}.
            </p>
          )}
          <div className="mt-8 flex justify-center gap-3">
            <Link to="/" className="btn-primary">Back to home</Link>
            <Link to="/listings" className="btn-outline">Browse more rentals</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ApplyCanceledPage() {
  const [params] = useSearchParams();
  const applicationId = params.get("application");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function retry() {
    if (!applicationId) return;
    setLoading(true);
    setError(null);
    const { data, error: fnError } = await supabase.functions.invoke("submit-application", {
      body: { action: "retry", application_id: applicationId },
    });
    if (fnError) {
      const body = fnError instanceof FunctionsHttpError ? await fnError.context.json().catch(() => null) : null;
      setError(body?.error ?? "We couldn't restart checkout. Please contact us.");
      setLoading(false);
      return;
    }
    window.location.assign(data.checkout_url);
  }

  return (
    <div className="bg-slate-50 py-20">
      <div className="container-page max-w-2xl">
        <div className="card p-10 text-center">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-amber-100">
            <CircleAlert className="h-9 w-9 text-amber-600" />
          </span>
          <h1 className="mt-6 font-serif text-3xl font-semibold">Payment not completed</h1>
          <p className="mt-3 text-lg text-slate-600">
            Your application has been saved, but it won't be reviewed until the application fee is paid.
          </p>
          {error && <div className="mt-6"><Alert>{error}</Alert></div>}
          <div className="mt-8 flex justify-center gap-3">
            {applicationId && (
              <button type="button" onClick={retry} className="btn-gold px-6" disabled={loading}>
                {loading && <Spinner className="h-4 w-4" />} Complete payment
              </button>
            )}
            <Link to="/contact" className="btn-outline">Contact us</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
