import { useMemo, useState } from "react";
import { FlatList, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ListingCard } from "@/components/ListingCard";
import { PropertyMap } from "@/components/PropertyMap";
import { Button, Loader } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { useListings } from "@/lib/queries";
import { formatCurrency, propertyTypeLabels } from "@/lib/format";
import type { PropertyType } from "@/lib/types";
import { colors, fonts } from "@/theme";

export default function ListingsScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ beds?: string; maxRent?: string }>();
  const { data, isLoading, refetch, isRefetching } = useListings();
  const [beds, setBeds] = useState(params.beds ?? "");
  const [baths, setBaths] = useState("");
  const [maxRent, setMaxRent] = useState(params.maxRent ?? "");
  const [type, setType] = useState("");
  const [pets, setPets] = useState(false);
  const [sort, setSort] = useState("newest");
  const [mapMode, setMapMode] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const filtered = useMemo(() => {
    const list = (data ?? []).filter((listing) => {
      if (beds && Number(listing.bedrooms) < Number(beds)) return false;
      if (baths && Number(listing.bathrooms) < Number(baths)) return false;
      if (maxRent && listing.rent_cents > Number(maxRent) * 100) return false;
      if (type && listing.property_type !== type) return false;
      if (pets && !listing.pets_allowed) return false;
      return true;
    });
    return list.sort((a, b) => {
      if (sort === "price_asc") return a.rent_cents - b.rent_cents;
      if (sort === "price_desc") return b.rent_cents - a.rent_cents;
      if (sort === "beds") return Number(b.bedrooms) - Number(a.bedrooms);
      return b.created_at.localeCompare(a.created_at);
    });
  }, [data, beds, baths, maxRent, type, pets, sort]);

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>Henderson, KY</Text>
          <Text style={styles.title}>Available rentals</Text>
        </View>
        <View style={styles.headerActions}>
          <Pressable style={styles.iconButton} onPress={() => setFiltersOpen(true)} accessibilityLabel="Filters">
            <Icon name="slider.horizontal.3" color={colors.navy900} size={20} />
          </Pressable>
          <Pressable style={styles.iconButton} onPress={() => setMapMode((value) => !value)} accessibilityLabel="Toggle map">
            <Icon name={mapMode ? "square.grid.2x2" : "map"} color={colors.navy900} size={20} />
          </Pressable>
        </View>
      </View>
      <Text style={styles.count}>{isLoading ? "Loading homes…" : `${filtered.length} ${filtered.length === 1 ? "home" : "homes"}`}</Text>

      {isLoading ? (
        <Loader />
      ) : mapMode ? (
        <PropertyMap
          style={styles.map}
          points={filtered
            .filter((listing) => listing.latitude != null && listing.longitude != null)
            .map((listing) => ({
              id: listing.id,
              latitude: listing.latitude!,
              longitude: listing.longitude!,
              title: listing.title,
              description: `${formatCurrency(listing.rent_cents)}/mo`,
            }))}
        />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshing={isRefetching}
          onRefresh={refetch}
          ListEmptyComponent={<Text style={styles.empty}>No homes match these filters. Try widening your search.</Text>}
          renderItem={({ item }) => <ListingCard listing={item} />}
        />
      )}

      <Modal visible={filtersOpen} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setFiltersOpen(false)}>
        <View style={styles.sheet}>
          <Text style={styles.sheetTitle}>Filters</Text>
          <Choice label="Bedrooms" value={beds} onChange={setBeds} options={[[ "", "Any" ], [ "1", "1+" ], [ "2", "2+" ], [ "3", "3+" ], [ "4", "4+" ]]} />
          <Choice label="Bathrooms" value={baths} onChange={setBaths} options={[[ "", "Any" ], [ "1", "1+" ], [ "2", "2+" ], [ "3", "3+" ]]} />
          <Choice label="Max rent" value={maxRent} onChange={setMaxRent} options={[[ "", "Any" ], [ "1000", "$1,000" ], [ "1250", "$1,250" ], [ "1500", "$1,500" ], [ "2000", "$2,000" ], [ "2500", "$2,500" ]]} />
          <Choice label="Type" value={type} onChange={setType} options={[[ "", "All" ], ...(Object.keys(propertyTypeLabels) as PropertyType[]).map((key) => [key, propertyTypeLabels[key]] as [string, string])]} />
          <Choice label="Sort" value={sort} onChange={setSort} options={[[ "newest", "Newest" ], [ "price_asc", "Price ↑" ], [ "price_desc", "Price ↓" ], [ "beds", "Bedrooms" ]]} />
          <Pressable style={styles.petRow} onPress={() => setPets((value) => !value)}>
            <Text style={styles.petLabel}>Pet friendly only</Text>
            <View style={[styles.toggle, pets && styles.toggleOn]} />
          </Pressable>
          <Button label="Show homes" onPress={() => setFiltersOpen(false)} />
          <Button
            label="Reset"
            variant="ghost"
            onPress={() => {
              setBeds(""); setBaths(""); setMaxRent(""); setType(""); setPets(false); setSort("newest");
            }}
          />
        </View>
      </Modal>
    </View>
  );
}

function Choice({ label, value, options, onChange }: { label: string; value: string; options: [string, string][]; onChange: (value: string) => void }) {
  return (
    <View style={{ gap: 8 }}>
      <Text style={styles.choiceLabel}>{label}</Text>
      <View style={styles.chips}>
        {options.map(([optionValue, optionLabel]) => {
          const active = value === optionValue;
          return (
            <Pressable key={optionValue || optionLabel} onPress={() => onChange(optionValue)} style={[styles.chip, active && styles.chipOn]}>
              <Text style={[styles.chipText, active && styles.chipTextOn]}>{optionLabel}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.slate50 },
  header: { paddingHorizontal: 20, paddingTop: 8, flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" },
  eyebrow: { fontFamily: fonts.semibold, color: colors.gold700, letterSpacing: 2, fontSize: 11, textTransform: "uppercase" },
  title: { fontFamily: fonts.serif, fontSize: 32, color: colors.navy900 },
  headerActions: { flexDirection: "row", gap: 8 },
  iconButton: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.white, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.slate200 },
  count: { paddingHorizontal: 20, paddingVertical: 10, fontFamily: fonts.medium, color: colors.slate500 },
  list: { paddingHorizontal: 16, paddingBottom: 24, gap: 16 },
  empty: { textAlign: "center", color: colors.slate500, fontFamily: fonts.sans, padding: 32, lineHeight: 22 },
  map: { flex: 1, margin: 16, borderRadius: 24, overflow: "hidden" },
  sheet: { flex: 1, backgroundColor: colors.slate50, padding: 20, gap: 18 },
  sheetTitle: { fontFamily: fonts.serif, fontSize: 32, color: colors.navy900, marginTop: 12 },
  choiceLabel: { fontFamily: fonts.semibold, color: colors.navy900 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { borderRadius: 999, borderWidth: 1, borderColor: colors.slate200, backgroundColor: colors.white, paddingHorizontal: 12, paddingVertical: 8 },
  chipOn: { backgroundColor: colors.navy900, borderColor: colors.navy900 },
  chipText: { fontFamily: fonts.medium, color: colors.slate600 },
  chipTextOn: { color: colors.white },
  petRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: colors.white, borderRadius: 14, padding: 14 },
  petLabel: { fontFamily: fonts.semibold, color: colors.navy900 },
  toggle: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: colors.slate400 },
  toggleOn: { backgroundColor: colors.gold400, borderColor: colors.gold400 },
});
