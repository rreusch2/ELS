import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { formatDateTime } from "@/lib/format";
import type { ContactMessage } from "@/lib/types";
import { Loader } from "@/components/ui";
import { colors, fonts } from "@/theme";

export default function MessagesScreen() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "messages"],
    queryFn: async () => {
      const { data, error } = await supabase.from("contact_messages").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as ContactMessage[];
    },
  });
  const setRead = useMutation({
    mutationFn: async ({ id, is_read }: { id: string; is_read: boolean }) => {
      const { error } = await supabase.from("contact_messages").update({ is_read }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin"] }),
  });

  if (isLoading) return <Loader />;

  return (
    <ScrollView contentContainerStyle={styles.content}>
      {!data?.length ? <Text style={styles.empty}>No messages yet. Showing requests are under Showings.</Text> : null}
      {data?.map((message) => (
        <Pressable key={message.id} style={[styles.card, !message.is_read && styles.unread]} onPress={() => setRead.mutate({ id: message.id, is_read: !message.is_read })}>
          <Text style={styles.name}>{message.name} · {message.subject ?? "General"}</Text>
          <Text style={styles.meta}>{message.email} · {formatDateTime(message.created_at)}</Text>
          <Text style={styles.body}>{message.message}</Text>
          <Text style={styles.meta}>{message.is_read ? "Tap to mark unread" : "Tap to mark read"}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 12 },
  card: { backgroundColor: colors.white, borderRadius: 16, padding: 14, gap: 6 },
  unread: { borderLeftWidth: 4, borderLeftColor: colors.gold400 },
  name: { fontFamily: fonts.semibold, color: colors.navy900 },
  meta: { fontFamily: fonts.sans, color: colors.slate500, fontSize: 12 },
  body: { fontFamily: fonts.sans, color: colors.slate700, lineHeight: 20 },
  empty: { textAlign: "center", color: colors.slate500, fontFamily: fonts.sans, padding: 20 },
});
