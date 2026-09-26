import { ScrollView, StyleSheet, Text, View } from "react-native";
import { colors, fonts, shadow } from "@/theme";

const VALUES = [
  { title: "Respect", text: "We treat every resident the way we'd want to be treated." },
  { title: "Quality", text: "Safe, comfortable, well-maintained homes." },
  { title: "Community", text: "We're proud to help our Henderson neighbors find a place to belong." },
  { title: "Responsiveness", text: "Questions get answers and repairs get done." },
];

export default function AboutScreen() {
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.eyebrow}>Our story</Text>
      <Text style={styles.title}>Built on relationships, not transactions</Text>
      <Text style={styles.copy}>
        ELS Properties was founded with a simple idea: renters in Henderson deserve a landlord who cares about their homes as much as they do. What started with a single property has grown into houses, townhomes, and apartments across the city.
      </Text>
      <Text style={styles.copy}>
        We still answer our own phones, know our residents by name, and take pride in every home we manage.
      </Text>
      <View style={styles.stats}>
        {[["50+", "Homes managed"], ["10+", "Years local"], ["24/7", "Emergency line"], ["2–3", "Day review"]].map(([stat, label]) => (
          <View key={label} style={styles.stat}>
            <Text style={styles.statValue}>{stat}</Text>
            <Text style={styles.statLabel}>{label}</Text>
          </View>
        ))}
      </View>
      {VALUES.map((value) => (
        <View key={value.title} style={styles.card}>
          <Text style={styles.cardTitle}>{value.title}</Text>
          <Text style={styles.copy}>{value.text}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.slate50 },
  content: { padding: 20, gap: 12, paddingBottom: 40 },
  eyebrow: { fontFamily: fonts.semibold, color: colors.gold700, letterSpacing: 2, fontSize: 11, textTransform: "uppercase" },
  title: { fontFamily: fonts.serif, fontSize: 32, color: colors.navy900, lineHeight: 38 },
  copy: { fontFamily: fonts.sans, color: colors.slate600, lineHeight: 22, fontSize: 16 },
  stats: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginVertical: 8 },
  stat: { width: "47%", backgroundColor: colors.navy900, borderRadius: 18, padding: 16 },
  statValue: { fontFamily: fonts.serif, color: colors.gold300, fontSize: 28 },
  statLabel: { fontFamily: fonts.medium, color: colors.navy100, marginTop: 4 },
  card: { backgroundColor: colors.white, borderRadius: 18, padding: 16, ...shadow },
  cardTitle: { fontFamily: fonts.semibold, fontSize: 18, color: colors.navy900, marginBottom: 4 },
});
