import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowLeft, ArrowUp, Trash2, Upload } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { propertyTypeLabels, listingStatusLabels, slugify } from "@/lib/format";
import type { Listing, ListingPhoto, ListingStatus, PropertyType } from "@/lib/types";
import { Alert, Field, PageLoader, Spinner } from "@/components/ui";
import { AdminPageHeader } from "./AdminLayout";

interface FormState {
  title: string;
  slug: string;
  description: string;
  property_type: PropertyType;
  status: ListingStatus;
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  zip: string;
  latitude: string;
  longitude: string;
  rent: string;
  deposit: string;
  bedrooms: string;
  bathrooms: string;
  square_feet: string;
  available_date: string;
  lease_term_months: string;
  pets_allowed: boolean;
  pet_policy: string;
  utilities_included: string;
  amenities: string;
  featured: boolean;
}

const emptyForm: FormState = {
  title: "",
  slug: "",
  description: "",
  property_type: "house",
  status: "draft",
  address_line1: "",
  address_line2: "",
  city: "Henderson",
  state: "KY",
  zip: "42420",
  latitude: "",
  longitude: "",
  rent: "",
  deposit: "",
  bedrooms: "2",
  bathrooms: "1",
  square_feet: "",
  available_date: "",
  lease_term_months: "12",
  pets_allowed: false,
  pet_policy: "",
  utilities_included: "",
  amenities: "",
  featured: false,
};

function toForm(l: Listing): FormState {
  return {
    title: l.title,
    slug: l.slug,
    description: l.description,
    property_type: l.property_type,
    status: l.status,
    address_line1: l.address_line1,
    address_line2: l.address_line2 ?? "",
    city: l.city,
    state: l.state,
    zip: l.zip,
    latitude: l.latitude?.toString() ?? "",
    longitude: l.longitude?.toString() ?? "",
    rent: (l.rent_cents / 100).toString(),
    deposit: l.deposit_cents != null ? (l.deposit_cents / 100).toString() : "",
    bedrooms: String(Number(l.bedrooms)),
    bathrooms: String(Number(l.bathrooms)),
    square_feet: l.square_feet?.toString() ?? "",
    available_date: l.available_date ?? "",
    lease_term_months: String(l.lease_term_months),
    pets_allowed: l.pets_allowed,
    pet_policy: l.pet_policy ?? "",
    utilities_included: l.utilities_included.join(", "),
    amenities: l.amenities.join("\n"),
    featured: l.featured,
  };
}

const toList = (value: string, sep: RegExp) => value.split(sep).map((s) => s.trim()).filter(Boolean);
const toNum = (value: string) => (value.trim() === "" ? null : Number(value));

export function AdminListingEditPage() {
  const { id } = useParams();
  const isNew = !id || id === "new";
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: listing, isLoading } = useQuery({
    queryKey: ["admin", "listing", id],
    enabled: !isNew,
    queryFn: async () => {
      const { data, error } = await supabase.from("listings").select("*, listing_photos(*)").eq("id", id!).single();
      if (error) throw error;
      return data as Listing;
    },
  });

  const [form, setForm] = useState<FormState>(emptyForm);
  const [slugTouched, setSlugTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (listing) {
      setForm(toForm(listing));
      setSlugTouched(true);
    }
  }, [listing]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setSaved(false);
    setForm((f) => {
      const next = { ...f, [key]: value };
      if (key === "title" && !slugTouched) next.slug = slugify(String(value));
      return next;
    });
  };

  async function submit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const payload = {
      title: form.title.trim(),
      slug: slugify(form.slug || form.title),
      description: form.description.trim(),
      property_type: form.property_type,
      status: form.status,
      address_line1: form.address_line1.trim(),
      address_line2: form.address_line2.trim() || null,
      city: form.city.trim(),
      state: form.state.trim().toUpperCase(),
      zip: form.zip.trim(),
      latitude: toNum(form.latitude),
      longitude: toNum(form.longitude),
      rent_cents: Math.round(Number(form.rent) * 100),
      deposit_cents: form.deposit ? Math.round(Number(form.deposit) * 100) : null,
      bedrooms: Number(form.bedrooms),
      bathrooms: Number(form.bathrooms),
      square_feet: toNum(form.square_feet),
      available_date: form.available_date || null,
      lease_term_months: Number(form.lease_term_months) || 12,
      pets_allowed: form.pets_allowed,
      pet_policy: form.pet_policy.trim() || null,
      utilities_included: toList(form.utilities_included, /,/),
      amenities: toList(form.amenities, /\n/),
      featured: form.featured,
    };

    const query = isNew
      ? supabase.from("listings").insert(payload).select("id").single()
      : supabase.from("listings").update(payload).eq("id", id!).select("id").single();

    const { data, error } = await query;
    setSaving(false);

    if (error) {
      setError(error.code === "23505" ? "Another listing already uses that URL slug. Please choose a different one." : error.message);
      return;
    }

    queryClient.invalidateQueries({ queryKey: ["admin"] });
    queryClient.invalidateQueries({ queryKey: ["listings"] });
    queryClient.invalidateQueries({ queryKey: ["listing"] });

    if (isNew) navigate(`/admin/listings/${data.id}`, { replace: true });
    else setSaved(true);
  }

  if (!isNew && isLoading) return <PageLoader />;

  return (
    <>
      <Link to="/admin/listings" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-navy-900">
        <ArrowLeft className="h-4 w-4" /> All listings
      </Link>
      <AdminPageHeader title={isNew ? "New listing" : form.title || "Edit listing"} />

      <form onSubmit={submit} className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <section className="card space-y-5 p-6">
            <h2 className="font-semibold">Details</h2>
            <Field label="Title" required><input className="input" required value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="e.g. Charming 3BR Craftsman near Downtown" /></Field>
            <Field label="URL slug" hint={`Listing URL: /listings/${form.slug || "…"}`}>
              <input className="input" value={form.slug} onChange={(e) => { setSlugTouched(true); set("slug", e.target.value); }} />
            </Field>
            <Field label="Description"><textarea className="input" rows={7} value={form.description} onChange={(e) => set("description", e.target.value)} /></Field>
            <div className="grid gap-5 sm:grid-cols-4">
              <Field label="Monthly rent ($)" required><input className="input" required type="number" min="0" step="1" value={form.rent} onChange={(e) => set("rent", e.target.value)} /></Field>
              <Field label="Deposit ($)"><input className="input" type="number" min="0" step="1" value={form.deposit} onChange={(e) => set("deposit", e.target.value)} /></Field>
              <Field label="Bedrooms" required><input className="input" required type="number" min="0" step="1" value={form.bedrooms} onChange={(e) => set("bedrooms", e.target.value)} /></Field>
              <Field label="Bathrooms" required><input className="input" required type="number" min="0" step="0.5" value={form.bathrooms} onChange={(e) => set("bathrooms", e.target.value)} /></Field>
              <Field label="Square feet"><input className="input" type="number" min="0" value={form.square_feet} onChange={(e) => set("square_feet", e.target.value)} /></Field>
              <Field label="Available date"><input className="input" type="date" value={form.available_date} onChange={(e) => set("available_date", e.target.value)} /></Field>
              <Field label="Lease (months)"><input className="input" type="number" min="1" value={form.lease_term_months} onChange={(e) => set("lease_term_months", e.target.value)} /></Field>
              <Field label="Property type">
                <select className="input" value={form.property_type} onChange={(e) => set("property_type", e.target.value as PropertyType)}>
                  {(Object.keys(propertyTypeLabels) as PropertyType[]).map((t) => <option key={t} value={t}>{propertyTypeLabels[t]}</option>)}
                </select>
              </Field>
            </div>
          </section>

          <section className="card space-y-5 p-6">
            <h2 className="font-semibold">Location</h2>
            <div className="grid gap-5 sm:grid-cols-6">
              <Field label="Street address" required className="sm:col-span-4"><input className="input" required value={form.address_line1} onChange={(e) => set("address_line1", e.target.value)} /></Field>
              <Field label="Unit" className="sm:col-span-2"><input className="input" value={form.address_line2} onChange={(e) => set("address_line2", e.target.value)} /></Field>
              <Field label="City" required className="sm:col-span-3"><input className="input" required value={form.city} onChange={(e) => set("city", e.target.value)} /></Field>
              <Field label="State" required className="sm:col-span-1"><input className="input" required maxLength={2} value={form.state} onChange={(e) => set("state", e.target.value)} /></Field>
              <Field label="ZIP" required className="sm:col-span-2"><input className="input" required value={form.zip} onChange={(e) => set("zip", e.target.value)} /></Field>
              <Field label="Latitude" className="sm:col-span-3" hint="Right-click the address in Google Maps to copy coordinates."><input className="input" type="number" step="any" value={form.latitude} onChange={(e) => set("latitude", e.target.value)} /></Field>
              <Field label="Longitude" className="sm:col-span-3"><input className="input" type="number" step="any" value={form.longitude} onChange={(e) => set("longitude", e.target.value)} /></Field>
            </div>
          </section>

          <section className="card space-y-5 p-6">
            <h2 className="font-semibold">Features & policies</h2>
            <Field label="Amenities" hint="One per line"><textarea className="input" rows={5} value={form.amenities} onChange={(e) => set("amenities", e.target.value)} placeholder={"Central air\nWasher/dryer hookups\nFenced yard"} /></Field>
            <Field label="Utilities included" hint="Comma separated, e.g. Water, Trash"><input className="input" value={form.utilities_included} onChange={(e) => set("utilities_included", e.target.value)} /></Field>
            <label className="flex items-center gap-2 text-sm font-medium text-navy-900">
              <input type="checkbox" className="h-4 w-4 accent-navy-900" checked={form.pets_allowed} onChange={(e) => set("pets_allowed", e.target.checked)} />
              Pets allowed
            </label>
            <Field label="Pet policy"><input className="input" value={form.pet_policy} onChange={(e) => set("pet_policy", e.target.value)} placeholder="e.g. Dogs under 40 lbs, $300 pet deposit" /></Field>
          </section>
        </div>

        <div className="space-y-6 xl:sticky xl:top-8 xl:self-start">
          <section className="card space-y-5 p-6">
            <h2 className="font-semibold">Publishing</h2>
            <Field label="Status" hint="Drafts are hidden from the public website.">
              <select className="input" value={form.status} onChange={(e) => set("status", e.target.value as ListingStatus)}>
                {(Object.keys(listingStatusLabels) as ListingStatus[]).map((s) => <option key={s} value={s}>{listingStatusLabels[s]}</option>)}
              </select>
            </Field>
            <label className="flex items-center gap-2 text-sm font-medium text-navy-900">
              <input type="checkbox" className="h-4 w-4 accent-navy-900" checked={form.featured} onChange={(e) => set("featured", e.target.checked)} />
              Feature on homepage
            </label>
            {error && <Alert>{error}</Alert>}
            {saved && <Alert tone="success">Changes saved.</Alert>}
            <button type="submit" className="btn-primary w-full" disabled={saving}>
              {saving && <Spinner className="h-4 w-4" />} {isNew ? "Create listing" : "Save changes"}
            </button>
          </section>

          {isNew ? (
            <section className="card p-6 text-sm text-slate-600">Save the listing first, then you can upload photos.</section>
          ) : (
            listing && <PhotoManager listingId={listing.id} photos={listing.listing_photos} />
          )}
        </div>
      </form>
    </>
  );
}

function PhotoManager({ listingId, photos: initial }: { listingId: string; photos: ListingPhoto[] }) {
  const queryClient = useQueryClient();
  const [photos, setPhotos] = useState(() => [...initial].sort((a, b) => a.sort_order - b.sort_order));
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["admin"] });
    queryClient.invalidateQueries({ queryKey: ["listings"] });
    queryClient.invalidateQueries({ queryKey: ["listing"] });
  };

  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    setError(null);
    let order = photos.length ? Math.max(...photos.map((p) => p.sort_order)) + 1 : 0;
    const added: ListingPhoto[] = [];

    for (const file of Array.from(files)) {
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
      const path = `${listingId}/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("listing-photos").upload(path, file, { contentType: file.type });
      if (upErr) {
        setError(`${file.name}: ${upErr.message}`);
        continue;
      }
      const { data: pub } = supabase.storage.from("listing-photos").getPublicUrl(path);
      const { data: row, error: rowErr } = await supabase
        .from("listing_photos")
        .insert({ listing_id: listingId, url: pub.publicUrl, storage_path: path, sort_order: order++ })
        .select()
        .single();
      if (rowErr) setError(rowErr.message);
      else added.push(row as ListingPhoto);
    }

    setPhotos((p) => [...p, ...added]);
    setUploading(false);
    refresh();
  }

  async function remove(photo: ListingPhoto) {
    if (!confirm("Delete this photo?")) return;
    if (photo.storage_path) await supabase.storage.from("listing-photos").remove([photo.storage_path]);
    await supabase.from("listing_photos").delete().eq("id", photo.id);
    setPhotos((p) => p.filter((x) => x.id !== photo.id));
    refresh();
  }

  async function move(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= photos.length) return;
    const next = [...photos];
    [next[index], next[target]] = [next[target], next[index]];
    const reordered = next.map((p, i) => ({ ...p, sort_order: i }));
    setPhotos(reordered);
    await Promise.all(
      [reordered[index], reordered[target]].map((p) =>
        supabase.from("listing_photos").update({ sort_order: p.sort_order }).eq("id", p.id),
      ),
    );
    refresh();
  }

  return (
    <section className="card space-y-4 p-6">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Photos</h2>
        <span className="text-xs text-slate-500">First photo is the cover</span>
      </div>

      {photos.length > 0 && (
        <ul className="space-y-2">
          {photos.map((p, i) => (
            <li key={p.id} className="flex items-center gap-3 rounded-lg border border-slate-200 p-2">
              <img src={p.url} alt="" className="h-14 w-20 rounded-md object-cover" />
              <span className="flex-1 text-xs text-slate-500">{i === 0 ? "Cover photo" : `Photo ${i + 1}`}</span>
              <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="rounded p-1.5 text-slate-500 hover:bg-slate-100 disabled:opacity-30" aria-label="Move up"><ArrowUp className="h-4 w-4" /></button>
              <button type="button" onClick={() => move(i, 1)} disabled={i === photos.length - 1} className="rounded p-1.5 text-slate-500 hover:bg-slate-100 disabled:opacity-30" aria-label="Move down"><ArrowDown className="h-4 w-4" /></button>
              <button type="button" onClick={() => remove(p)} className="rounded p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-600" aria-label="Delete photo"><Trash2 className="h-4 w-4" /></button>
            </li>
          ))}
        </ul>
      )}

      <label className="flex cursor-pointer flex-col items-center rounded-xl border-2 border-dashed border-slate-300 px-4 py-6 text-center hover:border-navy-400 hover:bg-navy-50/40">
        {uploading ? <Spinner className="h-6 w-6 text-navy-500" /> : <Upload className="h-6 w-6 text-navy-400" />}
        <span className="mt-2 text-sm font-semibold text-navy-900">{uploading ? "Uploading…" : "Upload photos"}</span>
        <span className="text-xs text-slate-500">JPG, PNG, or WebP up to 10 MB</span>
        <input type="file" multiple accept="image/jpeg,image/png,image/webp" className="sr-only" disabled={uploading} onChange={(e) => { upload(e.target.files); e.target.value = ""; }} />
      </label>
      {error && <Alert>{error}</Alert>}
    </section>
  );
}
