import { Pressable, Text, View } from "react-native";
import type { Plan } from "@/lib/api";
import { formatPrice, useLang } from "@/lib/i18n";
import { colors } from "@/lib/theme";
import { dataTitle, perDayText, unlimitedNote } from "@/lib/unlimited";

export function PlanCard({ plan, selected, popular, onPress }: { plan: Plan; selected: boolean; popular?: boolean; onPress: () => void }) {
  const { lang, t } = useLang();
  const network = plan.networks.map((n) => `${n.operator} ${n.type}`).join(", ");
  const perDay = perDayText(plan.unlimited, lang);
  const note = unlimitedNote(plan.unlimited, lang);
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
        <Text style={{ color: colors.white, fontSize: 22, fontWeight: "800" }}>{dataTitle(plan, lang)}</Text>
        <Text style={{ color: colors.mist, fontSize: 14 }}>
          {plan.validityDays} {t.country.days}
          {perDay ? ` · ${perDay}` : ""}
          {network ? ` · ${network}` : ""}
        </Text>
        {note && (
          <Text
            style={{ color: colors.mist, fontSize: 13, lineHeight: 18, marginTop: 6, paddingLeft: 10, borderLeftWidth: 3, borderLeftColor: colors.lime }}
          >
            {note}
          </Text>
        )}
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

/** The plan a family trip most often needs: the middle fixed-data plan. Unlimited plans are never featured. */
export function featuredIndex(plans: Plan[]): number {
  const fixed = plans.map((p, i) => ({ p, i })).filter(({ p }) => !p.unlimited);
  return fixed.length >= 3 ? fixed[Math.floor(fixed.length / 2)]!.i : -1;
}
