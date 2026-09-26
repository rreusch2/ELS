import { useEffect } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import { Link } from "react-router";
import "leaflet/dist/leaflet.css";
import type { Listing } from "@/lib/types";
import { formatBaths, formatBeds, formatCurrency } from "@/lib/format";

const HENDERSON: [number, number] = [37.8362, -87.5901];

function priceIcon(label: string) {
  return L.divIcon({
    className: "price-marker",
    html: `<div style="transform:translate(-50%,-100%);display:inline-block;white-space:nowrap;background:#1b2b44;color:#fff;font:600 12px Inter,sans-serif;padding:5px 10px;border-radius:999px;box-shadow:0 4px 12px rgba(15,26,44,.3);border:2px solid #cfa75c">${label}</div>`,
    iconSize: [0, 0],
  });
}

const pinIcon = L.divIcon({
  className: "price-marker",
  html: `<svg style="transform:translate(-50%,-100%)" width="34" height="44" viewBox="0 0 34 44"><path d="M17 0C7.6 0 0 7.6 0 17c0 12.7 17 27 17 27s17-14.3 17-27C34 7.6 26.4 0 17 0z" fill="#1b2b44"/><circle cx="17" cy="17" r="7" fill="#cfa75c"/></svg>`,
  iconSize: [0, 0],
});

function FitBounds({ points }: { points: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length > 1) map.fitBounds(points, { padding: [48, 48] });
    else if (points.length === 1) map.setView(points[0], 15);
  }, [map, points]);
  return null;
}

export function ListingsMap({ listings, className = "h-[600px]" }: { listings: Listing[]; className?: string }) {
  const mapped = listings.filter((l) => l.latitude != null && l.longitude != null);
  const points = mapped.map((l) => [l.latitude!, l.longitude!] as [number, number]);

  return (
    <div className={`isolate overflow-hidden rounded-2xl border border-slate-200 ${className}`}>
      <MapContainer center={HENDERSON} zoom={13} scrollWheelZoom={false} className="h-full w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds points={points} />
        {mapped.map((l) => (
          <Marker key={l.id} position={[l.latitude!, l.longitude!]} icon={priceIcon(formatCurrency(l.rent_cents))}>
            <Popup>
              <div className="w-52">
                {l.listing_photos[0] && (
                  <img src={l.listing_photos[0].url} alt="" className="mb-2 h-28 w-full rounded-md object-cover" />
                )}
                <p className="font-semibold text-navy-900">{l.title}</p>
                <p className="text-xs text-slate-500">
                  {formatBeds(l.bedrooms)} · {formatBaths(l.bathrooms)} · {formatCurrency(l.rent_cents)}/mo
                </p>
                <Link to={`/listings/${l.slug}`} className="mt-1 inline-block text-xs font-semibold text-gold-700">
                  View details →
                </Link>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

export function SingleLocationMap({ lat, lng, className = "h-72" }: { lat: number; lng: number; className?: string }) {
  return (
    <div className={`isolate overflow-hidden rounded-2xl border border-slate-200 ${className}`}>
      <MapContainer center={[lat, lng]} zoom={15} scrollWheelZoom={false} className="h-full w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[lat, lng]} icon={pinIcon} />
      </MapContainer>
    </div>
  );
}
