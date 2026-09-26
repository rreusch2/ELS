import { Link } from "react-router";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { Logo } from "./Logo";
import { EqualHousingLogo } from "./EqualHousingLogo";
import { useSiteSettings } from "@/lib/queries";

export function Footer() {
  const { data: s } = useSiteSettings();
  const year = new Date().getFullYear();

  return (
    <footer className="bg-navy-950 text-navy-200">
      <div className="container-page grid gap-12 py-16 md:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-4">
          <Logo variant="light" />
          <p className="max-w-xs text-sm leading-relaxed text-navy-300">
            Locally owned and operated, ELS Properties provides well-maintained rental homes and responsive
            management throughout Henderson, Kentucky.
          </p>
        </div>

        <div>
          <h3 className="mb-4 text-sm font-semibold tracking-wider text-white uppercase">Renters</h3>
          <ul className="space-y-2.5 text-sm">
            <li><Link to="/listings" className="hover:text-gold-300">Available Rentals</Link></li>
            <li><Link to="/rental-criteria" className="hover:text-gold-300">Rental Criteria</Link></li>
            <li><Link to="/rental-criteria#faq" className="hover:text-gold-300">FAQ</Link></li>
            <li><Link to="/contact" className="hover:text-gold-300">Schedule a Showing</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="mb-4 text-sm font-semibold tracking-wider text-white uppercase">Company</h3>
          <ul className="space-y-2.5 text-sm">
            <li><Link to="/about" className="hover:text-gold-300">About Us</Link></li>
            <li><Link to="/contact" className="hover:text-gold-300">Contact</Link></li>
            <li><Link to="/admin" className="hover:text-gold-300">Staff Login</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="mb-4 text-sm font-semibold tracking-wider text-white uppercase">Contact</h3>
          {s && (
            <ul className="space-y-3 text-sm">
              <li className="flex gap-3">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold-400" />
                <span>{s.address_line1}<br />{s.city}, {s.state} {s.zip}</span>
              </li>
              <li className="flex gap-3">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-gold-400" />
                <a href={`tel:${s.phone}`} className="hover:text-gold-300">{s.phone}</a>
              </li>
              <li className="flex gap-3">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-gold-400" />
                <a href={`mailto:${s.email}`} className="hover:text-gold-300">{s.email}</a>
              </li>
              <li className="flex gap-3">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-gold-400" />
                <span>{s.office_hours}</span>
              </li>
            </ul>
          )}
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-page flex flex-col items-center gap-4 py-6 text-xs text-navy-300 md:flex-row md:justify-between">
          <div className="flex items-center gap-3">
            <EqualHousingLogo className="h-9 w-9 text-navy-200" />
            <p className="max-w-md">
              ELS Properties is committed to compliance with all federal, state, and local fair housing laws. We do
              not discriminate on the basis of race, color, religion, sex, disability, familial status, or national origin.
            </p>
          </div>
          <p>© {year} ELS Properties. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
