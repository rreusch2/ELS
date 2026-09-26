import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { Image } from "expo-image";
import { Badge, Button, Loader } from "@/components/ui";
import { supabase } from "@/lib/supabase";
import { formatCurrency, listingStatusLabels } from "@/lib/format";
import type { Listing, ListingStatus } from "@/lib/types";
import { colors, fonts } from "@/theme";

const tone = (status: ListingStatus) => (status === "available" ? "green" : status === "pending" ? "amber" : status === "rented" ? "navy" : "gray");

export default function StaffListingsScreen() {
  const router = useRouter();
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "listings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("listings").select("*, listing_photos(*)").order("created_at", { ascending: false });
      if (error) throw error;
      return data as Listing[];
    },
  });

  if (isLoading) return <Loader />;

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Button label="New listing" onPress={() => router.push("/staff/listing/new")} />
      {data?.map((listing) => {
        const photo = [...listing.listing_photos].sort((a, b) => a.sort_order - b.sort_order)[0];
        return (
          <Pressable key={listing.id} style={styles.card} onPress={() => router.push(`/staff/listing/${listing.id}`)}>
            {photo ? <Image source={{ uri: photo.url }} style={styles.photo} contentFit="cover" /> : <View style={styles.photo} />}
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={styles.title} numberOfLines={1}>{listing.title}</Text>
              <Text style={styles.meta}>{formatCurrency(listing.rent_cents)}/mo</Text>
              <Badge label={listingStatusLabels[listing.status]} tone={tone(listing.status)} />
            </View>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 12, paddingBottom: 32 },
  card: { backgroundColor: colors.white, borderRadius: 16, padding: 10, flexDirection: "row", gap: 12, alignItems: "center" },
  photo: { width: 84, height: 68, borderRadius: 12, backgroundColor: colors.slate100 },
  title: { fontFamily: fonts.semibold, color: colors.navy900 },
  meta: { fontFamily: fonts.sans, color: colors.slate500 },
});
