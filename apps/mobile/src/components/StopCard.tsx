import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Animated, Pressable, Text, TextInput, View } from "react-native";
import { api, type Plan } from "@/lib/api";
import { flag } from "@/lib/flags";
import { countryName, formatPrice, useLang } from "@/lib/i18n";
import { colors } from "@/lib/theme";
import type { Stop } from "@/lib/trip";
import { PlanList } from "./PlanCard";
import { Button } from "./ui";

function CheckItem({
  title,
  desc,
  done,
  badge,
  open,
  onPress,
  children,
}: {
  title: string;
  desc: string;
  done?: boolean;
  badge?: string;
  open?: boolean;
  onPress?: () => void;
  children?: React.ReactNode;
}) {
  return (
    <View style={{ borderTopWidth: 1, borderTopColor: colors.line }}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: !!open, disabled: !onPress }}
        disabled={!onPress}
        onPress={onPress}
        style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 14 }}
      >
        <View
          style={{
            width: 26,
            height: 26,
            borderRadius: 8,
            borderWidth: 2,
            borderColor: done ? colors.lime : colors.line,
            backgroundColor: done ? colors.lime : "transparent",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {done && <Text style={{ color: colors.night, fontWeight: "900" }}>✓</Text>}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.white, fontSize: 16, fontWeight: "700" }}>{title}</Text>
          <Text style={{ color: colors.mist, fontSize: 13 }}>{desc}</Text>
        </View>
        {badge ? (
          <Text style={{ color: colors.mist, fontSize: 12, fontWeight: "700" }}>{badge}</Text>
        ) : onPress ? (
          <Text style={{ color: colors.lime, fontSize: 20 }}>{open ? "⌃" : "›"}</Text>
        ) : null}
      </Pressable>
      {open && <View style={{ paddingBottom: 14, gap: 10 }}>{children}</View>}
    </View>
  );
}

/** "You selected Guinea": the flag pops in, then a checklist of what JoinCowry has for that country. */
export function StopCard({ index, stop, onChange, onRemove }: { index: number; stop: Stop; onChange: (p: Partial<Stop>) => void; onRemove: () => void }) {
  const { lang, t } = useLang();
  const code = stop.code;
  const name = countryName(code, code, lang);
  const [pop] = useState(() => new Animated.Value(0));
  const [plans, setPlans] = useState<Plan[] | null>(null);
  const [picks, setPicks] = useState<number | null>(null);
  const [esimOpen, setEsimOpen] = useState(false);
  const [chosen, setChosen] = useState<string | null>(null);

  // The card is re-created whenever the country changes (it's keyed by code), so this runs once per country.
  useEffect(() => {
    Animated.spring(pop, { toValue: 1, friction: 5, tension: 80, useNativeDriver: true }).start();
    api.plans(code).then(setPlans).catch(() => setPlans([]));
    api
      .guide(code)
      .then((g) => setPicks(g.community.length + (g.guide?.picks.length ?? 0)))
      .catch(() => setPicks(0));
  }, [code, pop]);

  const cheapest = plans?.length ? Math.min(...plans.map((p) => p.priceCents)) : null;
  const guide = () =>
    router.push({
      pathname: "/country/[code]",
      params: { code: code.toLowerCase(), tab: "guide", ...(stop.city.trim() ? { city: stop.city.trim() } : {}) },
    });

  return (
    <View style={{ backgroundColor: colors.night2, borderRadius: 24, borderWidth: 1, borderColor: colors.line, padding: 18, gap: 12 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
        <Animated.Text
          accessibilityLabel={name}
          style={{ fontSize: 56, transform: [{ scale: pop.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }) }], opacity: pop }}
        >
          {flag(code)}
        </Animated.Text>
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.lime, fontSize: 13, fontWeight: "800" }}>
            {t.plan.stop} {index + 1} · {t.plan.selected}
          </Text>
          <Text style={{ color: colors.white, fontSize: 26, fontWeight: "800" }}>{name}</Text>
        </View>
        <Pressable accessibilityRole="button" onPress={() => onChange({ code: "" })} hitSlop={8}>
          <Text style={{ color: colors.lime, fontWeight: "700" }}>{t.plan.change}</Text>
        </Pressable>
      </View>

      <TextInput
        value={stop.city}
        onChangeText={(city) => onChange({ city })}
        placeholder={t.plan.city}
        placeholderTextColor={colors.mist}
        accessibilityLabel={t.plan.city}
        style={{ minHeight: 46, borderRadius: 14, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.night, color: colors.white, fontSize: 15, paddingHorizontal: 14 }}
      />

      <Text style={{ color: colors.mist, fontSize: 14, marginTop: 4 }}>{t.plan.weHave}</Text>
      <View>
        <CheckItem
          title={t.plan.esim}
          desc={
            plans === null
              ? t.loading
              : cheapest === null
                ? t.plan.esimNone
                : `${t.plan.esimDesc} ${t.plan.esimFrom} ${formatPrice(cheapest, lang)}`
          }
          done={!!chosen}
          open={esimOpen}
          onPress={plans?.length ? () => setEsimOpen((o) => !o) : undefined}
        >
          {plans && <PlanList plans={plans} selected={chosen} onSelect={setChosen} />}
          {chosen && (
            <Button
              label={t.plan.choose}
              onPress={() => router.push({ pathname: "/country/[code]", params: { code: code.toLowerCase(), plan: chosen } })}
            />
          )}
        </CheckItem>
        <CheckItem title={t.plan.insurance} desc={t.plan.insuranceDesc} badge={t.plan.soon} />
        <CheckItem title={t.plan.concierge} desc={t.plan.conciergeDesc} onPress={guide} />
        <CheckItem
          title={t.plan.talk}
          desc={picks ? `${picks} ${t.plan.talkSome}` : t.plan.talkNone}
          onPress={guide}
        />
      </View>

      <Pressable accessibilityRole="button" onPress={onRemove} style={{ alignSelf: "flex-start" }} hitSlop={8}>
        <Text style={{ color: colors.mist, fontSize: 13, textDecorationLine: "underline" }}>{t.plan.remove}</Text>
      </Pressable>
    </View>
  );
}
