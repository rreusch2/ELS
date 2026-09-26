import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge, Loader, SelectField } from "@/components/ui";
import { supabase } from "@/lib/supabase";
import { formatDate, formatDateTime, showingStatusLabels } from "@/lib/format";
import type { ShowingRequest, ShowingStatus } from "@/lib/types";
import { colors, fonts } from "@/theme";

export default function ShowingsScreen() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "showings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("showing_requests").select("*, listing:listings(title, slug)").order("created_at", { ascending: false });
      if (error) throw error;
      return data as ShowingRequest[];
    },
  });
  const update = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: ShowingStatus }) => {
      const { error } = await supabase.from("showing_requests").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin"] }),
  });

  if (isLoading) return <Loader />;

  return (
    <ScrollView contentContainerStyle={styles.content}>
      {!data?.length ? <Text style={styles.empty}>No showing requests yet.</Text> : null}
      {data?.map((showing) => (
        <View key={showing.id} style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.name}>{showing.name}</Text>
            <Badge label={showingStatusLabels[showing.status]} tone={showing.status === "new" ? "sky" : "gray"} />
          </View>
          <Text style={styles.meta}>{showing.listing?.title ?? "General request"}</Text>
          <Text style={styles.meta}>{showing.email}{showing.phone ? ` · ${showing.phone}` : ""}</Text>
          <Text style={styles.meta}>{formatDate(showing.preferred_date)} · {showing.preferred_time ?? "Flexible"}</Text>
          {showing.message ? <Text style={styles.message}>{showing.message}</Text> : null}
          <Text style={styles.meta}>{formatDateTime(showing.created_at)}</Text>
          <SelectField
            label="Status"
            value={showing.status}
            options={(Object.keys(showingStatusLabels) as ShowingStatus[]).map((key) => ({ label: showingStatusLabels[key], value: key }))}
            onChange={(value) => update.mutate({ id: showing.id, status: value as ShowingStatus })}
          />
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 12, paddingBottom: 32 },
  card: { backgroundColor: colors.white, borderRadius: 16, padding: 14, gap: 6 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  name: { fontFamily: fonts.semibold, color: colors.navy900, fontSize: 16 },
  meta: { fontFamily: fonts.sans, color: colors.slate500 },
  message: { fontFamily: fonts.sans, color: colors.slate700, lineHeight: 20 },
  empty: { textAlign: "center", color: colors.slate500, fontFamily: fonts.sans, padding: 20 },
});
