import { Link, useParams } from "react-router";
import {
  ArrowLeft,
  Bath,
  BedDouble,
  CalendarDays,
  Check,
  FileText,
  Home as HomeIcon,
  MapPin,
  PawPrint,
  Phone,
  Ruler,
  Zap,
} from "lucide-react";
import { PhotoGallery } from "@/components/PhotoGallery";
import { SingleLocationMap } from "@/components/ListingMap";
import { ShowingRequestForm } from "@/components/ShowingRequestForm";
import { Badge, PageLoader } from "@/components/ui";
import { useListing, useSiteSettings } from "@/lib/queries";
import {
  availabilityLabel,
  formatCurrency,
  fullAddress,
  listingStatusLabels,
  propertyTypeLabels,
} from "@/lib/format";
import { NotFoundPage } from "./NotFoundPage";

export function ListingDetailPage() {
  const { slug } = useParams();
  const { data: listing, isLoading } = useListing(slug);
  const { data: settings } = useSiteSettings();

  if (isLoading) return <PageLoader />;
  if (!listing) return <NotFoundPage message="This listing is no longer available." />;

  const canApply = listing.status === "available" || listing.status === "pending";

  const facts = [
    { icon: BedDouble, label: "Bedrooms", value: Number(listing.bedrooms) === 0 ? "Studio" : Number(listing.bedrooms) },
    { icon: Bath, label: "Bathrooms", value: Number(listing.bathrooms) },
    { icon: Ruler, label: "Square Feet", value: listing.square_feet ? listing.square_feet.toLocaleString() : "—" },
    { icon: HomeIcon, label: "Type", value: propertyTypeLabels[listing.property_type] },
    { icon: CalendarDays, label: "Lease Term", value: `${listing.lease_term_months} months` },
    { icon: PawPrint, label: "Pets", value: listing.pets_allowed ? "Allowed" : "Not allowed" },
  ];

  return (
    <div className="bg-slate-50 pb-20">
      <div className="container-page pt-6">
        <Link to="/listings" className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-navy-900">
          <ArrowLeft className="h-4 w-4" /> Back to all rentals
        </Link>

        <div className="mt-4 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <div className="flex items-center gap-2">
              <Badge tone={listing.status === "available" ? "green" : "amber"}>{listingStatusLabels[listing.status]}</Badge>
              <Badge tone="navy">{propertyTypeLabels[listing.property_type]}</Badge>
            </div>
            <h1 className="mt-3 font-serif text-3xl font-semibold sm:text-4xl">{listing.title}</h1>
            <p className="mt-2 flex items-center gap-1.5 text-slate-600">
              <MapPin className="h-4 w-4" /> {fullAddress(listing)}
            </p>
          </div>
          <div className="md:text-right">
            <p className="font-serif text-4xl font-semibold text-navy-900">
              {formatCurrency(listing.rent_cents)}
              <span className="font-sans text-base font-normal text-slate-500">/month</span>
            </p>
            <p className="mt-1 text-sm font-medium text-emerald-700">{availabilityLabel(listing.available_date)}</p>
          </div>
        </div>

        <div className="mt-6">
          <PhotoGallery photos={listing.listing_photos} title={listing.title} />
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_380px]">
          <div className="space-y-8">
            <section className="card grid grid-cols-2 gap-6 p-6 sm:grid-cols-3">
              {facts.map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-center gap-3">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-navy-50 text-navy-700">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-xs text-slate-500">{label}</p>
                    <p className="font-semibold text-navy-900">{value}</p>
                  </div>
                </div>
              ))}
            </section>

            <section className="card p-6 sm:p-8">
              <h2 className="font-serif text-2xl font-semibold">About this home</h2>
              <p className="mt-4 leading-relaxed whitespace-pre-line text-slate-700">{listing.description}</p>
            </section>

            {listing.amenities.length > 0 && (
              <section className="card p-6 sm:p-8">
                <h2 className="font-serif text-2xl font-semibold">Features & amenities</h2>
                <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                  {listing.amenities.map((a) => (
                    <li key={a} className="flex items-center gap-3 text-slate-700">
                      <span className="grid h-6 w-6 place-items-center rounded-full bg-gold-100 text-gold-700">
                        <Check className="h-3.5 w-3.5" />
                      </span>
                      {a}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <section className="grid gap-6 sm:grid-cols-2">
              <div className="card p-6">
                <h3 className="flex items-center gap-2 font-semibold"><Zap className="h-5 w-5 text-gold-600" /> Utilities included</h3>
                <p className="mt-3 text-sm text-slate-700">
                  {listing.utilities_included.length ? listing.utilities_included.join(", ") : "Tenant responsible for all utilities."}
                </p>
              </div>
              <div className="card p-6">
                <h3 className="flex items-center gap-2 font-semibold"><PawPrint className="h-5 w-5 text-gold-600" /> Pet policy</h3>
                <p className="mt-3 text-sm text-slate-700">{listing.pet_policy || (listing.pets_allowed ? "Pets allowed." : "No pets allowed.")}</p>
              </div>
            </section>

            {listing.latitude != null && listing.longitude != null && (
              <section className="card p-6 sm:p-8">
                <h2 className="font-serif text-2xl font-semibold">Location</h2>
                <p className="mt-2 text-sm text-slate-600">{fullAddress(listing)}</p>
                <SingleLocationMap lat={listing.latitude} lng={listing.longitude} className="mt-5 h-80" />
              </section>
            )}
          </div>

          <aside className="space-y-6 lg:sticky lg:top-32 lg:self-start">
            <div className="card overflow-hidden">
              <div className="bg-navy-900 p-6 text-white">
                <p className="text-sm text-navy-200">Monthly rent</p>
                <p className="font-serif text-3xl font-semibold">{formatCurrency(listing.rent_cents)}</p>
              </div>
              <dl className="divide-y divide-slate-100 px-6 text-sm">
                <div className="flex justify-between py-3"><dt className="text-slate-500">Security deposit</dt><dd className="font-medium text-navy-900">{formatCurrency(listing.deposit_cents)}</dd></div>
                <div className="flex justify-between py-3"><dt className="text-slate-500">Available</dt><dd className="font-medium text-navy-900">{availabilityLabel(listing.available_date).replace("Available ", "")}</dd></div>
                <div className="flex justify-between py-3"><dt className="text-slate-500">Lease term</dt><dd className="font-medium text-navy-900">{listing.lease_term_months} months</dd></div>
                {settings && (
                  <div className="flex justify-between py-3"><dt className="text-slate-500">Application fee</dt><dd className="font-medium text-navy-900">{formatCurrency(settings.application_fee_cents)} / adult</dd></div>
                )}
              </dl>
              <div className="space-y-3 p-6 pt-2">
                {canApply ? (
                  <Link to={`/apply/${listing.slug}`} className="btn-gold w-full py-3 text-base">
                    <FileText className="h-5 w-5" /> Apply Now
                  </Link>
                ) : (
                  <p className="rounded-lg bg-slate-100 p-3 text-center text-sm text-slate-600">This home is not accepting applications.</p>
                )}
                {listing.status === "pending" && (
                  <p className="text-center text-xs text-slate-500">An application is pending on this home. You may still apply as a backup.</p>
                )}
                <Link to="/rental-criteria" className="block text-center text-xs font-medium text-navy-600 hover:text-navy-900">
                  Review rental criteria before applying
                </Link>
              </div>
            </div>

            <div className="card p-6">
              <h3 className="font-serif text-xl font-semibold">Schedule a showing</h3>
              <p className="mt-1 mb-4 text-sm text-slate-600">Tell us when works for you and we'll confirm.</p>
              <ShowingRequestForm listingId={listing.id} />
            </div>

            {settings && (
              <a href={`tel:${settings.phone}`} className="card flex items-center gap-4 p-5 transition hover:shadow-md">
                <span className="grid h-11 w-11 place-items-center rounded-full bg-gold-100 text-gold-700"><Phone className="h-5 w-5" /></span>
                <div>
                  <p className="text-sm text-slate-500">Questions? Call us</p>
                  <p className="font-semibold text-navy-900">{settings.phone}</p>
                </div>
              </a>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
