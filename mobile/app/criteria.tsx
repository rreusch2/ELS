import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useSiteSettings } from "@/lib/queries";
import { formatCurrency } from "@/lib/format";
import { colors, fonts, shadow } from "@/theme";

const CRITERIA = [
  { title: "Income", text: "Combined gross household income of at least 3 times the monthly rent, with proof of income." },
  { title: "Rental history", text: "12 months of verifiable positive rental history or homeownership. Prior evictions or balances owed may result in denial." },
  { title: "Credit", text: "Credit is reviewed for every adult. Limited credit may be approved with an additional deposit or a qualified co-signer." },
  { title: "Background", text: "A background screening is completed for all adult applicants in line with fair housing law and HUD guidance." },
  { title: "Occupancy", text: "Every occupant 18 or older must apply and pay the fee. Occupancy limits follow local codes." },
  { title: "Pets", text: "Pet rules vary by home and are listed on each property. Assistance animals are not pets and are not charged pet fees." },
];

export default function CriteriaScreen() {
  const { data: settings } = useSiteSettings();
  const fee = settings ? formatCurrency(settings.application_fee_cents) : "$50";
  const faqs = [
    ["How much is the application fee?", `The fee is ${fee} per adult (18+). It covers processing and screening and is non-refundable once the application is submitted.`],
    ["How long does approval take?", "Most complete applications are reviewed within 2–3 business days."],
    ["What should I have ready?", "A photo ID, proof of income, landlord contacts, and employment information. You can upload documents in the app."],
    ["Can I apply before a showing?", "Yes. We still recommend seeing the home first. Request a showing from any listing."],
    ["What happens after approval?", "We'll contact you to sign the lease and collect the security deposit. First month's rent is due at or before move-in."],
  ];

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.intro}>We apply the same criteria to every applicant. Please review them before you pay the application fee.</Text>
      {CRITERIA.map((item) => (
        <View key={item.title} style={styles.card}>
          <Text style={styles.cardTitle}>{item.title}</Text>
          <Text style={styles.copy}>{item.text}</Text>
        </View>
      ))}
      <View style={[styles.card, { backgroundColor: colors.gold100 }]}>
        <Text style={styles.cardTitle}>Application fee: {fee} per adult</Text>
        <Text style={styles.copy}>Paid by card when you submit. The fee is non-refundable, so review these criteria first.</Text>
      </View>
      <Text style={styles.heading}>FAQ</Text>
      {faqs.map(([question, answer]) => (
        <View key={question} style={styles.card}>
          <Text style={styles.cardTitle}>{question}</Text>
          <Text style={styles.copy}>{answer}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.slate50 },
  content: { padding: 20, gap: 12, paddingBottom: 40 },
  intro: { fontFamily: fonts.sans, color: colors.slate600, lineHeight: 22, fontSize: 16 },
  heading: { fontFamily: fonts.serif, fontSize: 28, color: colors.navy900, marginTop: 8 },
  card: { backgroundColor: colors.white, borderRadius: 18, padding: 16, ...shadow },
  cardTitle: { fontFamily: fonts.semibold, fontSize: 16, color: colors.navy900, marginBottom: 6 },
  copy: { fontFamily: fonts.sans, color: colors.slate600, lineHeight: 21 },
});
