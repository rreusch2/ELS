import { useEffect, useState } from "react";
import { ScrollView, StyleSheet } from "react-native";
import { useQueryClient } from "@tanstack/react-query";
import { Button, Field, Loader, Notice } from "@/components/ui";
import { useSiteSettings } from "@/lib/queries";
import { supabase } from "@/lib/supabase";
import { colors } from "@/theme";

export default function SettingsScreen() {
  const { data, isLoading } = useSiteSettings();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ application_fee: "", company_name: "", phone: "", email: "", address_line1: "", city: "", state: "", zip: "", office_hours: "" });
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const set = (key: keyof typeof form) => (value: string) => setForm((current) => ({ ...current, [key]: value }));

  useEffect(() => {
    if (!data) return;
    setForm({
      application_fee: (data.application_fee_cents / 100).toFixed(2),
      company_name: data.company_name,
      phone: data.phone,
      email: data.email,
      address_line1: data.address_line1,
      city: data.city,
      state: data.state,
      zip: data.zip,
      office_hours: data.office_hours,
    });
  }, [data]);

  async function save() {
    setSaving(true);
    const { application_fee, ...rest } = form;
    const { error } = await supabase.from("site_settings").update({ ...rest, application_fee_cents: Math.round(Number(application_fee) * 100) }).eq("id", 1);
    setSaving(false);
    setMessage(error ? error.message : "Saved.");
    queryClient.invalidateQueries({ queryKey: ["site_settings"] });
  }

  if (isLoading) return <Loader />;

  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Field label="Application fee per adult ($)" keyboardType="decimal-pad" value={form.application_fee} onChangeText={set("application_fee")} />
      <Field label="Company name" value={form.company_name} onChangeText={set("company_name")} />
      <Field label="Phone" value={form.phone} onChangeText={set("phone")} />
      <Field label="Email" autoCapitalize="none" value={form.email} onChangeText={set("email")} />
      <Field label="Street address" value={form.address_line1} onChangeText={set("address_line1")} />
      <Field label="City" value={form.city} onChangeText={set("city")} />
      <Field label="State" autoCapitalize="characters" value={form.state} onChangeText={set("state")} />
      <Field label="ZIP" value={form.zip} onChangeText={set("zip")} />
      <Field label="Office hours" value={form.office_hours} onChangeText={set("office_hours")} />
      {message ? <Notice tone={message === "Saved." ? "success" : "error"}>{message}</Notice> : null}
      <Button label="Save settings" loading={saving} onPress={save} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 12, paddingBottom: 40, backgroundColor: colors.slate50 },
});
