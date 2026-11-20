import { Pressable, Text, View } from "react-native";
import type { Plan } from "@/lib/api";
import { formatPrice, useLang } from "@/lib/i18n";
import { colors } from "@/lib/theme";
import { countriesText, dataTitle, groupPlans, groupWords, perDayText, unlimitedNote } from "@/lib/unlimited";

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
          {plan.region ? ` · ${countriesText(plan.region.countries.length, lang)}` : ""}
          {network && !plan.region ? ` · ${network}` : ""}
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

/** The plan a family trip most often needs: the middle country plan. Global and unlimited plans are never featured. */
export function featuredIndex(plans: Plan[]): number {
  const fixed = plans.map((p, i) => ({ p, i })).filter(({ p }) => !p.unlimited && !p.region);
  return fixed.length >= 3 ? fixed[Math.floor(fixed.length / 2)]!.i : -1;
}

/** Country plans, then "Global plans" and "Unlimited plans" under their own headings. */
export function PlanList({ plans, selected, onSelect }: { plans: Plan[]; selected: string | null; onSelect: (code: string) => void }) {
  const { lang } = useLang();
  const words = groupWords(lang);
  const g = groupPlans(
    plans.filter((p) => !p.region),
    plans.filter((p) => p.region && !p.unlimited),
  );
  const featured = featuredIndex(plans);
  const card = (p: Plan) => (
    <PlanCard
      key={p.planCode}
      plan={p}
      selected={p.planCode === selected}
      popular={plans.indexOf(p) === featured}
      onPress={() => onSelect(p.planCode)}
    />
  );
  const heading = (title: string, sub?: string) => (
    <View style={{ marginTop: 16, gap: 2 }}>
      <Text accessibilityRole="header" style={{ color: colors.white, fontSize: 20, fontWeight: "800" }}>
        {title}
      </Text>
      {sub && <Text style={{ color: colors.mist, fontSize: 14 }}>{sub}</Text>}
    </View>
  );
  return (
    <View style={{ gap: 12 }}>
      {g.country.map(card)}
      {g.global.length > 0 && heading(words.globalTitle, words.globalSub)}
      {g.global.map(card)}
      {g.unlimited.length > 0 && heading(words.unlimitedTitle)}
      {g.unlimited.map(card)}
    </View>
  );
}
