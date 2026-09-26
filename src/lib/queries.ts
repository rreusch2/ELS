import { useQuery } from "@tanstack/react-query";
import { supabase } from "./supabase";
import type { Listing, SiteSettings } from "./types";

const LISTING_SELECT = "*, listing_photos(*)";

function sortPhotos(listing: Listing): Listing {
  return {
    ...listing,
    listing_photos: [...(listing.listing_photos ?? [])].sort((a, b) => a.sort_order - b.sort_order),
  };
}

export function useListings() {
  return useQuery({
    queryKey: ["listings", "public"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("listings")
        .select(LISTING_SELECT)
        .in("status", ["available", "pending"])
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data as Listing[]).map(sortPhotos);
    },
  });
}

export function useFeaturedListings() {
  return useQuery({
    queryKey: ["listings", "featured"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("listings")
        .select(LISTING_SELECT)
        .in("status", ["available", "pending"])
        .order("featured", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(3);
      if (error) throw error;
      return (data as Listing[]).map(sortPhotos);
    },
  });
}

export function useListing(slug: string | undefined) {
  return useQuery({
    queryKey: ["listing", slug],
    enabled: !!slug,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("listings")
        .select(LISTING_SELECT)
        .eq("slug", slug!)
        .maybeSingle();
      if (error) throw error;
      return data ? sortPhotos(data as Listing) : null;
    },
  });
}

export function useSiteSettings() {
  return useQuery({
    queryKey: ["site_settings"],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase.from("site_settings").select("*").eq("id", 1).single();
      if (error) throw error;
      return data as SiteSettings;
    },
  });
}
