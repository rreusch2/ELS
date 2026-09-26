import { Link } from "react-router";
import { Award, HeartHandshake, Home, Users } from "lucide-react";
import { PageHero } from "@/components/ui";

const VALUES = [
  { icon: HeartHandshake, title: "Respect", text: "We treat every resident the way we'd want to be treated — with honesty, fairness, and courtesy." },
  { icon: Home, title: "Quality", text: "We invest in our properties so residents enjoy safe, comfortable, well-maintained homes." },
  { icon: Users, title: "Community", text: "We're proud to be part of Henderson and to help our neighbors find a place to belong." },
  { icon: Award, title: "Responsiveness", text: "Questions get answers and repairs get done — promptly and professionally." },
];

export function AboutPage() {
  return (
    <>
      <PageHero
        eyebrow="About ELS Properties"
        title="Henderson's hometown property management team"
        subtitle="We're a locally owned company dedicated to providing quality rental homes and genuinely great service."
        image="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=2000&q=80"
      />

      <section className="py-20">
        <div className="container-page grid items-center gap-12 lg:grid-cols-2">
          <div>
            <p className="eyebrow">Our Story</p>
            <h2 className="section-title mt-2">Built on relationships, not transactions</h2>
            <div className="mt-6 space-y-4 text-lg leading-relaxed text-slate-600">
              <p>
                ELS Properties was founded with a simple idea: renters in Henderson deserve a landlord who cares about
                their homes as much as they do. What started with a single property has grown into a portfolio of
                houses, townhomes, and apartments across the city.
              </p>
              <p>
                Today, we still operate the same way we did on day one — answering our own phones, knowing our
                residents by name, and taking pride in every home we manage.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <img src="https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&q=80" alt="" className="aspect-[3/4] w-full rounded-2xl object-cover" />
            <img src="https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&q=80" alt="" className="mt-10 aspect-[3/4] w-full rounded-2xl object-cover" />
          </div>
        </div>
      </section>

      <section className="bg-navy-900 py-16">
        <div className="container-page grid grid-cols-2 gap-8 text-center lg:grid-cols-4">
          {[
            ["50+", "Homes managed"],
            ["10+", "Years in Henderson"],
            ["24/7", "Emergency maintenance"],
            ["2–3", "Day application review"],
          ].map(([stat, label]) => (
            <div key={label}>
              <p className="font-serif text-4xl font-bold text-gold-300">{stat}</p>
              <p className="mt-2 text-sm text-navy-200">{label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="py-20">
        <div className="container-page">
          <div className="mx-auto max-w-2xl text-center">
            <p className="eyebrow">Our Values</p>
            <h2 className="section-title mt-2">What we stand for</h2>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {VALUES.map(({ icon: Icon, title, text }) => (
              <div key={title} className="card p-7 text-center">
                <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-gold-100 text-gold-700">
                  <Icon className="h-6 w-6" />
                </span>
                <h3 className="mt-5 text-lg font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{text}</p>
              </div>
            ))}
          </div>
          <div className="mt-14 text-center">
            <Link to="/listings" className="btn-primary px-8 py-3">See Available Homes</Link>
          </div>
        </div>
      </section>
    </>
  );
}
