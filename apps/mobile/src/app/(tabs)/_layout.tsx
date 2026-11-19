import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { useLang } from "@/lib/i18n";
import { colors } from "@/lib/theme";

export default function TabsLayout() {
  const { t } = useLang();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: colors.night, borderTopColor: colors.line },
        tabBarActiveTintColor: colors.lime,
        tabBarInactiveTintColor: colors.mist,
        sceneStyle: { backgroundColor: colors.night },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: t.tabs.shop, tabBarIcon: ({ color, size }) => <Ionicons name="earth" color={color as string} size={size} /> }}
      />
      <Tabs.Screen
        name="esims"
        options={{ title: t.tabs.esims, tabBarIcon: ({ color, size }) => <Ionicons name="cellular" color={color as string} size={size} /> }}
      />
    </Tabs>
  );
}
