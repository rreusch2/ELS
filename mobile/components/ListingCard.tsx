import { Pressable, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import type { Listing } from "@/lib/types";
import { availabilityLabel, formatBaths, formatBeds, formatCurrency, propertyTypeLabels } from "@/lib/format";
import { colors, fonts, shadow } from "@/theme";
import { Icon } from "./Icon";

export function ListingCard({ listing, width }: { listing: Listing; width?: number }) {
  const router = useRouter();
  const photo = listing.listing_photos[0]?.url;

  return (
    <Pressable
      onPress={() => router.push(`/listing/${listing.slug}`)}
      style={[styles.card, width ? { width } : null, shadow]}
    >
      <View style={styles.photoWrap}>
        {photo ? (
          <Image source={{ uri: photo }} style={styles.photo} contentFit="cover" transition={200} />
        ) : (
          <View style={[styles.photo, styles.photoEmpty]}>
            <Text style={styles.empty}>Photos coming soon</Text>
          </View>
        )}
        <View style={styles.badgeRow}>
          <Text style={styles.type}>{propertyTypeLabels[listing.property_type]}</Text>
          {listing.status === "pending" ? <Text style={styles.pending}>Application pending</Text> : null}
        </View>
        <View style={styles.priceBar}>
          <Text style={styles.price}>
            {formatCurrency(listing.rent_cents)}
            <Text style={styles.per}> /mo</Text>
          </Text>
        </View>
      </View>
      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={1}>{listing.title}</Text>
        <View style={styles.meta}>
          <Icon name="mappin" color={colors.slate500} size={13} />
          <Text style={styles.address} numberOfLines={1}>{listing.address_line1}</Text>
        </View>
        <View style={styles.facts}>
          <Fact icon="bed.double.fill" label={formatBeds(listing.bedrooms)} />
          <Fact icon="shower.fill" label={formatBaths(listing.bathrooms)} />
          {listing.square_feet ? <Fact icon="ruler" label={`${listing.square_feet.toLocaleString()} sqft`} /> : null}
          {listing.pets_allowed ? <Fact icon="pawprint.fill" label="Pets" /> : null}
        </View>
        <Text style={styles.available}>{availabilityLabel(listing.available_date)}</Text>
      </View>
    </Pressable>
  );
}

function Fact({ icon, label }: { icon: string; label: string }) {
  return (
    <View style={styles.fact}>
      <Icon name={icon} color={colors.navy400} size={14} />
      <Text style={styles.factText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.white, borderRadius: 22, overflow: "hidden" },
  photoWrap: { height: 210, backgroundColor: colors.slate100 },
  photo: { width: "100%", height: "100%" },
  photoEmpty: { alignItems: "center", justifyContent: "center" },
  empty: { color: colors.slate400, fontFamily: fonts.medium },
  badgeRow: { position: "absolute", top: 12, left: 12, right: 12, flexDirection: "row", justifyContent: "space-between" },
  type: { backgroundColor: "rgba(255,255,255,0.95)", color: colors.navy900, fontFamily: fonts.semibold, fontSize: 12, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, overflow: "hidden" },
  pending: { backgroundColor: "#fbbf24", color: "#451a03", fontFamily: fonts.semibold, fontSize: 12, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, overflow: "hidden" },
  priceBar: { position: "absolute", left: 0, right: 0, bottom: 0, padding: 14, paddingTop: 28 },
  price: { color: colors.white, fontFamily: fonts.serif, fontSize: 26 },
  per: { fontFamily: fonts.sans, fontSize: 14 },
  body: { padding: 16, gap: 8 },
  title: { fontFamily: fonts.semibold, fontSize: 17, color: colors.navy900 },
  meta: { flexDirection: "row", alignItems: "center", gap: 4 },
  address: { flex: 1, color: colors.slate500, fontFamily: fonts.sans, fontSize: 13 },
  facts: { flexDirection: "row", flexWrap: "wrap", gap: 12, paddingTop: 8, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.slate200 },
  fact: { flexDirection: "row", alignItems: "center", gap: 4 },
  factText: { fontFamily: fonts.medium, color: colors.slate600, fontSize: 13 },
  available: { fontFamily: fonts.semibold, color: colors.emerald, fontSize: 13 },
});
