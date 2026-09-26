import type { ReactNode } from "react";
import { LoaderCircle } from "lucide-react";
import clsx from "clsx";

export function Spinner({ className }: { className?: string }) {
  return <LoaderCircle className={clsx("animate-spin", className ?? "h-5 w-5")} />;
}

export function PageLoader() {
  return (
    <div className="grid min-h-[50vh] place-items-center">
      <Spinner className="h-8 w-8 text-navy-400" />
    </div>
  );
}

export function PageHero({ eyebrow, title, subtitle, image }: { eyebrow?: string; title: string; subtitle?: string; image?: string }) {
  return (
    <section className="relative overflow-hidden bg-navy-900">
      {image && <img src={image} alt="" className="absolute inset-0 h-full w-full object-cover opacity-25" />}
      <div className="absolute inset-0 bg-gradient-to-r from-navy-950/90 to-navy-900/60" />
      <div className="container-page relative py-16 sm:py-20">
        {eyebrow && <p className="eyebrow text-gold-300">{eyebrow}</p>}
        <h1 className="mt-3 max-w-3xl font-serif text-4xl font-semibold text-white sm:text-5xl">{title}</h1>
        {subtitle && <p className="mt-4 max-w-2xl text-lg text-navy-100">{subtitle}</p>}
      </div>
    </section>
  );
}

const badgeTones = {
  green: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  amber: "bg-amber-50 text-amber-800 ring-amber-600/20",
  blue: "bg-sky-50 text-sky-700 ring-sky-600/20",
  red: "bg-red-50 text-red-700 ring-red-600/20",
  gray: "bg-slate-100 text-slate-700 ring-slate-500/20",
  navy: "bg-navy-50 text-navy-800 ring-navy-600/20",
} as const;

export type BadgeTone = keyof typeof badgeTones;

export function Badge({ tone = "gray", children, className }: { tone?: BadgeTone; children: ReactNode; className?: string }) {
  return (
    <span className={clsx("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset", badgeTones[tone], className)}>
      {children}
    </span>
  );
}

export function Field({ label, required, hint, children, className }: { label: string; required?: boolean; hint?: string; children: ReactNode; className?: string }) {
  return (
    <label className={clsx("block", className)}>
      <span className="label">
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </span>
      {children}
      {hint && <span className="mt-1 block text-xs text-slate-500">{hint}</span>}
    </label>
  );
}

export function Alert({ tone = "error", children }: { tone?: "error" | "success" | "info"; children: ReactNode }) {
  const styles = {
    error: "border-red-200 bg-red-50 text-red-800",
    success: "border-emerald-200 bg-emerald-50 text-emerald-800",
    info: "border-navy-200 bg-navy-50 text-navy-800",
  }[tone];
  return <div className={clsx("rounded-lg border px-4 py-3 text-sm", styles)}>{children}</div>;
}
