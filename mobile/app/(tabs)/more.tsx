import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Logo } from "@/components/Logo";
import { Icon } from "@/components/Icon";
import { useSiteSettings } from "@/lib/queries";
import { colors, fonts, shadow } from "@/theme";

const LINKS = [
  { href: "/about" as const, title: "About ELS Properties", detail: "A hometown team in Henderson", icon: "person.2.fill" },
  { href: "/criteria" as const, title: "Rental criteria & FAQ", detail: "Income, pets, fees, and what to expect", icon: "checklist" },
  { href: "/staff" as const, title: "Staff sign in", detail: "Listings, applications, and messages", icon: "lock.fill" },
];

export default function MoreScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { data: settings } = useSiteSettings();

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: 40 }}>
      <View style={styles.header}><Logo /></View>
      <Text style={styles.intro}>Quality rental homes in Henderson, Kentucky. Equal Housing Opportunity.</Text>
      <View style={styles.list}>
        {LINKS.map((link) => (
          <Pressable key={link.href} style={styles.row} onPress={() => router.push(link.href)}>
            <View style={styles.icon}><Icon name={link.icon} color={colors.gold300} size={18} /></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>{link.title}</Text>
              <Text style={styles.rowDetail}>{link.detail}</Text>
            </View>
            <Icon name="chevron.right" color={colors.slate400} size={16} />
          </Pressable>
        ))}
      </View>
      {settings ? (
        <View style={styles.actions}>
          <Pressable style={styles.action} onPress={() => Linking.openURL(`tel:${settings.phone}`)}>
            <Icon name="phone.fill" color={colors.white} size={16} />
            <Text style={styles.actionText}>Call {settings.phone}</Text>
          </Pressable>
          <Pressable style={[styles.action, styles.actionOutline]} onPress={() => Linking.openURL(`mailto:${settings.email}`)}>
            <Text style={styles.actionOutlineText}>Email the office</Text>
          </Pressable>
        </View>
      ) : null}
      <Text style={styles.fair}>
        ELS Properties does not discriminate on the basis of race, color, religion, sex, disability, familial status, or national origin.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.slate50 },
  header: { paddingHorizontal: 20 },
  intro: { paddingHorizontal: 20, marginTop: 14, fontFamily: fonts.sans, color: colors.slate600, lineHeight: 22 },
  list: { margin: 16, backgroundColor: colors.white, borderRadius: 22, ...shadow },
  row: { flexDirection: "row", alignItems: "center", gap: 12, padding: 16, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.slate200 },
  icon: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.navy900, alignItems: "center", justifyContent: "center" },
  rowTitle: { fontFamily: fonts.semibold, color: colors.navy900, fontSize: 16 },
  rowDetail: { fontFamily: fonts.sans, color: colors.slate500, marginTop: 2 },
  actions: { paddingHorizontal: 16, gap: 10 },
  action: { backgroundColor: colors.navy900, borderRadius: 14, minHeight: 52, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8 },
  actionText: { color: colors.white, fontFamily: fonts.semibold, fontSize: 16 },
  actionOutline: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.navy200 },
  actionOutlineText: { color: colors.navy900, fontFamily: fonts.semibold, fontSize: 16 },
  fair: { margin: 20, fontFamily: fonts.sans, color: colors.slate500, fontSize: 12, lineHeight: 18 },
});
