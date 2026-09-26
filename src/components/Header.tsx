import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router";
import { Clock, Menu, Phone, X } from "lucide-react";
import clsx from "clsx";
import { Logo } from "./Logo";
import { useSiteSettings } from "@/lib/queries";

const NAV = [
  { to: "/", label: "Home", end: true },
  { to: "/listings", label: "Available Rentals" },
  { to: "/rental-criteria", label: "Rental Criteria" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
];

export function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const { data: settings } = useSiteSettings();

  useEffect(() => setOpen(false), [location.pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="sticky top-0 z-[1000]">
      <div className="hidden bg-navy-950 text-xs text-navy-100 md:block">
        <div className="container-page flex h-9 items-center justify-between">
          <p>Quality rental homes in Henderson, Kentucky</p>
          <div className="flex items-center gap-6">
            {settings && (
              <>
                <span className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-gold-400" />
                  {settings.office_hours}
                </span>
                <a href={`tel:${settings.phone}`} className="flex items-center gap-1.5 hover:text-white">
                  <Phone className="h-3.5 w-3.5 text-gold-400" />
                  {settings.phone}
                </a>
              </>
            )}
          </div>
        </div>
      </div>

      <div
        className={clsx(
          "border-b bg-white/95 backdrop-blur transition-shadow",
          scrolled ? "border-slate-200 shadow-sm" : "border-transparent",
        )}
      >
        <div className="container-page flex h-18 items-center justify-between py-3">
          <Logo />

          <nav className="hidden items-center gap-1 lg:flex">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  clsx(
                    "rounded-lg px-3.5 py-2 text-sm font-medium transition-colors",
                    isActive ? "text-navy-900" : "text-slate-600 hover:text-navy-900",
                  )
                }
              >
                {({ isActive }) => (
                  <span className="relative">
                    {item.label}
                    <span
                      className={clsx(
                        "absolute -bottom-1.5 left-0 h-0.5 rounded-full bg-gold-400 transition-all",
                        isActive ? "w-full" : "w-0",
                      )}
                    />
                  </span>
                )}
              </NavLink>
            ))}
          </nav>

          <div className="hidden lg:block">
            <Link to="/listings" className="btn-primary">
              Apply Now
            </Link>
          </div>

          <button
            type="button"
            className="btn-ghost -mr-2 px-2 lg:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {open && (
          <div className="border-t border-slate-100 bg-white lg:hidden">
            <nav className="container-page flex flex-col gap-1 py-4">
              {NAV.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    clsx(
                      "rounded-lg px-3 py-2.5 text-base font-medium",
                      isActive ? "bg-navy-50 text-navy-900" : "text-slate-600",
                    )
                  }
                >
                  {item.label}
                </NavLink>
              ))}
              <Link to="/listings" className="btn-primary mt-2">
                Apply Now
              </Link>
              {settings && (
                <a href={`tel:${settings.phone}`} className="btn-outline mt-1">
                  <Phone className="h-4 w-4" /> {settings.phone}
                </a>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
