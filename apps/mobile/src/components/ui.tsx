import type { ReactNode } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";
import { colors, radius } from "@/lib/theme";

export function Button({
  label,
  onPress,
  variant = "lime",
  disabled,
  busy,
  style,
}: {
  label: string;
  onPress: () => void;
  variant?: "lime" | "outline";
  disabled?: boolean;
  busy?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const lime = variant === "lime";
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled, busy: !!busy }}
      onPress={onPress}
      disabled={disabled || busy}
      style={({ pressed }) => [
        s.btn,
        lime ? s.lime : s.outline,
        (pressed || disabled) && { opacity: 0.7 },
        style,
      ]}
    >
      {busy ? (
        <ActivityIndicator color={lime ? colors.night : colors.lime} />
      ) : (
        <Text style={[s.btnText, { color: lime ? colors.night : colors.white }]}>{label}</Text>
      )}
    </Pressable>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[s.card, style]}>{children}</View>;
}

export function CodeBadge({ code, active }: { code: string; active?: boolean }) {
  return (
    <View style={[s.badge, active && { backgroundColor: colors.lime }]}>
      <Text style={[s.badgeText, active && { color: colors.night }]}>{code}</Text>
    </View>
  );
}

export function Chip({ label, active, onPress }: { label: string; active?: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: !!active }}
      onPress={onPress}
      style={[s.chip, active && { backgroundColor: colors.lime, borderColor: colors.lime }]}
    >
      <Text style={[s.chipText, active && { color: colors.night }]}>{label}</Text>
    </Pressable>
  );
}

export const s = StyleSheet.create({
  btn: { minHeight: 52, borderRadius: radius.pill, paddingHorizontal: 22, alignItems: "center", justifyContent: "center" },
  lime: { backgroundColor: colors.lime },
  outline: { borderWidth: 1, borderColor: colors.line },
  btnText: { fontSize: 16, fontWeight: "700" },
  card: { backgroundColor: colors.night2, borderColor: colors.line, borderWidth: 1, borderRadius: radius.card, padding: 16 },
  badge: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.night, alignItems: "center", justifyContent: "center" },
  badgeText: { color: colors.lime, fontWeight: "800", fontSize: 13 },
  chip: { minHeight: 40, paddingHorizontal: 16, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.line, justifyContent: "center" },
  chipText: { color: colors.white, fontWeight: "600", fontSize: 14 },
  h1: { color: colors.white, fontSize: 30, fontWeight: "800" },
  h2: { color: colors.white, fontSize: 22, fontWeight: "800" },
  body: { color: colors.mist, fontSize: 15, lineHeight: 22 },
  small: { color: colors.mist, fontSize: 13 },
  error: { color: colors.danger, fontSize: 14 },
});
