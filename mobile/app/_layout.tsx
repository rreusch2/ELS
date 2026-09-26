import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from "@expo-google-fonts/inter";
import { PlayfairDisplay_600SemiBold, PlayfairDisplay_700Bold } from "@expo-google-fonts/playfair-display";
import { AuthProvider } from "@/lib/auth";
import { colors, fonts } from "@/theme";

export { ErrorBoundary } from "expo-router";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1 } },
});

export default function RootLayout() {
  const [loaded, error] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    PlayfairDisplay_600SemiBold,
    PlayfairDisplay_700Bold,
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) SplashScreen.hideAsync();
  }, [loaded]);

  if (!loaded) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: colors.navy950 },
            headerTintColor: colors.white,
            headerTitleStyle: { fontFamily: fonts.semibold },
            headerShadowVisible: false,
            contentStyle: { backgroundColor: colors.slate50 },
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="listing/[slug]" options={{ headerShown: false }} />
          <Stack.Screen name="apply/[slug]" options={{ title: "Application", headerBackTitle: "Back" }} />
          <Stack.Screen name="apply/success" options={{ title: "Application", headerBackVisible: false }} />
          <Stack.Screen name="apply/canceled" options={{ title: "Payment", headerBackVisible: false }} />
          <Stack.Screen name="about" options={{ title: "About" }} />
          <Stack.Screen name="criteria" options={{ title: "Rental Criteria" }} />
          <Stack.Screen name="staff" options={{ headerShown: false }} />
        </Stack>
      </AuthProvider>
    </QueryClientProvider>
  );
}
