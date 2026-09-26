import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { Badge, Loader } from "@/components/ui";
import { supabase } from "@/lib/supabase";
import { applicationStatusLabels, formatDateTime } from "@/lib/format";
import type { Application, ApplicationStatus } from "@/lib/types";
import { colors, fonts } from "@/theme";

const toneFor = (status: ApplicationStatus) =>
  status === "approved" ? "green" : status === "denied" ? "red" : status === "submitted" ? "sky" : status === "under_review" ? "amber" : "gray";

export default function ApplicationsScreen() {
  const router = useRouter();
  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["admin", "applications"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("applications")
        .select("*, listing:listings(id, title, slug, address_line1)")
        .neq("status", "pending_payment")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Application[];
    },
  });

  if (isLoading) return <Loader />;

  return (
    <FlatList
      data={data}
      keyExtractor={(item) => item.id}
      refreshing={isRefetching}
      onRefresh={refetch}
      contentContainerStyle={styles.list}
      ListEmptyComponent={<Text style={styles.empty}>No paid applications yet.</Text>}
      renderItem={({ item }) => (
        <Pressable style={styles.card} onPress={() => router.push(`/staff/application/${item.id}`)}>
          <View style={styles.row}>
            <Text style={styles.name}>{item.first_name} {item.last_name}</Text>
            <Badge label={applicationStatusLabels[item.status]} tone={toneFor(item.status)} />
          </View>
          <Text style={styles.meta}>{item.listing?.title ?? "Listing removed"}</Text>
          <Text style={styles.meta}>{formatDateTime(item.paid_at ?? item.created_at)}</Text>
        </Pressable>
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: { padding: 16, gap: 10 },
  card: { backgroundColor: colors.white, borderRadius: 16, padding: 14, gap: 4 },
  row: { flexDirection: "row", justifyContent: "space-between", gap: 8, alignItems: "center" },
  name: { fontFamily: fonts.semibold, color: colors.navy900, fontSize: 16, flex: 1 },
  meta: { fontFamily: fonts.sans, color: colors.slate500 },
  empty: { textAlign: "center", color: colors.slate500, padding: 24, fontFamily: fonts.sans },
});
