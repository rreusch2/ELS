import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Button, Notice } from "@/components/ui";
import { invokeApplication, openCheckout } from "@/lib/checkout";
import { colors, fonts } from "@/theme";

export default function ApplyCanceledScreen() {
  const { application } = useLocalSearchParams<{ application?: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function retry() {
    if (!application) return;
    setLoading(true);
    setError(null);
    try {
      const result = await invokeApplication({ action: "retry", application_id: application });
      const outcome = await openCheckout(result.checkout_url);
      if (outcome === "success") router.replace("/apply/success");
      else setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "We couldn't restart checkout.");
      setLoading(false);
    }
  }

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Payment wasn't completed</Text>
      <Text style={styles.copy}>Your application is saved, and it won't be reviewed until the fee is paid.</Text>
      {error ? <Notice>{error}</Notice> : null}
      {application ? <Button label="Complete payment" variant="gold" loading={loading} onPress={retry} /> : null}
      <Button label="Back to rentals" variant="outline" onPress={() => router.replace("/listings")} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.slate50, padding: 24, justifyContent: "center", gap: 14 },
  title: { fontFamily: fonts.serif, fontSize: 34, color: colors.navy900 },
  copy: { fontFamily: fonts.sans, color: colors.slate600, fontSize: 16, lineHeight: 24 },
});
