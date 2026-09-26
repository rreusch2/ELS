import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ListingCard } from "@/components/ListingCard";
import { Logo } from "@/components/Logo";
import { Button, Loader } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { useFeaturedListings, useListings } from "@/lib/queries";
import { colors, fonts, shadow } from "@/theme";

const HERO = "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1600&q=80";

const BEDS = [
  { label: "Any", value: "" },
  { label: "1+", value: "1" },
  { label: "2+", value: "2" },
  { label: "3+", value: "3" },
  { label: "4+", value: "4" },
];
const RENTS = [
  { label: "Any", value: "" },
  { label: "$1,000", value: "1000" },
  { label: "$1,500", value: "1500" },
  { label: "$2,000", value: "2000" },
];

const WHY = [
  { icon: "heart.fill", title: "Locally owned", text: "When you call, you reach a neighbor in Henderson — not a national call center." },
  { icon: "wrench.and.screwdriver.fill", title: "Fast maintenance", text: "Requests are handled by local pros, with 24/7 emergency response." },
  { icon: "checkmark.shield.fill", title: "Move-in ready", text: "Every home is inspected and cleaned before you get the keys." },
  { icon: "creditcard.fill", title: "Apply in minutes", text: "Browse, apply, and pay the application fee from your phone." },
];

const STEPS = [
  { icon: "magnifyingglass", title: "Find a home", text: "Browse rentals and request a showing." },
  { icon: "doc.text.fill", title: "Apply", text: "Finish the secure application in about 15 minutes." },
  { icon: "creditcard.fill", title: "Pay the fee", text: "$50 per adult, paid securely by card." },
  { icon: "key.fill", title: "Get the keys", text: "Most applications are reviewed in 2–3 business days." },
];

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { data: featured, isLoading } = useFeaturedListings();
  const { data: all } = useListings();
  const [beds, setBeds] = useState("");
  const [maxRent, setMaxRent] = useState("");
  const available = all?.filter((listing) => listing.status === "available").length;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ paddingBottom: 28 }} showsVerticalScrollIndicator={false}>
      <View style={styles.hero}>
        <Image source={{ uri: HERO }} style={StyleSheet.absoluteFill} contentFit="cover" />
        <LinearGradient colors={["rgba(15,26,44,0.82)", "rgba(15,26,44,0.35)", "rgba(15,26,44,0.88)"]} style={StyleSheet.absoluteFill} />
        <View style={{ paddingTop: insets.top + 12, paddingHorizontal: 20 }}>
          <Logo light />
          <Text style={styles.kicker}>Henderson, Kentucky</Text>
          <Text style={styles.headline}>A place you'll be proud to call home.</Text>
          <Text style={styles.lede}>Quality houses, townhomes, and apartments, managed by a local team that picks up the phone.</Text>
        </View>
      </View>

      <View style={styles.searchCard}>
        <Text style={styles.searchLabel}>Bedrooms</Text>
        <View style={styles.chips}>
          {BEDS.map((option) => (
            <Chip key={option.label} label={option.label} active={beds === option.value} onPress={() => setBeds(option.value)} />
          ))}
        </View>
        <Text style={[styles.searchLabel, { marginTop: 14 }]}>Max rent</Text>
        <View style={styles.chips}>
          {RENTS.map((option) => (
            <Chip key={option.label} label={option.label} active={maxRent === option.value} onPress={() => setMaxRent(option.value)} />
          ))}
        </View>
        <View style={{ marginTop: 16 }}>
          <Button
            label="Search rentals"
            variant="gold"
            icon="magnifyingglass"
            onPress={() => router.push({ pathname: "/listings", params: { beds, maxRent } })}
          />
        </View>
        {available != null ? <Text style={styles.count}>{available} homes available now</Text> : null}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHead}>
          <View>
            <Text style={styles.eyebrow}>Featured</Text>
            <Text style={styles.sectionTitle}>Homes available now</Text>
          </View>
          <Pressable onPress={() => router.push("/listings")}>
            <Text style={styles.link}>See all</Text>
          </Pressable>
        </View>
        {isLoading ? (
          <Loader />
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.carousel}>
            {featured?.map((listing) => <ListingCard key={listing.id} listing={listing} width={280} />)}
          </ScrollView>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.eyebrow}>Why ELS</Text>
        <Text style={styles.sectionTitle}>Renting, the way it should be</Text>
        <View style={styles.whyGrid}>
          {WHY.map((item) => (
            <View key={item.title} style={styles.whyCard}>
              <View style={styles.whyIcon}>
                <Icon name={item.icon} color={colors.gold300} size={20} />
              </View>
              <Text style={styles.whyTitle}>{item.title}</Text>
              <Text style={styles.whyText}>{item.text}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.steps}>
        <Text style={[styles.eyebrow, { color: colors.gold300 }]}>How it works</Text>
        <Text style={[styles.sectionTitle, { color: colors.white }]}>From search to keys</Text>
        {STEPS.map((step, index) => (
          <View key={step.title} style={styles.step}>
            <View style={styles.stepNum}><Text style={styles.stepNumText}>{index + 1}</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.stepTitle}>{step.title}</Text>
              <Text style={styles.stepText}>{step.text}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <View style={styles.cta}>
          <Text style={styles.ctaTitle}>Ready to find your next home?</Text>
          <Text style={styles.ctaText}>Browse what's available, or send us a note and we'll help you find the right fit.</Text>
          <Button label="Browse rentals" variant="gold" onPress={() => router.push("/listings")} />
        </View>
      </View>
    </ScrollView>
  );
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, active && styles.chipOn]}>
      <Text style={[styles.chipText, active && styles.chipTextOn]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.slate50 },
  hero: { minHeight: 460, justifyContent: "flex-end", paddingBottom: 78 },
  kicker: { marginTop: 28, fontFamily: fonts.semibold, color: colors.gold300, letterSpacing: 2, fontSize: 12, textTransform: "uppercase" },
  headline: { marginTop: 10, fontFamily: fonts.serif, color: colors.white, fontSize: 40, lineHeight: 46 },
  lede: { marginTop: 12, color: colors.navy100, fontFamily: fonts.sans, fontSize: 16, lineHeight: 24, maxWidth: 340 },
  searchCard: { marginTop: -48, marginHorizontal: 16, backgroundColor: colors.white, borderRadius: 24, padding: 18, ...shadow },
  searchLabel: { fontFamily: fonts.semibold, color: colors.navy900, marginBottom: 8 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { borderRadius: 999, borderWidth: 1, borderColor: colors.slate200, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: colors.slate50 },
  chipOn: { backgroundColor: colors.navy900, borderColor: colors.navy900 },
  chipText: { fontFamily: fonts.medium, color: colors.slate600 },
  chipTextOn: { color: colors.white },
  count: { marginTop: 12, textAlign: "center", color: colors.slate500, fontFamily: fonts.medium },
  section: { paddingHorizontal: 20, paddingTop: 32 },
  sectionHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 14 },
  eyebrow: { fontFamily: fonts.semibold, color: colors.gold700, letterSpacing: 2, fontSize: 11, textTransform: "uppercase" },
  sectionTitle: { fontFamily: fonts.serif, fontSize: 28, color: colors.navy900, marginTop: 4 },
  link: { fontFamily: fonts.semibold, color: colors.navy700 },
  carousel: { gap: 14, paddingRight: 20, paddingBottom: 8 },
  whyGrid: { marginTop: 16, gap: 12 },
  whyCard: { backgroundColor: colors.white, borderRadius: 20, padding: 16, ...shadow },
  whyIcon: { width: 42, height: 42, borderRadius: 12, backgroundColor: colors.navy900, alignItems: "center", justifyContent: "center" },
  whyTitle: { marginTop: 12, fontFamily: fonts.semibold, fontSize: 17, color: colors.navy900 },
  whyText: { marginTop: 4, fontFamily: fonts.sans, color: colors.slate600, lineHeight: 20 },
  steps: { marginTop: 32, backgroundColor: colors.navy900, padding: 24, gap: 16 },
  step: { flexDirection: "row", gap: 14, alignItems: "center" },
  stepNum: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.gold400, alignItems: "center", justifyContent: "center" },
  stepNumText: { fontFamily: fonts.bold, color: colors.navy950 },
  stepTitle: { fontFamily: fonts.semibold, color: colors.white, fontSize: 16 },
  stepText: { fontFamily: fonts.sans, color: colors.navy100, marginTop: 2 },
  cta: { backgroundColor: colors.navy900, borderRadius: 28, padding: 24, gap: 12 },
  ctaTitle: { fontFamily: fonts.serif, fontSize: 30, color: colors.white, lineHeight: 36 },
  ctaText: { fontFamily: fonts.sans, color: colors.navy100, lineHeight: 22 },
});
