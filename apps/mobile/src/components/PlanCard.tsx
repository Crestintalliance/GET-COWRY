import { Pressable, Text, View } from "react-native";
import type { Plan } from "@/lib/api";
import { formatData, formatPrice, useLang } from "@/lib/i18n";
import { colors } from "@/lib/theme";

export function PlanCard({ plan, selected, popular, onPress }: { plan: Plan; selected: boolean; popular?: boolean; onPress: () => void }) {
  const { lang, t } = useLang();
  const network = plan.networks.map((n) => `${n.operator} ${n.type}`).join(", ");
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      onPress={onPress}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        padding: 16,
        borderRadius: 18,
        borderWidth: 2,
        borderColor: selected ? colors.lime : colors.line,
        backgroundColor: colors.night2,
      }}
    >
      <View style={{ flex: 1, gap: 2 }}>
        {popular && <Text style={{ color: colors.lime, fontSize: 12, fontWeight: "800" }}>{t.country.popular}</Text>}
        <Text style={{ color: colors.white, fontSize: 22, fontWeight: "800" }}>{formatData(plan.dataBytes)}</Text>
        <Text style={{ color: colors.mist, fontSize: 14 }}>
          {plan.validityDays} {t.country.days}
          {network ? ` · ${network}` : ""}
        </Text>
      </View>
      <Text style={{ color: colors.white, fontSize: 18, fontWeight: "800" }}>{formatPrice(plan.priceCents, lang)}</Text>
      <View
        style={{
          width: 24,
          height: 24,
          borderRadius: 12,
          borderWidth: 2,
          borderColor: selected ? colors.lime : colors.line,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {selected && <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: colors.lime }} />}
      </View>
    </Pressable>
  );
}

/** The plan a family trip most often needs: the middle of the list. */
export function featuredIndex(plans: Plan[]): number {
  return plans.length >= 3 ? Math.floor(plans.length / 2) : -1;
}
