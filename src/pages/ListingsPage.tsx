import { useMemo } from "react";
import { useSearchParams } from "react-router";
import { LayoutGrid, Map as MapIcon, RotateCcw, Search } from "lucide-react";
import clsx from "clsx";
import { ListingCard } from "@/components/ListingCard";
import { ListingsMap } from "@/components/ListingMap";
import { PageHero, PageLoader } from "@/components/ui";
import { useListings } from "@/lib/queries";
import { propertyTypeLabels } from "@/lib/format";
import type { PropertyType } from "@/lib/types";

const SORTS = {
  newest: "Newest",
  price_asc: "Price: Low to High",
  price_desc: "Price: High to Low",
  beds_desc: "Most Bedrooms",
} as const;
type SortKey = keyof typeof SORTS;

export function ListingsPage() {
  const { data: listings, isLoading, error } = useListings();
  const [params, setParams] = useSearchParams();

  const q = params.get("q") ?? "";
  const beds = params.get("beds") ?? "";
  const baths = params.get("baths") ?? "";
  const maxRent = params.get("maxRent") ?? "";
  const type = params.get("type") ?? "";
  const pets = params.get("pets") === "1";
  const sort = (params.get("sort") as SortKey) || "newest";
  const view = params.get("view") === "map" ? "map" : "grid";

  function update(key: string, value: string) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  }

  const filtered = useMemo(() => {
    if (!listings) return [];
    const term = q.trim().toLowerCase();
    const result = listings.filter((l) => {
      if (term && ![l.title, l.address_line1, l.description, l.zip].some((f) => f?.toLowerCase().includes(term))) return false;
      if (beds && Number(l.bedrooms) < Number(beds)) return false;
      if (baths && Number(l.bathrooms) < Number(baths)) return false;
      if (maxRent && l.rent_cents > Number(maxRent) * 100) return false;
      if (type && l.property_type !== type) return false;
      if (pets && !l.pets_allowed) return false;
      return true;
    });
    return result.sort((a, b) => {
      switch (sort) {
        case "price_asc": return a.rent_cents - b.rent_cents;
        case "price_desc": return b.rent_cents - a.rent_cents;
        case "beds_desc": return Number(b.bedrooms) - Number(a.bedrooms);
        default: return b.created_at.localeCompare(a.created_at);
      }
    });
  }, [listings, q, beds, baths, maxRent, type, pets, sort]);

  const hasFilters = !!(q || beds || baths || maxRent || type || pets);

  return (
    <>
      <PageHero
        eyebrow="Available Rentals"
        title="Homes for rent in Henderson, KY"
        subtitle="Browse our current availability. Find one you love? Apply online in minutes."
        image="https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=2000&q=80"
      />

      <div className="sticky top-[72px] z-[900] border-b border-slate-200 bg-white/95 backdrop-blur md:top-[108px]">
        <div className="container-page flex flex-wrap items-center gap-3 py-4">
          <div className="relative min-w-[200px] flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              className="input pl-9"
              placeholder="Search by address or keyword"
              value={q}
              onChange={(e) => update("q", e.target.value)}
            />
          </div>
          <select className="input w-auto" value={beds} onChange={(e) => update("beds", e.target.value)} aria-label="Bedrooms">
            <option value="">Beds</option>
            {[1, 2, 3, 4].map((n) => <option key={n} value={n}>{n}+ beds</option>)}
          </select>
          <select className="input w-auto" value={baths} onChange={(e) => update("baths", e.target.value)} aria-label="Bathrooms">
            <option value="">Baths</option>
            {[1, 2, 3].map((n) => <option key={n} value={n}>{n}+ baths</option>)}
          </select>
          <select className="input w-auto" value={maxRent} onChange={(e) => update("maxRent", e.target.value)} aria-label="Max rent">
            <option value="">Max rent</option>
            {[800, 1000, 1250, 1500, 2000, 2500].map((n) => <option key={n} value={n}>${n.toLocaleString()}</option>)}
          </select>
          <select className="input w-auto" value={type} onChange={(e) => update("type", e.target.value)} aria-label="Property type">
            <option value="">All types</option>
            {(Object.keys(propertyTypeLabels) as PropertyType[]).map((t) => <option key={t} value={t}>{propertyTypeLabels[t]}</option>)}
          </select>
          <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm">
            <input type="checkbox" checked={pets} onChange={(e) => update("pets", e.target.checked ? "1" : "")} className="accent-navy-900" />
            Pet friendly
          </label>
          {hasFilters && (
            <button type="button" className="btn-ghost px-3" onClick={() => setParams({}, { replace: true })}>
              <RotateCcw className="h-4 w-4" /> Reset
            </button>
          )}
        </div>
      </div>

      <section className="container-page py-10">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <p className="text-sm text-slate-600">
            {isLoading ? "Loading…" : <><span className="font-semibold text-navy-900">{filtered.length}</span> {filtered.length === 1 ? "home" : "homes"} found</>}
          </p>
          <div className="flex items-center gap-3">
            <select className="input w-auto py-2" value={sort} onChange={(e) => update("sort", e.target.value === "newest" ? "" : e.target.value)} aria-label="Sort">
              {(Object.keys(SORTS) as SortKey[]).map((k) => <option key={k} value={k}>{SORTS[k]}</option>)}
            </select>
            <div className="flex rounded-lg border border-slate-300 p-1">
              {(["grid", "map"] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => update("view", v === "grid" ? "" : v)}
                  className={clsx(
                    "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition",
                    view === v ? "bg-navy-900 text-white" : "text-slate-600 hover:text-navy-900",
                  )}
                >
                  {v === "grid" ? <LayoutGrid className="h-4 w-4" /> : <MapIcon className="h-4 w-4" />}
                  {v === "grid" ? "Grid" : "Map"}
                </button>
              ))}
            </div>
          </div>
        </div>

        {isLoading ? (
          <PageLoader />
        ) : error ? (
          <p className="py-20 text-center text-red-600">We couldn't load listings right now. Please refresh the page.</p>
        ) : filtered.length === 0 ? (
          <div className="card py-20 text-center">
            <p className="text-lg font-semibold text-navy-900">No homes match your filters</p>
            <p className="mt-2 text-slate-600">Try adjusting your search, or contact us — new homes become available often.</p>
          </div>
        ) : view === "map" ? (
          <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
            <ListingsMap listings={filtered} className="h-[70vh] min-h-[500px]" />
            <div className="space-y-6 lg:max-h-[70vh] lg:overflow-y-auto lg:pr-2">
              {filtered.map((l) => <ListingCard key={l.id} listing={l} />)}
            </div>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((l) => <ListingCard key={l.id} listing={l} />)}
          </div>
        )}
      </section>
    </>
  );
}
