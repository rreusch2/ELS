import { Link } from "react-router";
import { Bath, BedDouble, CalendarDays, MapPin, PawPrint, Ruler } from "lucide-react";
import type { Listing } from "@/lib/types";
import { availabilityLabel, formatBaths, formatBeds, formatCurrency, propertyTypeLabels } from "@/lib/format";

export function ListingCard({ listing }: { listing: Listing }) {
  const photo = listing.listing_photos[0]?.url;

  return (
    <Link
      to={`/listings/${listing.slug}`}
      className="group card flex flex-col overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-navy-900/10"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
        {photo ? (
          <img
            src={photo}
            alt={listing.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="grid h-full place-items-center text-sm text-slate-400">Photos coming soon</div>
        )}
        <div className="absolute inset-x-0 top-0 flex items-start justify-between p-3">
          <span className="rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-navy-900 shadow-sm">
            {propertyTypeLabels[listing.property_type]}
          </span>
          {listing.status === "pending" && (
            <span className="rounded-full bg-amber-400 px-3 py-1 text-xs font-semibold text-amber-950 shadow-sm">
              Application Pending
            </span>
          )}
        </div>
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-navy-950/80 to-transparent p-4 pt-10">
          <p className="font-serif text-2xl font-semibold text-white">
            {formatCurrency(listing.rent_cents)}
            <span className="ml-1 font-sans text-sm font-normal text-navy-100">/month</span>
          </p>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-lg font-semibold text-navy-900 transition-colors group-hover:text-gold-700">{listing.title}</h3>
        <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
          <MapPin className="h-3.5 w-3.5 shrink-0" />
          {listing.address_line1}, {listing.city}
        </p>

        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 border-t border-slate-100 pt-4 text-sm text-slate-600">
          <span className="flex items-center gap-1.5"><BedDouble className="h-4 w-4 text-navy-400" />{formatBeds(listing.bedrooms)}</span>
          <span className="flex items-center gap-1.5"><Bath className="h-4 w-4 text-navy-400" />{formatBaths(listing.bathrooms)}</span>
          {listing.square_feet && (
            <span className="flex items-center gap-1.5"><Ruler className="h-4 w-4 text-navy-400" />{listing.square_feet.toLocaleString()} sqft</span>
          )}
          {listing.pets_allowed && (
            <span className="flex items-center gap-1.5"><PawPrint className="h-4 w-4 text-navy-400" />Pets OK</span>
          )}
        </div>

        <p className="mt-auto flex items-center gap-1.5 pt-4 text-sm font-medium text-emerald-700">
          <CalendarDays className="h-4 w-4" />
          {availabilityLabel(listing.available_date)}
        </p>
      </div>
    </Link>
  );
}
