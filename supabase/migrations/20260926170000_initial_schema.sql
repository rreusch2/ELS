-- ELS Properties: initial schema

-- ============================================================
-- Helpers
-- ============================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============================================================
-- Admins
-- ============================================================
create table public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.admins enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.admins where user_id = (select auth.uid())
  );
$$;

revoke execute on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

create policy "Users can see their own admin row"
  on public.admins for select
  to authenticated
  using (user_id = (select auth.uid()));

-- ============================================================
-- Site settings (single row)
-- ============================================================
create table public.site_settings (
  id smallint primary key default 1 check (id = 1),
  application_fee_cents integer not null default 5000 check (application_fee_cents >= 0),
  company_name text not null default 'ELS Properties',
  phone text not null default '(270) 555-0123',
  email text not null default 'leasing@elsproperties.com',
  address_line1 text not null default '123 Main Street',
  city text not null default 'Henderson',
  state text not null default 'KY',
  zip text not null default '42420',
  office_hours text not null default 'Mon–Fri 9:00 AM – 5:00 PM',
  updated_at timestamptz not null default now()
);

insert into public.site_settings (id) values (1);

alter table public.site_settings enable row level security;

create trigger site_settings_updated_at
  before update on public.site_settings
  for each row execute function public.set_updated_at();

create policy "Anyone can read site settings"
  on public.site_settings for select
  to anon, authenticated
  using (true);

create policy "Admins can update site settings"
  on public.site_settings for update
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- ============================================================
-- Listings
-- ============================================================
create type public.listing_status as enum ('draft', 'available', 'pending', 'rented');
create type public.property_type as enum ('house', 'apartment', 'townhouse', 'duplex', 'condo');

create table public.listings (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text not null default '',
  property_type public.property_type not null default 'house',
  status public.listing_status not null default 'draft',
  address_line1 text not null,
  address_line2 text,
  city text not null default 'Henderson',
  state text not null default 'KY',
  zip text not null default '42420',
  latitude double precision,
  longitude double precision,
  rent_cents integer not null check (rent_cents >= 0),
  deposit_cents integer check (deposit_cents >= 0),
  bedrooms numeric(3, 1) not null default 0,
  bathrooms numeric(3, 1) not null default 1,
  square_feet integer,
  available_date date,
  lease_term_months integer not null default 12,
  pets_allowed boolean not null default false,
  pet_policy text,
  utilities_included text[] not null default '{}',
  amenities text[] not null default '{}',
  featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index listings_status_idx on public.listings (status);
create index listings_featured_idx on public.listings (featured) where featured;

alter table public.listings enable row level security;

create trigger listings_updated_at
  before update on public.listings
  for each row execute function public.set_updated_at();

create policy "Public can read published listings"
  on public.listings for select
  to anon, authenticated
  using (status <> 'draft' or (select public.is_admin()));

create policy "Admins can insert listings"
  on public.listings for insert
  to authenticated
  with check ((select public.is_admin()));

create policy "Admins can update listings"
  on public.listings for update
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "Admins can delete listings"
  on public.listings for delete
  to authenticated
  using ((select public.is_admin()));

-- ============================================================
-- Listing photos
-- ============================================================
create table public.listing_photos (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings (id) on delete cascade,
  url text not null,
  storage_path text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index listing_photos_listing_idx on public.listing_photos (listing_id, sort_order);

alter table public.listing_photos enable row level security;

create policy "Public can read photos of published listings"
  on public.listing_photos for select
  to anon, authenticated
  using (
    exists (
      select 1 from public.listings l
      where l.id = listing_id
        and (l.status <> 'draft' or (select public.is_admin()))
    )
  );

create policy "Admins can insert listing photos"
  on public.listing_photos for insert
  to authenticated
  with check ((select public.is_admin()));

create policy "Admins can update listing photos"
  on public.listing_photos for update
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "Admins can delete listing photos"
  on public.listing_photos for delete
  to authenticated
  using ((select public.is_admin()));

-- ============================================================
-- Applications (written only by the submit-application edge function)
-- ============================================================
create type public.application_status as enum (
  'pending_payment', 'submitted', 'under_review', 'approved', 'denied', 'withdrawn'
);

create table public.applications (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid references public.listings (id) on delete set null,
  status public.application_status not null default 'pending_payment',
  first_name text not null,
  last_name text not null,
  email text not null,
  phone text not null,
  desired_move_in date,
  adult_count integer not null check (adult_count between 1 and 10),
  fee_per_applicant_cents integer not null,
  fee_total_cents integer not null,
  stripe_session_id text unique,
  stripe_payment_intent_id text,
  paid_at timestamptz,
  data jsonb not null default '{}',
  document_paths text[] not null default '{}',
  admin_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index applications_status_idx on public.applications (status, created_at desc);
create index applications_listing_idx on public.applications (listing_id);

alter table public.applications enable row level security;

create trigger applications_updated_at
  before update on public.applications
  for each row execute function public.set_updated_at();

create policy "Admins can read applications"
  on public.applications for select
  to authenticated
  using ((select public.is_admin()));

create policy "Admins can update applications"
  on public.applications for update
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "Admins can delete applications"
  on public.applications for delete
  to authenticated
  using ((select public.is_admin()));

-- ============================================================
-- Showing requests
-- ============================================================
create type public.showing_status as enum ('new', 'scheduled', 'completed', 'canceled');

create table public.showing_requests (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid references public.listings (id) on delete set null,
  name text not null check (char_length(name) between 1 and 200),
  email text not null check (char_length(email) between 3 and 320),
  phone text check (char_length(phone) <= 50),
  preferred_date date,
  preferred_time text check (char_length(preferred_time) <= 50),
  message text check (char_length(message) <= 2000),
  status public.showing_status not null default 'new',
  created_at timestamptz not null default now()
);

create index showing_requests_created_idx on public.showing_requests (created_at desc);
create index showing_requests_listing_idx on public.showing_requests (listing_id);

alter table public.showing_requests enable row level security;

create policy "Anyone can request a showing"
  on public.showing_requests for insert
  to anon, authenticated
  with check (status = 'new');

create policy "Admins can read showing requests"
  on public.showing_requests for select
  to authenticated
  using ((select public.is_admin()));

create policy "Admins can update showing requests"
  on public.showing_requests for update
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "Admins can delete showing requests"
  on public.showing_requests for delete
  to authenticated
  using ((select public.is_admin()));

-- ============================================================
-- Contact messages
-- ============================================================
create table public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 200),
  email text not null check (char_length(email) between 3 and 320),
  phone text check (char_length(phone) <= 50),
  subject text check (char_length(subject) <= 200),
  message text not null check (char_length(message) between 1 and 5000),
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index contact_messages_created_idx on public.contact_messages (created_at desc);

alter table public.contact_messages enable row level security;

create policy "Anyone can send a contact message"
  on public.contact_messages for insert
  to anon, authenticated
  with check (is_read = false);

create policy "Admins can read contact messages"
  on public.contact_messages for select
  to authenticated
  using ((select public.is_admin()));

create policy "Admins can update contact messages"
  on public.contact_messages for update
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "Admins can delete contact messages"
  on public.contact_messages for delete
  to authenticated
  using ((select public.is_admin()));

-- ============================================================
-- Storage
-- ============================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('listing-photos', 'listing-photos', true, 10485760,
    array['image/jpeg', 'image/png', 'image/webp']),
  ('application-documents', 'application-documents', false, 10485760,
    array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'application/pdf']);

create policy "Admins can upload listing photos"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'listing-photos' and (select public.is_admin()));

create policy "Admins can update listing photos"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'listing-photos' and (select public.is_admin()));

create policy "Admins can delete listing photos"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'listing-photos' and (select public.is_admin()));

-- Applicants upload documents anonymously (insert only, never read back).
create policy "Anyone can upload application documents"
  on storage.objects for insert
  to anon, authenticated
  with check (bucket_id = 'application-documents');

create policy "Admins can read application documents"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'application-documents' and (select public.is_admin()));

create policy "Admins can delete application documents"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'application-documents' and (select public.is_admin()));
