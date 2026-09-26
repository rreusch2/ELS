import { StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { Button } from "@/components/ui";
import { useSiteSettings } from "@/lib/queries";
import { colors, fonts } from "@/theme";

export default function ApplySuccessScreen() {
  const router = useRouter();
  const { data: settings } = useSiteSettings();
  return (
    <View style={styles.screen}>
      <Text style={styles.kicker}>Payment received</Text>
      <Text style={styles.title}>Your application is in.</Text>
      <Text style={styles.copy}>We'll verify your rental history, income, and references. Most applications are reviewed within 2–3 business days.</Text>
      {settings ? <Text style={styles.copy}>Questions? Call {settings.phone} or email {settings.email}.</Text> : null}
      <Button label="Back to rentals" onPress={() => router.replace("/listings")} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.slate50, padding: 24, justifyContent: "center", gap: 14 },
  kicker: { fontFamily: fonts.semibold, color: colors.emerald, letterSpacing: 1, textTransform: "uppercase" },
  title: { fontFamily: fonts.serif, fontSize: 36, color: colors.navy900 },
  copy: { fontFamily: fonts.sans, color: colors.slate600, fontSize: 16, lineHeight: 24 },
});
