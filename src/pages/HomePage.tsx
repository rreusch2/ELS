import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router";
import {
  ArrowRight,
  ClipboardList,
  CreditCard,
  HeartHandshake,
  KeyRound,
  MapPin,
  Quote,
  Search,
  ShieldCheck,
  Star,
  Wrench,
} from "lucide-react";
import { ListingCard } from "@/components/ListingCard";
import { Spinner } from "@/components/ui";
import { useFeaturedListings, useListings } from "@/lib/queries";

const HERO_IMAGE = "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=2000&q=80";
const HENDERSON_IMAGE = "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1400&q=80";

const WHY = [
  { icon: HeartHandshake, title: "Locally Owned", text: "We live and work in Henderson. When you call, you reach a neighbor — not a national call center." },
  { icon: Wrench, title: "Responsive Maintenance", text: "Maintenance requests are handled quickly by trusted local professionals, with 24/7 emergency response." },
  { icon: ShieldCheck, title: "Well-Kept Homes", text: "Every property is inspected, cleaned, and move-in ready before you get the keys." },
  { icon: CreditCard, title: "Simple Online Process", text: "Browse, apply, and pay your application fee online in minutes — from any device." },
];

const STEPS = [
  { icon: Search, title: "Find your home", text: "Browse available rentals and schedule a showing." },
  { icon: ClipboardList, title: "Apply online", text: "Complete our secure application in about 15 minutes." },
  { icon: CreditCard, title: "Pay the fee", text: "Pay the application fee securely by card." },
  { icon: KeyRound, title: "Get your keys", text: "Most applications are reviewed within 2–3 business days." },
];

const TESTIMONIALS = [
  { name: "Jessica M.", text: "The application process was so easy, and they responded to every question the same day. Our home was spotless on move-in day." },
  { name: "Marcus T.", text: "Best landlord experience I've had. When our AC went out in July, it was fixed the next morning. Highly recommend ELS." },
  { name: "Danielle R.", text: "Professional, friendly, and fair. You can tell they genuinely care about their tenants and their properties." },
];

export function HomePage() {
  const navigate = useNavigate();
  const { data: featured, isLoading } = useFeaturedListings();
  const { data: all } = useListings();
  const [beds, setBeds] = useState("");
  const [maxRent, setMaxRent] = useState("");

  function search(e: FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (beds) params.set("beds", beds);
    if (maxRent) params.set("maxRent", maxRent);
    navigate(`/listings${params.size ? `?${params}` : ""}`);
  }

  const availableCount = all?.filter((l) => l.status === "available").length;

  return (
    <>
      {/* Hero */}
      <section className="relative isolate overflow-hidden bg-navy-950">
        <img src={HERO_IMAGE} alt="" className="absolute inset-0 -z-10 h-full w-full object-cover" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-navy-950/95 via-navy-950/75 to-navy-900/30" />
        <div className="container-page py-24 sm:py-32 lg:py-40">
          <div className="max-w-2xl animate-fade-up">
            <p className="eyebrow flex items-center gap-2 text-gold-300">
              <MapPin className="h-4 w-4" /> Henderson, Kentucky
            </p>
            <h1 className="mt-4 font-serif text-5xl leading-tight font-semibold text-white sm:text-6xl">
              A place you'll be proud to call <span className="text-gold-300 italic">home.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-navy-100">
              Quality rental homes, townhomes, and apartments across Henderson — managed by a local team that
              actually picks up the phone.
            </p>
          </div>

          <form
            onSubmit={search}
            className="mt-10 grid max-w-3xl animate-fade-up gap-3 rounded-2xl bg-white p-3 shadow-2xl shadow-navy-950/40 [animation-delay:150ms] sm:grid-cols-[1fr_1fr_auto]"
          >
            <select className="input border-0 bg-slate-50 py-3.5" value={beds} onChange={(e) => setBeds(e.target.value)} aria-label="Bedrooms">
              <option value="">Any bedrooms</option>
              <option value="1">1+ bedrooms</option>
              <option value="2">2+ bedrooms</option>
              <option value="3">3+ bedrooms</option>
              <option value="4">4+ bedrooms</option>
            </select>
            <select className="input border-0 bg-slate-50 py-3.5" value={maxRent} onChange={(e) => setMaxRent(e.target.value)} aria-label="Max rent">
              <option value="">Any price</option>
              <option value="1000">Up to $1,000</option>
              <option value="1250">Up to $1,250</option>
              <option value="1500">Up to $1,500</option>
              <option value="2000">Up to $2,000</option>
            </select>
            <button type="submit" className="btn-gold px-8 py-3.5">
              <Search className="h-4 w-4" /> Search Rentals
            </button>
          </form>

          {availableCount != null && (
            <p className="mt-5 text-sm text-navy-200">
              <span className="font-semibold text-white">{availableCount}</span> homes available now
            </p>
          )}
        </div>
      </section>

      {/* Featured listings */}
      <section className="bg-slate-50 py-20 sm:py-24">
        <div className="container-page">
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="eyebrow">Featured Rentals</p>
              <h2 className="section-title mt-2">Homes available now</h2>
            </div>
            <Link to="/listings" className="btn-outline">
              View all rentals <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {isLoading ? (
            <div className="grid place-items-center py-20"><Spinner className="h-8 w-8 text-navy-400" /></div>
          ) : featured && featured.length > 0 ? (
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {featured.map((l) => <ListingCard key={l.id} listing={l} />)}
            </div>
          ) : (
            <p className="mt-10 text-slate-500">No rentals are available right now — check back soon or contact us to join our waitlist.</p>
          )}
        </div>
      </section>

      {/* Why ELS */}
      <section className="py-20 sm:py-24">
        <div className="container-page">
          <div className="mx-auto max-w-2xl text-center">
            <p className="eyebrow">Why Rent With ELS</p>
            <h2 className="section-title mt-2">Renting, the way it should be</h2>
            <p className="mt-4 text-lg text-slate-600">
              We believe renters deserve well-maintained homes, clear communication, and a landlord who treats them with respect.
            </p>
          </div>
          <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {WHY.map(({ icon: Icon, title, text }) => (
              <div key={title} className="group card p-7 transition-shadow hover:shadow-lg">
                <span className="grid h-12 w-12 place-items-center rounded-xl bg-navy-900 text-gold-300 transition-transform group-hover:scale-110">
                  <Icon className="h-6 w-6" />
                </span>
                <h3 className="mt-5 text-lg font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-navy-900 py-20 text-white sm:py-24">
        <div className="container-page">
          <div className="mx-auto max-w-2xl text-center">
            <p className="eyebrow text-gold-300">How It Works</p>
            <h2 className="mt-2 font-serif text-3xl font-semibold text-white sm:text-4xl">From search to keys in four steps</h2>
          </div>
          <div className="mt-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map(({ icon: Icon, title, text }, i) => (
              <div key={title} className="relative text-center">
                <div className="relative mx-auto grid h-16 w-16 place-items-center rounded-full border-2 border-gold-400/60 bg-navy-800">
                  <Icon className="h-7 w-7 text-gold-300" />
                  <span className="absolute -top-1 -right-1 grid h-6 w-6 place-items-center rounded-full bg-gold-400 text-xs font-bold text-navy-950">
                    {i + 1}
                  </span>
                </div>
                <h3 className="mt-5 text-lg font-semibold text-white">{title}</h3>
                <p className="mt-2 text-sm text-navy-200">{text}</p>
              </div>
            ))}
          </div>
          <div className="mt-14 text-center">
            <Link to="/rental-criteria" className="text-sm font-semibold text-gold-300 hover:text-gold-200">
              Review our rental criteria before applying →
            </Link>
          </div>
        </div>
      </section>

      {/* Henderson */}
      <section className="py-20 sm:py-24">
        <div className="container-page grid items-center gap-12 lg:grid-cols-2">
          <div className="relative">
            <img src={HENDERSON_IMAGE} alt="A home in Henderson, Kentucky" className="aspect-[4/3] w-full rounded-2xl object-cover shadow-xl" />
            <div className="absolute -right-4 -bottom-6 hidden rounded-2xl bg-gold-400 p-6 shadow-xl sm:block">
              <p className="font-serif text-4xl font-bold text-navy-950">100%</p>
              <p className="text-sm font-medium text-navy-900">Locally managed</p>
            </div>
          </div>
          <div>
            <p className="eyebrow">Life in Henderson</p>
            <h2 className="section-title mt-2">Small-town charm on the Ohio River</h2>
            <p className="mt-5 text-lg leading-relaxed text-slate-600">
              Henderson offers the best of both worlds: a walkable historic downtown and riverfront, excellent parks
              like John James Audubon State Park, and an easy commute to Evansville across the bridge.
            </p>
            <ul className="mt-6 space-y-3 text-slate-700">
              {[
                "Minutes from downtown dining, shops, and the riverfront",
                "Close to Evansville employers via the Twin Bridges and I-69",
                "Home to the W.C. Handy Blues & Barbecue Festival",
                "Great schools, parks, and a friendly community",
              ].map((item) => (
                <li key={item} className="flex gap-3">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-gold-500" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-slate-50 py-20 sm:py-24">
        <div className="container-page">
          <div className="mx-auto max-w-2xl text-center">
            <p className="eyebrow">Resident Reviews</p>
            <h2 className="section-title mt-2">What our residents say</h2>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {TESTIMONIALS.map((t) => (
              <figure key={t.name} className="card relative p-8">
                <Quote className="absolute top-6 right-6 h-8 w-8 text-gold-200" />
                <div className="flex gap-0.5 text-gold-400">
                  {Array.from({ length: 5 }).map((_, i) => <Star key={i} className="h-4 w-4 fill-current" />)}
                </div>
                <blockquote className="mt-4 leading-relaxed text-slate-700">"{t.text}"</blockquote>
                <figcaption className="mt-5 text-sm font-semibold text-navy-900">— {t.name}</figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="container-page">
          <div className="relative overflow-hidden rounded-3xl bg-navy-900 px-8 py-14 text-center sm:px-16">
            <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-gold-400/20 blur-3xl" />
            <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-navy-500/30 blur-3xl" />
            <h2 className="relative font-serif text-3xl font-semibold text-white sm:text-4xl">Ready to find your next home?</h2>
            <p className="relative mx-auto mt-4 max-w-xl text-navy-100">
              Browse our available rentals or reach out — we're happy to help you find the right fit.
            </p>
            <div className="relative mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link to="/listings" className="btn-gold px-8 py-3">Browse Rentals</Link>
              <Link to="/contact" className="btn border border-white/30 px-8 py-3 text-white hover:bg-white/10">Contact Us</Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
