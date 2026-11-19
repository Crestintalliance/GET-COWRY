import { useCallback, useEffect, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { DestinationPicker } from "@/components/DestinationPicker";
import { LanguageButton } from "@/components/LanguageButton";
import { Button, Chip, CodeBadge, s } from "@/components/ui";
import { api, type Country } from "@/lib/api";
import { countryName, formatPrice, useLang } from "@/lib/i18n";
import { openTrip } from "@/lib/nav";
import { FEATURED, REGIONS, regionOf, type Region } from "@/lib/regions";
import { colors } from "@/lib/theme";

type Filter = Region | "all" | "other";

export default function Home() {
  const { lang, t } = useLang();
  const [countries, setCountries] = useState<Country[] | null>(null);
  const [error, setError] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [hint, setHint] = useState(false);
  const [filter, setFilter] = useState<Filter>("africa");

  const load = useCallback(() => {
    api
      .countries()
      .then((c) => {
        setCountries(c);
        setError(false);
      })
      .catch(() => setError(true));
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const list = countries ?? [];
  const shown =
    filter === "all"
      ? list
      : filter === "other"
        ? list.filter((c) => !regionOf(c.countryCode))
        : [
            ...FEATURED[filter].map((code) => list.find((c) => c.countryCode === code)).filter((c): c is Country => !!c),
            ...list.filter((c) => regionOf(c.countryCode) === filter && !FEATURED[filter].includes(c.countryCode)),
          ];
  const named = shown.map((c) => ({ ...c, label: countryName(c.countryCode, c.countryName, lang) }));
  if (filter === "all" || filter === "other") named.sort((a, b) => a.label.localeCompare(b.label));

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.night }} edges={["top"]}>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 18, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <Text style={{ color: colors.white, fontSize: 20, fontWeight: "800" }}>JoinCowry</Text>
          <LanguageButton />
        </View>

        <View style={{ gap: 6 }}>
          <Text style={[s.small, { color: colors.lime, fontWeight: "700" }]}>{t.home.pill}</Text>
          <Text style={s.h1}>{t.home.title1}</Text>
          <Text style={[s.h1, { color: colors.lime }]}>{t.home.title2}</Text>
        </View>

        <DestinationPicker
          countries={list}
          selected={picked}
          onChange={(c) => {
            setPicked(c);
            setHint(false);
          }}
        />
        {hint && <Text style={s.error}>{t.home.pickOne}</Text>}
        <Button label={t.home.find} onPress={() => (picked.length ? openTrip(picked) : setHint(true))} />

        <Text style={[s.h2, { marginTop: 10 }]}>{t.home.popular}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {([...REGIONS, "all", "other"] as Filter[]).map((r) => (
            <Chip key={r} label={t.regions[r]} active={r === filter} onPress={() => setFilter(r)} />
          ))}
        </ScrollView>

        {error && (
          <View style={{ gap: 10 }}>
            <Text style={s.error}>{t.error}</Text>
            <Button label={t.retry} variant="outline" onPress={load} />
          </View>
        )}
        {!countries && !error && <Text style={s.body}>{t.loading}</Text>}

        <View style={{ gap: 10 }}>
          {named.map((c) => (
            <Pressable
              key={c.countryCode}
              accessibilityRole="button"
              onPress={() => openTrip([c.countryCode])}
              style={({ pressed }) => ({
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
                backgroundColor: pressed ? colors.mist : colors.mint,
                borderRadius: 18,
                padding: 14,
              })}
            >
              <CodeBadge code={c.countryCode} />
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.ink, fontSize: 16, fontWeight: "700" }}>{c.label}</Text>
                <Text style={{ color: "#2D4A3C", fontSize: 13 }}>
                  {t.from} {formatPrice(c.fromCents, lang)}
                </Text>
              </View>
              <Text style={{ color: colors.ink, fontSize: 20 }}>›</Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
