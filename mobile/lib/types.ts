export type ListingStatus = "draft" | "available" | "pending" | "rented";
export type PropertyType = "house" | "apartment" | "townhouse" | "duplex" | "condo";
export type ApplicationStatus =
  | "pending_payment"
  | "submitted"
  | "under_review"
  | "approved"
  | "denied"
  | "withdrawn";
export type ShowingStatus = "new" | "scheduled" | "completed" | "canceled";

export interface ListingPhoto {
  id: string;
  listing_id: string;
  url: string;
  storage_path: string | null;
  sort_order: number;
}

export interface Listing {
  id: string;
  slug: string;
  title: string;
  description: string;
  property_type: PropertyType;
  status: ListingStatus;
  address_line1: string;
  address_line2: string | null;
  city: string;
  state: string;
  zip: string;
  latitude: number | null;
  longitude: number | null;
  rent_cents: number;
  deposit_cents: number | null;
  bedrooms: number;
  bathrooms: number;
  square_feet: number | null;
  available_date: string | null;
  lease_term_months: number;
  pets_allowed: boolean;
  pet_policy: string | null;
  utilities_included: string[];
  amenities: string[];
  featured: boolean;
  created_at: string;
  updated_at: string;
  listing_photos: ListingPhoto[];
}

export interface SiteSettings {
  id: number;
  application_fee_cents: number;
  company_name: string;
  phone: string;
  email: string;
  address_line1: string;
  city: string;
  state: string;
  zip: string;
  office_hours: string;
  updated_at: string;
}

export interface Application {
  id: string;
  listing_id: string | null;
  status: ApplicationStatus;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  desired_move_in: string | null;
  adult_count: number;
  fee_per_applicant_cents: number;
  fee_total_cents: number;
  stripe_session_id: string | null;
  stripe_payment_intent_id: string | null;
  paid_at: string | null;
  data: ApplicationData;
  document_paths: string[];
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
  listing?: Pick<Listing, "id" | "title" | "slug" | "address_line1"> | null;
}

export interface ShowingRequest {
  id: string;
  listing_id: string | null;
  name: string;
  email: string;
  phone: string | null;
  preferred_date: string | null;
  preferred_time: string | null;
  message: string | null;
  status: ShowingStatus;
  created_at: string;
  listing?: Pick<Listing, "title" | "slug"> | null;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string | null;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface CoApplicant {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  date_of_birth: string;
  relationship: string;
}

export interface Pet {
  type: string;
  breed: string;
  weight_lbs: string;
}

export interface Vehicle {
  make_model: string;
  year: string;
  plate: string;
}

export interface Reference {
  name: string;
  relationship: string;
  phone: string;
}

export interface ApplicationData {
  date_of_birth: string;
  current_address: {
    street: string;
    city: string;
    state: string;
    zip: string;
    move_in_date: string;
    monthly_rent: string;
    landlord_name: string;
    landlord_phone: string;
    reason_for_leaving: string;
  };
  previous_address: {
    street: string;
    city: string;
    state: string;
    zip: string;
    landlord_name: string;
    landlord_phone: string;
  };
  employment: {
    status: string;
    employer: string;
    position: string;
    supervisor_name: string;
    supervisor_phone: string;
    start_date: string;
    monthly_income: string;
    other_income: string;
  };
  co_applicants: CoApplicant[];
  minors_count: string;
  pets: Pet[];
  vehicles: Vehicle[];
  references: Reference[];
  history: {
    evicted: string;
    broken_lease: string;
    explanation: string;
  };
  additional_notes: string;
}
