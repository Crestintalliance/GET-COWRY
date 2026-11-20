import { router, Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { Button, s } from "@/components/ui";
import { api, type Plan } from "@/lib/api";
import { countryName, formatPrice, useLang } from "@/lib/i18n";
import { dataTitle, unlimitedNote } from "@/lib/unlimited";
import { colors } from "@/lib/theme";

export default function TripScreen() {
  const { to } = useLocalSearchParams<{ to?: string }>();
  const codes = [...new Set((to ?? "").split(",").map((c) => c.trim().toUpperCase()).filter((c) => /^[A-Z]{2}$/.test(c)))];
  const { lang, t } = useLang();
  const [plans, setPlans] = useState<Record<string, Plan[] | "error">>({});

  useEffect(() => {
    for (const code of codes) {
      api
        .plans(code)
        .then((p) => setPlans((prev) => ({ ...prev, [code]: p })))
        .catch(() => setPlans((prev) => ({ ...prev, [code]: "error" })));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [to]);

  return (
    <ScrollView contentContainerStyle={{ padding: 20, gap: 14, paddingBottom: 40 }}>
      <Stack.Screen options={{ title: t.trip.title }} />
      <Text style={s.h1}>{t.trip.title}</Text>
      <Text style={s.body}>{t.trip.lead}</Text>
      {codes.map((code) => {
        const list = plans[code];
        const name = Array.isArray(list) && list[0] ? countryName(code, list[0].countryName, lang) : code;
        return (
          <View key={code} style={{ gap: 10, marginTop: 12 }}>
            <Text style={s.h2}>{name}</Text>
            {!list && <Text style={s.body}>{t.loading}</Text>}
            {list === "error" && <Text style={s.error}>{t.error}</Text>}
            {Array.isArray(list) && list.length === 0 && <Text style={s.body}>{t.country.none}</Text>}
            {Array.isArray(list) &&
              list.map((p) => (
                <View
                  key={p.planCode}
                  style={{ flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 18, backgroundColor: colors.night2, borderWidth: 1, borderColor: colors.line }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.white, fontSize: 18, fontWeight: "800" }}>{dataTitle(p, lang)}</Text>
                    <Text style={s.small}>
                      {p.validityDays} {t.country.days} · {formatPrice(p.priceCents, lang)}
                    </Text>
                    {p.unlimited && <Text style={[s.small, { marginTop: 4 }]}>{unlimitedNote(p.unlimited, lang)}</Text>}
                  </View>
                  <Button
                    label={t.trip.buy}
                    variant="outline"
                    onPress={() => router.push({ pathname: "/country/[code]", params: { code: code.toLowerCase(), plan: p.planCode } })}
                    style={{ minHeight: 44 }}
                  />
                </View>
              ))}
          </View>
        );
      })}
    </ScrollView>
  );
}
