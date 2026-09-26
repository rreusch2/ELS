import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Button, Field, Notice } from "@/components/ui";
import { Logo } from "@/components/Logo";
import { supabase } from "@/lib/supabase";
import { colors, fonts } from "@/theme";

export default function StaffLoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    setError(null);
    const { error: signInError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setLoading(false);
    if (signInError) setError(signInError.message);
  }

  return (
    <View style={styles.screen}>
      <Logo light />
      <Text style={styles.title}>Staff sign in</Text>
      <Text style={styles.copy}>Review applications, showings, and listings.</Text>
      <Field label="Email" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
      <Field label="Password" secureTextEntry value={password} onChangeText={setPassword} />
      {error ? <Notice>{error}</Notice> : null}
      <Button label="Sign in" variant="gold" loading={loading} onPress={submit} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.navy950, justifyContent: "center", padding: 24, gap: 14 },
  title: { fontFamily: fonts.serif, fontSize: 34, color: colors.white, marginTop: 18 },
  copy: { fontFamily: fonts.sans, color: colors.navy100, marginBottom: 8 },
});
