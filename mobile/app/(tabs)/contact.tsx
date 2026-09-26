import { useState } from "react";
import { Linking, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ShowingForm } from "@/components/ShowingForm";
import { Button, Field, Notice } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { useSiteSettings } from "@/lib/queries";
import { supabase } from "@/lib/supabase";
import { colors, fonts, shadow } from "@/theme";

export default function ContactScreen() {
  const insets = useSafeAreaInsets();
  const { data: settings } = useSiteSettings();

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: 32 }}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>Contact</Text>
        <Text style={styles.title}>We're here to help</Text>
        <Text style={styles.lede}>Questions about a home or an application? A member of the ELS team replies within one business day.</Text>
      </View>

      {settings ? (
        <View style={styles.card}>
          <Row icon="mappin.and.ellipse" label="Office" value={`${settings.address_line1}\n${settings.city}, ${settings.state} ${settings.zip}`} />
          <Row icon="phone.fill" label="Phone" value={settings.phone} onPress={() => Linking.openURL(`tel:${settings.phone}`)} />
          <Row icon="envelope.fill" label="Email" value={settings.email} onPress={() => Linking.openURL(`mailto:${settings.email}`)} />
          <Row icon="clock.fill" label="Hours" value={settings.office_hours} />
        </View>
      ) : null}

      <View style={styles.block}>
        <Text style={styles.blockTitle}>Send a message</Text>
        <MessageForm />
      </View>

      <View style={styles.block}>
        <Text style={styles.blockTitle}>Request a showing</Text>
        <Text style={styles.lede}>Not sure which home yet? Send a general request and we'll help you find a fit.</Text>
        <ShowingForm />
      </View>
    </ScrollView>
  );
}

function MessageForm() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const set = (key: keyof typeof form) => (value: string) => setForm((current) => ({ ...current, [key]: value }));

  async function submit() {
    setStatus("sending");
    const { error } = await supabase.from("contact_messages").insert({
      name: form.name.trim(),
      email: form.email.trim(),
      subject: "General question",
      message: form.message.trim(),
    });
    setStatus(error ? "error" : "sent");
  }

  if (status === "sent") return <Notice tone="success">Message sent. We'll be in touch soon.</Notice>;

  return (
    <View style={{ gap: 12 }}>
      <Field label="Name" value={form.name} onChangeText={set("name")} />
      <Field label="Email" autoCapitalize="none" keyboardType="email-address" value={form.email} onChangeText={set("email")} />
      <Field label="Message" multiline value={form.message} onChangeText={set("message")} />
      {status === "error" ? <Notice>Something went wrong. Please call us instead.</Notice> : null}
      <Button label="Send message" loading={status === "sending"} onPress={submit} disabled={!form.name.trim() || !form.email.includes("@") || !form.message.trim()} />
    </View>
  );
}

function Row({ icon, label, value, onPress }: { icon: string; label: string; value: string; onPress?: () => void }) {
  return (
    <View style={styles.row}>
      <View style={styles.icon}><Icon name={icon} color={colors.navy700} size={18} /></View>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowLabel}>{label}</Text>
        {onPress ? (
          <Text style={styles.link} onPress={onPress}>{value}</Text>
        ) : (
          <Text style={styles.rowValue}>{value}</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.slate50 },
  header: { paddingHorizontal: 20, gap: 6 },
  eyebrow: { fontFamily: fonts.semibold, color: colors.gold700, letterSpacing: 2, fontSize: 11, textTransform: "uppercase" },
  title: { fontFamily: fonts.serif, fontSize: 34, color: colors.navy900 },
  lede: { fontFamily: fonts.sans, color: colors.slate600, lineHeight: 22, marginBottom: 8 },
  card: { margin: 16, backgroundColor: colors.white, borderRadius: 22, padding: 8, ...shadow },
  row: { flexDirection: "row", gap: 12, padding: 12 },
  icon: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.navy50, alignItems: "center", justifyContent: "center" },
  rowLabel: { fontFamily: fonts.sans, color: colors.slate500, fontSize: 12 },
  rowValue: { fontFamily: fonts.semibold, color: colors.navy900, fontSize: 15, lineHeight: 21 },
  link: { fontFamily: fonts.semibold, color: colors.navy700, fontSize: 15 },
  block: { paddingHorizontal: 20, gap: 10, marginTop: 8 },
  blockTitle: { fontFamily: fonts.serif, fontSize: 26, color: colors.navy900 },
});
