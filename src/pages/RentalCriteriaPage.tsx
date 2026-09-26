import { Link } from "react-router";
import { Briefcase, ChevronDown, CreditCard, FileText, Home, PawPrint, ShieldCheck, Users } from "lucide-react";
import { PageHero } from "@/components/ui";
import { EqualHousingLogo } from "@/components/EqualHousingLogo";
import { useSiteSettings } from "@/lib/queries";
import { formatCurrency } from "@/lib/format";

export function RentalCriteriaPage() {
  const { data: settings } = useSiteSettings();
  const fee = settings ? formatCurrency(settings.application_fee_cents) : "$50";

  const criteria = [
    { icon: Briefcase, title: "Income", text: "Combined gross household income of at least 3 times the monthly rent. Proof of income (recent pay stubs, offer letter, or bank statements) is required." },
    { icon: Home, title: "Rental History", text: "12 months of verifiable positive rental history or homeownership. Prior evictions or balances owed to a landlord may result in denial or require an additional deposit." },
    { icon: CreditCard, title: "Credit", text: "Credit history is reviewed as part of the application. Limited or poor credit may be approved with an additional security deposit or qualified co-signer." },
    { icon: ShieldCheck, title: "Background", text: "A background screening is completed for all adult applicants in accordance with applicable fair housing laws and HUD guidance." },
    { icon: Users, title: "Occupancy", text: "Every occupant 18 years of age or older must submit a separate application and pay the application fee. Occupancy limits follow local codes." },
    { icon: PawPrint, title: "Pets", text: "Pet policies vary by property and are listed on each home. Assistance animals are not pets and are not subject to pet fees or restrictions." },
  ];

  const faqs = [
    { q: "How much is the application fee?", a: `The application fee is ${fee} per adult applicant (18+). It covers the cost of processing your application and screening, and it is non-refundable once your application has been submitted.` },
    { q: "How long does it take to get approved?", a: "Most complete applications are reviewed within 2–3 business days. Missing information or hard-to-reach references can delay the process." },
    { q: "What do I need to apply?", a: "A valid government-issued photo ID, proof of income, contact information for your current and previous landlords, and employment information. You can upload documents directly in the application." },
    { q: "Can I apply before seeing the home?", a: "Yes, but we strongly recommend scheduling a showing first. Request one from any listing page or give us a call." },
    { q: "What happens after I'm approved?", a: "We'll contact you to sign the lease and collect the security deposit, which holds the home for you. First month's rent is due at or before move-in." },
    { q: "Do you accept co-signers?", a: "Yes. Co-signers must meet the same criteria, with income of at least 5 times the monthly rent, and must complete their own application." },
    { q: "Which utilities am I responsible for?", a: "This varies by property. Each listing shows which utilities are included in the rent." },
  ];

  return (
    <>
      <PageHero
        eyebrow="Before You Apply"
        title="Rental criteria & qualifications"
        subtitle="We want the application process to be clear and fair. Please review our standard qualifications before submitting an application."
      />

      <section className="py-16">
        <div className="container-page">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {criteria.map(({ icon: Icon, title, text }) => (
              <div key={title} className="card p-7">
                <span className="grid h-12 w-12 place-items-center rounded-xl bg-navy-900 text-gold-300"><Icon className="h-6 w-6" /></span>
                <h2 className="mt-5 text-lg font-semibold">{title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{text}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            <div className="card flex gap-5 bg-gold-50 p-7">
              <FileText className="h-8 w-8 shrink-0 text-gold-700" />
              <div>
                <h2 className="text-lg font-semibold">Application fee: {fee} per adult</h2>
                <p className="mt-2 text-sm leading-relaxed text-slate-700">
                  Paid securely online by credit or debit card when you submit your application. The fee is
                  non-refundable once your application is submitted, so please review these criteria first.
                </p>
              </div>
            </div>
            <div className="card flex gap-5 p-7">
              <EqualHousingLogo className="h-10 w-10 shrink-0 text-navy-900" />
              <div>
                <h2 className="text-lg font-semibold">Equal Housing Opportunity</h2>
                <p className="mt-2 text-sm leading-relaxed text-slate-700">
                  We apply the same criteria to every applicant and do not discriminate on the basis of race, color,
                  religion, sex, disability, familial status, national origin, or any other protected class.
                  Reasonable accommodations are available upon request.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="faq" className="scroll-mt-32 bg-slate-50 py-16">
        <div className="container-page max-w-3xl">
          <div className="text-center">
            <p className="eyebrow">FAQ</p>
            <h2 className="section-title mt-2">Frequently asked questions</h2>
          </div>
          <div className="mt-10 space-y-3">
            {faqs.map(({ q, a }) => (
              <details key={q} className="group card p-0 open:shadow-md">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 font-semibold text-navy-900">
                  {q}
                  <ChevronDown className="h-5 w-5 shrink-0 text-slate-400 transition-transform group-open:rotate-180" />
                </summary>
                <p className="px-5 pb-5 text-sm leading-relaxed text-slate-600">{a}</p>
              </details>
            ))}
          </div>
          <div className="mt-12 text-center">
            <Link to="/listings" className="btn-primary px-8 py-3">Browse Available Homes</Link>
          </div>
        </div>
      </section>
    </>
  );
}
