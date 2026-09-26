import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { Redirect, Stack, useSegments } from "expo-router";
import { useAuth } from "@/lib/auth";
import { colors, fonts } from "@/theme";

export default function StaffLayout() {
  const { session, isAdmin, loading, signOut } = useAuth();
  const segments = useSegments();
  const onLogin = segments[segments.length - 1] === "login";

  if (!onLogin && loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.gold400} size="large" />
      </View>
    );
  }
  if (!onLogin && !session) return <Redirect href="/staff/login" />;
  if (!onLogin && session && !isAdmin) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>Access restricted</Text>
        <Text style={styles.copy}>{session.user.email} isn't a staff account.</Text>
        <Pressable onPress={signOut}><Text style={styles.link}>Sign out</Text></Pressable>
      </View>
    );
  }
  if (onLogin && session && isAdmin) return <Redirect href="/staff" />;

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.navy950 },
        headerTintColor: colors.white,
        headerTitleStyle: { fontFamily: fonts.semibold },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.slate50 },
      }}
    >
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="index" options={{ title: "Office" }} />
      <Stack.Screen name="applications" options={{ title: "Applications" }} />
      <Stack.Screen name="application/[id]" options={{ title: "Application" }} />
      <Stack.Screen name="showings" options={{ title: "Showings" }} />
      <Stack.Screen name="messages" options={{ title: "Messages" }} />
      <Stack.Screen name="listings" options={{ title: "Listings" }} />
      <Stack.Screen name="listing/[id]" options={{ title: "Listing" }} />
      <Stack.Screen name="settings" options={{ title: "Settings" }} />
    </Stack>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, backgroundColor: colors.navy950, alignItems: "center", justifyContent: "center", padding: 24, gap: 10 },
  title: { fontFamily: fonts.serif, fontSize: 28, color: colors.white },
  copy: { fontFamily: fonts.sans, color: colors.navy100, textAlign: "center" },
  link: { fontFamily: fonts.semibold, color: colors.gold300, marginTop: 8 },
});
