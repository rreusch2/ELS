import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { Loader } from "@/components/ui";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { formatCurrency } from "@/lib/format";
import { colors, fonts, shadow } from "@/theme";

export default function StaffHomeScreen() {
  const router = useRouter();
  const { signOut, session } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "dashboard"],
    queryFn: async () => {
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);
      const [listings, apps, showings, messages, paid] = await Promise.all([
        supabase.from("listings").select("id", { count: "exact", head: true }).eq("status", "available"),
        supabase.from("applications").select("id", { count: "exact", head: true }).eq("status", "submitted"),
        supabase.from("showing_requests").select("id", { count: "exact", head: true }).eq("status", "new"),
        supabase.from("contact_messages").select("id", { count: "exact", head: true }).eq("is_read", false),
        supabase.from("applications").select("fee_total_cents").not("paid_at", "is", null).gte("paid_at", monthStart.toISOString()),
      ]);
      return {
        listings: listings.count ?? 0,
        apps: apps.count ?? 0,
        showings: showings.count ?? 0,
        messages: messages.count ?? 0,
        fees: (paid.data ?? []).reduce((sum, row) => sum + row.fee_total_cents, 0),
      };
    },
  });

  if (isLoading || !data) return <Loader />;

  const links = [
    { href: "/staff/applications" as const, label: "Applications to review", value: String(data.apps) },
    { href: "/staff/showings" as const, label: "New showings", value: String(data.showings) },
    { href: "/staff/messages" as const, label: "Unread messages", value: String(data.messages) },
    { href: "/staff/listings" as const, label: "Available listings", value: String(data.listings) },
    { href: "/staff/settings" as const, label: "Fees this month", value: formatCurrency(data.fees) },
  ];

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.hello}>{session?.user.email}</Text>
      {links.map((link) => (
        <Pressable key={link.href} style={styles.card} onPress={() => router.push(link.href)}>
          <Text style={styles.value}>{link.value}</Text>
          <Text style={styles.label}>{link.label}</Text>
        </Pressable>
      ))}
      <Pressable onPress={signOut}><Text style={styles.signOut}>Sign out</Text></Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 12 },
  hello: { fontFamily: fonts.sans, color: colors.slate500, marginBottom: 4 },
  card: { backgroundColor: colors.white, borderRadius: 18, padding: 18, ...shadow },
  value: { fontFamily: fonts.serif, fontSize: 28, color: colors.navy900 },
  label: { fontFamily: fonts.medium, color: colors.slate500, marginTop: 2 },
  signOut: { textAlign: "center", fontFamily: fonts.semibold, color: colors.navy700, padding: 12 },
});
