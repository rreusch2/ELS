import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { supabase } from "@/lib/supabase";
import { colors, fonts } from "@/theme";
import { Button, Field, Notice, SelectField } from "./ui";

const TIMES = ["Morning (9–12)", "Afternoon (12–4)", "Evening (4–7)", "Flexible"];

export function ShowingForm({ listingId, onDone }: { listingId?: string; onDone?: () => void }) {
  const [form, setForm] = useState({ name: "", email: "", phone: "", preferred_date: "", preferred_time: TIMES[3], message: "" });
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const set = (key: keyof typeof form) => (value: string) => setForm((current) => ({ ...current, [key]: value }));

  async function submit() {
    setStatus("sending");
    const { error } = await supabase.from("showing_requests").insert({
      listing_id: listingId ?? null,
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim() || null,
      preferred_date: form.preferred_date || null,
      preferred_time: form.preferred_time,
      message: form.message.trim() || null,
    });
    setStatus(error ? "error" : "sent");
  }

  if (status === "sent") {
    return (
      <View style={styles.sent}>
        <Text style={styles.sentTitle}>Request received</Text>
        <Text style={styles.sentBody}>We'll contact you within one business day to confirm your showing.</Text>
        {onDone ? <Button label="Done" variant="outline" onPress={onDone} /> : null}
      </View>
    );
  }

  return (
    <View style={styles.form}>
      <Field label="Full name" required value={form.name} onChangeText={set("name")} />
      <Field label="Email" required keyboardType="email-address" autoCapitalize="none" value={form.email} onChangeText={set("email")} />
      <Field label="Phone" keyboardType="phone-pad" value={form.phone} onChangeText={set("phone")} />
      <Field label="Preferred date" placeholder="YYYY-MM-DD" value={form.preferred_date} onChangeText={set("preferred_date")} />
      <SelectField label="Preferred time" value={form.preferred_time} options={TIMES} onChange={set("preferred_time")} />
      <Field label="Notes" multiline value={form.message} onChangeText={set("message")} />
      {status === "error" ? <Notice>Something went wrong. Please try again or give us a call.</Notice> : null}
      <Button label="Request a showing" variant="outline" loading={status === "sending"} onPress={submit} disabled={!form.name.trim() || !form.email.includes("@")} />
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: 14 },
  sent: { gap: 10, paddingVertical: 12 },
  sentTitle: { fontFamily: fonts.serif, fontSize: 24, color: colors.navy900 },
  sentBody: { fontFamily: fonts.sans, color: colors.slate600, lineHeight: 22 },
});
