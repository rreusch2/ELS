import { Link } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ExternalLink, Pencil, Plus, Star, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { formatBaths, formatBeds, formatCurrency } from "@/lib/format";
import type { Listing } from "@/lib/types";
import { PageLoader } from "@/components/ui";
import { AdminPageHeader } from "./AdminLayout";
import { ListingStatusBadge } from "./badges";

export function AdminListingsPage() {
  const queryClient = useQueryClient();
  const { data: listings, isLoading } = useQuery({
    queryKey: ["admin", "listings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("listings")
        .select("*, listing_photos(*)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Listing[];
    },
  });

  const remove = useMutation({
    mutationFn: async (listing: Listing) => {
      const paths = listing.listing_photos.map((p) => p.storage_path).filter((p): p is string => !!p);
      if (paths.length) await supabase.storage.from("listing-photos").remove(paths);
      const { error } = await supabase.from("listings").delete().eq("id", listing.id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "listings"] }),
  });

  return (
    <>
      <AdminPageHeader
        title="Listings"
        subtitle="Add, edit, and manage your rental properties."
        actions={<Link to="/admin/listings/new" className="btn-primary"><Plus className="h-4 w-4" /> New listing</Link>}
      />

      {isLoading ? (
        <PageLoader />
      ) : !listings?.length ? (
        <div className="card p-12 text-center">
          <p className="font-semibold text-navy-900">No listings yet</p>
          <Link to="/admin/listings/new" className="btn-primary mt-4">Create your first listing</Link>
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50 text-xs tracking-wide text-slate-500 uppercase">
              <tr>
                <th className="px-5 py-3 font-medium">Property</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Rent</th>
                <th className="px-5 py-3 font-medium">Size</th>
                <th className="px-5 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {listings.map((l) => {
                const photo = [...l.listing_photos].sort((a, b) => a.sort_order - b.sort_order)[0];
                return (
                  <tr key={l.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        {photo ? (
                          <img src={photo.url} alt="" className="h-12 w-16 rounded-lg object-cover" />
                        ) : (
                          <div className="h-12 w-16 rounded-lg bg-slate-100" />
                        )}
                        <div>
                          <p className="flex items-center gap-1.5 font-medium text-navy-900">
                            {l.title}
                            {l.featured && <Star className="h-3.5 w-3.5 fill-gold-400 text-gold-400" />}
                          </p>
                          <p className="text-xs text-slate-500">{l.address_line1}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3"><ListingStatusBadge status={l.status} /></td>
                    <td className="px-5 py-3 font-medium">{formatCurrency(l.rent_cents)}</td>
                    <td className="px-5 py-3 text-slate-600">{formatBeds(l.bedrooms)} · {formatBaths(l.bathrooms)}</td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-1">
                        {l.status !== "draft" && (
                          <a href={`/listings/${l.slug}`} target="_blank" rel="noreferrer" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-navy-900" title="View on site">
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        )}
                        <Link to={`/admin/listings/${l.id}`} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-navy-900" title="Edit">
                          <Pencil className="h-4 w-4" />
                        </Link>
                        <button
                          type="button"
                          className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-600"
                          title="Delete"
                          onClick={() => {
                            if (confirm(`Delete "${l.title}"? This also deletes its photos and cannot be undone.`)) remove.mutate(l);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
