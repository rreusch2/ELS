import { useState, type FormEvent } from "react";
import { Navigate, useLocation, useNavigate } from "react-router";
import { Logo } from "@/components/Logo";
import { Alert, Field, Spinner } from "@/components/ui";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";

export function AdminLoginPage() {
  const { session, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const from = (location.state as { from?: string } | null)?.from ?? "/admin";

  if (!loading && session) return <Navigate to={from} replace />;

  async function submit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setSubmitting(false);
    if (error) setError(error.message);
    else navigate(from, { replace: true });
  }

  return (
    <div className="grid min-h-screen place-items-center bg-gradient-to-br from-navy-950 via-navy-900 to-navy-800 p-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center"><Logo variant="light" /></div>
        <form onSubmit={submit} className="card space-y-5 p-8">
          <div>
            <h1 className="font-serif text-2xl font-semibold">Staff sign in</h1>
            <p className="mt-1 text-sm text-slate-600">Manage listings, applications, and inquiries.</p>
          </div>
          <Field label="Email"><input className="input" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
          <Field label="Password"><input className="input" type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} /></Field>
          {error && <Alert>{error}</Alert>}
          <button type="submit" className="btn-primary w-full py-3" disabled={submitting}>
            {submitting && <Spinner className="h-4 w-4" />} Sign in
          </button>
        </form>
      </div>
    </div>
  );
}
