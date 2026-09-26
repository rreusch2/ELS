import type { ApplicationStatus, ListingStatus, PropertyType, ShowingStatus } from "./types";

export function formatCurrency(cents: number | null | undefined, opts: { cents?: boolean } = {}) {
  if (cents == null) return "—";
  return (cents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: opts.cents ? 2 : 0,
    maximumFractionDigits: opts.cents ? 2 : 0,
  });
}

/** Parses a Postgres `date` (YYYY-MM-DD) as a local date rather than UTC midnight. */
function parseDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T00:00:00`) : new Date(value);
}

export function formatDate(value: string | null | undefined, opts: Intl.DateTimeFormatOptions = {}) {
  if (!value) return "—";
  return parseDate(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    ...opts,
  });
}

export function formatDateTime(value: string | null | undefined) {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function availabilityLabel(value: string | null) {
  if (!value) return "Contact for availability";
  const date = parseDate(value);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date <= today ? "Available now" : `Available ${formatDate(value, { year: undefined })}`;
}

export function formatBeds(beds: number) {
  const n = Number(beds);
  return n === 0 ? "Studio" : `${n} bd`;
}

export function formatBaths(baths: number) {
  return `${Number(baths)} ba`;
}

export const propertyTypeLabels: Record<PropertyType, string> = {
  house: "House",
  apartment: "Apartment",
  townhouse: "Townhouse",
  duplex: "Duplex",
  condo: "Condo",
};

export const listingStatusLabels: Record<ListingStatus, string> = {
  draft: "Draft",
  available: "Available",
  pending: "Application Pending",
  rented: "Rented",
};

export const applicationStatusLabels: Record<ApplicationStatus, string> = {
  pending_payment: "Awaiting Payment",
  submitted: "Submitted",
  under_review: "Under Review",
  approved: "Approved",
  denied: "Denied",
  withdrawn: "Withdrawn",
};

export const showingStatusLabels: Record<ShowingStatus, string> = {
  new: "New",
  scheduled: "Scheduled",
  completed: "Completed",
  canceled: "Canceled",
};

export function fullAddress(l: { address_line1: string; address_line2?: string | null; city: string; state: string; zip: string }) {
  return [l.address_line1, l.address_line2, `${l.city}, ${l.state} ${l.zip}`].filter(Boolean).join(", ");
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
