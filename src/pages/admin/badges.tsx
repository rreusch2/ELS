import { Badge, type BadgeTone } from "@/components/ui";
import type { ApplicationStatus, ListingStatus, ShowingStatus } from "@/lib/types";
import { applicationStatusLabels, listingStatusLabels, showingStatusLabels } from "@/lib/format";

const appTones: Record<ApplicationStatus, BadgeTone> = {
  pending_payment: "gray",
  submitted: "blue",
  under_review: "amber",
  approved: "green",
  denied: "red",
  withdrawn: "gray",
};

const listingTones: Record<ListingStatus, BadgeTone> = {
  draft: "gray",
  available: "green",
  pending: "amber",
  rented: "navy",
};

const showingTones: Record<ShowingStatus, BadgeTone> = {
  new: "blue",
  scheduled: "amber",
  completed: "green",
  canceled: "gray",
};

export function ApplicationStatusBadge({ status, label }: { status: ApplicationStatus; label?: string }) {
  return <Badge tone={appTones[status]}>{label ?? applicationStatusLabels[status]}</Badge>;
}

export function ListingStatusBadge({ status }: { status: ListingStatus }) {
  return <Badge tone={listingTones[status]}>{listingStatusLabels[status]}</Badge>;
}

export function ShowingStatusBadge({ status }: { status: ShowingStatus }) {
  return <Badge tone={showingTones[status]}>{showingStatusLabels[status]}</Badge>;
}
