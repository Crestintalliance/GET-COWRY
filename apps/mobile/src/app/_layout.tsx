import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { LangProvider } from "@/lib/i18n";
import { colors } from "@/lib/theme";

export default function RootLayout() {
  return (
    <LangProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.night },
          headerTintColor: colors.white,
          headerTitleStyle: { fontWeight: "700" },
          headerShadowVisible: false,
          contentStyle: { backgroundColor: colors.night },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="country/[code]" options={{ title: "" }} />
        <Stack.Screen name="trip" options={{ title: "" }} />
        <Stack.Screen name="order/[id]" options={{ title: "" }} />
      </Stack>
    </LangProvider>
  );
}
