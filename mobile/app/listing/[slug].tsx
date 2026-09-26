import { useState } from "react";
import { Dimensions, Linking, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BackButton } from "@/components/Logo";
import { PropertyMap } from "@/components/PropertyMap";
import { ShowingForm } from "@/components/ShowingForm";
import { Badge, Button, Loader } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { useListing, useSiteSettings } from "@/lib/queries";
import { availabilityLabel, formatCurrency, fullAddress, propertyTypeLabels } from "@/lib/format";
import { colors, fonts, shadow } from "@/theme";

const WIDTH = Dimensions.get("window").width;

export default function ListingDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { data: listing, isLoading } = useListing(slug);
  const { data: settings } = useSiteSettings();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [photoIndex, setPhotoIndex] = useState<number | null>(null);
  const [showing, setShowing] = useState(false);

  if (isLoading) return <Loader />;
  if (!listing) {
    return (
      <View style={styles.missing}>
        <Text style={styles.missingTitle}>This listing is no longer available.</Text>
        <Button label="Back to rentals" onPress={() => router.back()} />
      </View>
    );
  }

  const canApply = listing.status === "available" || listing.status === "pending";
  const photos = listing.listing_photos;

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          style={{ height: 340 }}
        >
          {(photos.length ? photos : [{ id: "empty", url: "" }]).map((photo, index) => (
            <Pressable key={photo.id} onPress={() => photo.url && setPhotoIndex(index)}>
              {photo.url ? (
                <Image source={{ uri: photo.url }} style={{ width: WIDTH, height: 340 }} contentFit="cover" />
              ) : (
                <View style={[styles.photoEmpty, { width: WIDTH }]}><Text style={styles.muted}>Photos coming soon</Text></View>
              )}
            </Pressable>
          ))}
        </ScrollView>
        <View style={[styles.back, { top: insets.top + 8 }]}><BackButton light /></View>

        <View style={styles.body}>
          <View style={styles.badgeRow}>
            <Badge label={listing.status === "available" ? "Available" : "Application pending"} tone={listing.status === "available" ? "green" : "amber"} />
            <Badge label={propertyTypeLabels[listing.property_type]} tone="navy" />
          </View>
          <Text style={styles.title}>{listing.title}</Text>
          <Text style={styles.address}>{fullAddress(listing)}</Text>
          <Text style={styles.price}>{formatCurrency(listing.rent_cents)}<Text style={styles.per}> /month</Text></Text>
          <Text style={styles.available}>{availabilityLabel(listing.available_date)}</Text>

          <View style={styles.facts}>
            <Fact icon="bed.double.fill" label="Beds" value={Number(listing.bedrooms) === 0 ? "Studio" : String(Number(listing.bedrooms))} />
            <Fact icon="shower.fill" label="Baths" value={String(Number(listing.bathrooms))} />
            <Fact icon="ruler" label="Sq ft" value={listing.square_feet ? listing.square_feet.toLocaleString() : "—"} />
            <Fact icon="pawprint.fill" label="Pets" value={listing.pets_allowed ? "OK" : "No"} />
          </View>

          <Text style={styles.section}>About this home</Text>
          <Text style={styles.copy}>{listing.description}</Text>

          {listing.amenities.length > 0 ? (
            <>
              <Text style={styles.section}>Features</Text>
              {listing.amenities.map((amenity) => (
                <View key={amenity} style={styles.amenity}>
                  <Icon name="checkmark.circle.fill" color={colors.gold700} size={18} />
                  <Text style={styles.copy}>{amenity}</Text>
                </View>
              ))}
            </>
          ) : null}

          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>Utilities included</Text>
            <Text style={styles.copy}>{listing.utilities_included.length ? listing.utilities_included.join(", ") : "Tenant pays all utilities."}</Text>
            <Text style={[styles.infoTitle, { marginTop: 14 }]}>Pet policy</Text>
            <Text style={styles.copy}>{listing.pet_policy || (listing.pets_allowed ? "Pets allowed." : "No pets.")}</Text>
            <Text style={[styles.infoTitle, { marginTop: 14 }]}>Lease & deposit</Text>
            <Text style={styles.copy}>{listing.lease_term_months} month lease · {formatCurrency(listing.deposit_cents)} deposit</Text>
            {settings ? <Text style={styles.copy}>Application fee {formatCurrency(settings.application_fee_cents)} per adult</Text> : null}
          </View>

          {listing.latitude != null && listing.longitude != null ? (
            <PropertyMap
              style={styles.map}
              scrollEnabled={false}
              points={[{ id: listing.id, latitude: listing.latitude, longitude: listing.longitude, title: listing.title }]}
            />
          ) : null}

          {settings ? (
            <Pressable style={styles.call} onPress={() => Linking.openURL(`tel:${settings.phone}`)}>
              <Icon name="phone.fill" color={colors.gold700} size={18} />
              <View>
                <Text style={styles.muted}>Questions? Call us</Text>
                <Text style={styles.callNumber}>{settings.phone}</Text>
              </View>
            </Pressable>
          ) : null}
        </View>
      </ScrollView>

      <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <View style={{ flex: 1 }}>
          <Button label="Request showing" variant="outline" onPress={() => setShowing(true)} />
        </View>
        <View style={{ flex: 1 }}>
          <Button label="Apply" variant="gold" disabled={!canApply} onPress={() => router.push(`/apply/${listing.slug}`)} />
        </View>
      </View>

      <Modal visible={photoIndex !== null} animationType="fade" onRequestClose={() => setPhotoIndex(null)}>
        <View style={styles.lightbox}>
          <Pressable style={[styles.close, { top: insets.top + 8 }]} onPress={() => setPhotoIndex(null)}>
            <Icon name="xmark" color={colors.white} size={22} />
          </Pressable>
          {photoIndex !== null ? <Image source={{ uri: photos[photoIndex].url }} style={styles.lightboxImage} contentFit="contain" /> : null}
          <View style={styles.lightboxNav}>
            <Pressable onPress={() => setPhotoIndex((index) => (index === null ? index : (index - 1 + photos.length) % photos.length))}><Icon name="chevron.left" color={colors.white} size={28} /></Pressable>
            <Text style={styles.lightboxCount}>{photoIndex !== null ? `${photoIndex + 1} / ${photos.length}` : ""}</Text>
            <Pressable onPress={() => setPhotoIndex((index) => (index === null ? index : (index + 1) % photos.length))}><Icon name="chevron.right" color={colors.white} size={28} /></Pressable>
          </View>
        </View>
      </Modal>

      <Modal visible={showing} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowing(false)}>
        <ScrollView contentContainerStyle={styles.sheet}>
          <Text style={styles.sheetTitle}>Schedule a showing</Text>
          <Text style={styles.copy}>Tell us when works and we'll confirm a time to tour {listing.address_line1}.</Text>
          <ShowingForm listingId={listing.id} onDone={() => setShowing(false)} />
        </ScrollView>
      </Modal>
    </View>
  );
}

function Fact({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={styles.fact}>
      <Icon name={icon} color={colors.navy700} size={18} />
      <Text style={styles.muted}>{label}</Text>
      <Text style={styles.factValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.slate50 },
  back: { position: "absolute", left: 16 },
  body: { padding: 20, gap: 8 },
  badgeRow: { flexDirection: "row", gap: 8 },
  title: { fontFamily: fonts.serif, fontSize: 32, color: colors.navy900, marginTop: 8 },
  address: { fontFamily: fonts.sans, color: colors.slate600, lineHeight: 22 },
  price: { fontFamily: fonts.serif, fontSize: 34, color: colors.navy900, marginTop: 8 },
  per: { fontFamily: fonts.sans, fontSize: 16, color: colors.slate500 },
  available: { fontFamily: fonts.semibold, color: colors.emerald },
  facts: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 12 },
  fact: { width: "47%", backgroundColor: colors.white, borderRadius: 16, padding: 12, gap: 2, ...shadow },
  factValue: { fontFamily: fonts.semibold, color: colors.navy900, fontSize: 16 },
  section: { fontFamily: fonts.serif, fontSize: 24, color: colors.navy900, marginTop: 18 },
  copy: { fontFamily: fonts.sans, color: colors.slate700, lineHeight: 22 },
  amenity: { flexDirection: "row", alignItems: "center", gap: 8 },
  infoCard: { backgroundColor: colors.white, borderRadius: 20, padding: 16, marginTop: 8, ...shadow },
  infoTitle: { fontFamily: fonts.semibold, color: colors.navy900, marginBottom: 4 },
  map: { height: 220, borderRadius: 20, marginTop: 16, overflow: "hidden" },
  call: { marginTop: 16, backgroundColor: colors.white, borderRadius: 18, padding: 14, flexDirection: "row", gap: 12, alignItems: "center", ...shadow },
  callNumber: { fontFamily: fonts.semibold, color: colors.navy900, fontSize: 16 },
  muted: { fontFamily: fonts.sans, color: colors.slate500 },
  bar: { position: "absolute", left: 0, right: 0, bottom: 0, backgroundColor: colors.white, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.slate200, flexDirection: "row", gap: 10, padding: 12 },
  missing: { flex: 1, justifyContent: "center", padding: 24, gap: 16, backgroundColor: colors.slate50 },
  missingTitle: { fontFamily: fonts.serif, fontSize: 28, color: colors.navy900 },
  photoEmpty: { height: 340, backgroundColor: colors.slate100, alignItems: "center", justifyContent: "center" },
  lightbox: { flex: 1, backgroundColor: colors.navy950, justifyContent: "center" },
  lightboxImage: { width: "100%", height: "70%" },
  close: { position: "absolute", right: 16, zIndex: 2, width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center" },
  lightboxNav: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 24 },
  lightboxCount: { color: colors.white, fontFamily: fonts.medium },
  sheet: { padding: 20, gap: 12, backgroundColor: colors.slate50 },
  sheetTitle: { fontFamily: fonts.serif, fontSize: 30, color: colors.navy900, marginTop: 12 },
});
