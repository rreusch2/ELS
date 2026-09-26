import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import * as WebBrowser from "expo-web-browser";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import { Badge, Button, Loader, Notice, SelectField } from "@/components/ui";
import { supabase } from "@/lib/supabase";
import { applicationStatusLabels, formatCurrency, formatDate, formatDateTime } from "@/lib/format";
import type { Application, ApplicationStatus } from "@/lib/types";
import { colors, fonts } from "@/theme";

export default function ApplicationDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { data: app, isLoading } = useQuery({
    queryKey: ["admin", "application", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("applications").select("*, listing:listings(id, title, slug, address_line1)").eq("id", id!).single();
      if (error) throw error;
      return data as Application;
    },
  });
  const [status, setStatus] = useState<ApplicationStatus>("submitted");
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (app) {
      setStatus(app.status);
      setNotes(app.admin_notes ?? "");
    }
  }, [app]);

  if (isLoading || !app) return <Loader />;
  const data = app.data;

  async function save() {
    setSaving(true);
    const { error } = await supabase.from("applications").update({ status, admin_notes: notes || null }).eq("id", id!);
    setSaving(false);
    setMessage(error ? error.message : "Saved.");
    queryClient.invalidateQueries({ queryKey: ["admin"] });
  }

  async function openDocument(path: string) {
    const { data: signed, error } = await supabase.storage.from("application-documents").createSignedUrl(path, 300);
    if (error || !signed) {
      setMessage(error?.message ?? "Couldn't open that file.");
      return;
    }
    await WebBrowser.openBrowserAsync(signed.signedUrl);
  }

  const rows: [string, string][] = [
    ["Email", app.email],
    ["Phone", app.phone],
    ["Move-in", formatDate(app.desired_move_in)],
    ["Adults", String(app.adult_count)],
    ["Current address", `${data.current_address?.street ?? ""}, ${data.current_address?.city ?? ""}`],
    ["Landlord", data.current_address?.landlord_name || "—"],
    ["Employment", data.employment?.status ?? "—"],
    ["Employer", data.employment?.employer || "—"],
    ["Monthly income", data.employment?.monthly_income || "—"],
    ["Fee", app.paid_at ? formatCurrency(app.fee_total_cents, { cents: true }) : "Unpaid"],
    ["Paid", formatDateTime(app.paid_at)],
  ];

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.title}>{app.first_name} {app.last_name}</Text>
      <Badge label={applicationStatusLabels[app.status]} tone="navy" />
      <Text style={styles.meta}>{app.listing?.title ?? "Listing removed"}</Text>
      <View style={styles.card}>
        {rows.map(([label, value]) => (
          <View key={label} style={styles.row}>
            <Text style={styles.label}>{label}</Text>
            <Text style={styles.value}>{value}</Text>
          </View>
        ))}
      </View>
      {app.document_paths.map((path) => (
        <Pressable key={path} style={styles.doc} onPress={() => openDocument(path)}>
          <Text style={styles.docText}>{path.split("/").pop()}</Text>
        </Pressable>
      ))}
      <SelectField
        label="Status"
        value={status}
        options={(Object.keys(applicationStatusLabels) as ApplicationStatus[]).map((key) => ({ label: applicationStatusLabels[key], value: key }))}
        onChange={(value) => setStatus(value as ApplicationStatus)}
      />
      <Text style={styles.label}>Internal notes</Text>
      <TextInput style={styles.notes} multiline value={notes} onChangeText={setNotes} placeholder="Not visible to the applicant" placeholderTextColor={colors.slate400} />
      {message ? <Notice tone={message === "Saved." ? "success" : "error"}>{message}</Notice> : null}
      <Button label="Save" loading={saving} onPress={save} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 12, paddingBottom: 40 },
  title: { fontFamily: fonts.serif, fontSize: 30, color: colors.navy900 },
  meta: { fontFamily: fonts.medium, color: colors.slate500 },
  card: { backgroundColor: colors.white, borderRadius: 16, padding: 14, gap: 8 },
  row: { gap: 2 },
  label: { fontFamily: fonts.sans, color: colors.slate500, fontSize: 12 },
  value: { fontFamily: fonts.semibold, color: colors.navy900 },
  doc: { backgroundColor: colors.white, borderRadius: 12, padding: 12 },
  docText: { fontFamily: fonts.medium, color: colors.navy700 },
  notes: { minHeight: 100, backgroundColor: colors.white, borderRadius: 12, borderWidth: 1, borderColor: colors.slate200, padding: 12, fontFamily: fonts.sans, textAlignVertical: "top", color: colors.navy900 },
});
