import { Link } from "react-router";
import clsx from "clsx";

export function Logo({ variant = "dark", className }: { variant?: "dark" | "light"; className?: string }) {
  const light = variant === "light";
  return (
    <Link to="/" className={clsx("group flex items-center gap-3", className)} aria-label="ELS Properties home">
      <span
        className={clsx(
          "grid h-10 w-10 place-items-center rounded-xl transition-transform group-hover:scale-105",
          light ? "bg-gold-400" : "bg-navy-900",
        )}
      >
        <svg viewBox="0 0 64 64" className="h-6 w-6" aria-hidden>
          <path d="M32 13 12 29v4h5v18h11V39h8v12h11V33h5v-4L32 13z" fill={light ? "#0f1a2c" : "#cfa75c"} />
        </svg>
      </span>
      <span className="leading-none">
        <span className={clsx("block font-serif text-xl font-bold tracking-wide", light ? "text-white" : "text-navy-900")}>
          ELS
        </span>
        <span className={clsx("block text-[10px] font-semibold tracking-[0.3em]", light ? "text-gold-300" : "text-gold-600")}>
          PROPERTIES
        </span>
      </span>
    </Link>
  );
}
