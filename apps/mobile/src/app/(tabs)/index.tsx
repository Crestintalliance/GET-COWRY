import { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CountryList } from "@/components/CountryList";
import { StopCard } from "@/components/StopCard";
import { Chip, s } from "@/components/ui";
import { api, type Country } from "@/lib/api";
import { flag } from "@/lib/flags";
import { LANG_NAMES, LANGS, useLang } from "@/lib/i18n";
import { colors } from "@/lib/theme";
import { useTrip } from "@/lib/trip";

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: 12 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: colors.lime, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ color: colors.night, fontWeight: "900" }}>{n}</Text>
        </View>
        <Text style={s.h2}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

/** Trip planner: language, then one card per stop with what JoinCowry offers there. */
export default function Plan() {
  const { lang, t, setLang } = useLang();
  const { stops, setStop, addStop, removeStop } = useTrip();
  const [sold, setSold] = useState<Country[]>([]);

  useEffect(() => {
    api.countries().then(setSold).catch(() => setSold([]));
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.night }} edges={["top"]}>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 26, paddingBottom: 48 }} keyboardShouldPersistTaps="handled">
        <View style={{ gap: 4 }}>
          <Text style={{ color: colors.white, fontSize: 18, fontWeight: "800" }}>JoinCowry</Text>
          <Text style={s.h1}>{t.plan.hello}</Text>
          <Text style={[s.small, { color: colors.lime, fontWeight: "700" }]}>{t.home.pill}</Text>
        </View>

        <Step n={1} title={t.plan.step1}>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {LANGS.map((l) => (
              <Chip key={l} label={LANG_NAMES[l]} active={l === lang} onPress={() => setLang(l)} />
            ))}
          </View>
        </Step>

        <Step n={2} title={t.plan.step2}>
          <Text style={s.body}>{t.plan.step2Hint}</Text>
          <View style={{ gap: 16 }}>
            {stops.map((stop, i) =>
              stop.code ? (
                <StopCard
                  key={`${i}-${stop.code}`}
                  index={i}
                  stop={stop}
                  onChange={(p) => setStop(i, p)}
                  onRemove={() => removeStop(i)}
                />
              ) : (
                <View key={`${i}-picker`} style={{ gap: 8 }}>
                  <Text style={{ color: colors.lime, fontWeight: "800" }}>
                    {t.plan.stop} {i + 1}
                  </Text>
                  <CountryList sold={sold} onPick={(code) => setStop(i, { code })} />
                  {stops.length > 1 && (
                    <Pressable accessibilityRole="button" onPress={() => removeStop(i)} hitSlop={8}>
                      <Text style={{ color: colors.mist, fontSize: 13, textDecorationLine: "underline" }}>{t.plan.remove}</Text>
                    </Pressable>
                  )}
                </View>
              ),
            )}
          </View>
          {stops.every((st) => st.code) && (
            <Pressable
              accessibilityRole="button"
              onPress={addStop}
              style={{ minHeight: 52, borderRadius: 999, borderWidth: 1, borderStyle: "dashed", borderColor: colors.lime, alignItems: "center", justifyContent: "center" }}
            >
              <Text style={{ color: colors.lime, fontWeight: "700", fontSize: 16 }}>+ {t.plan.addStop}</Text>
            </Pressable>
          )}
          {stops.filter((st) => st.code).length > 1 && (
            <Text style={[s.small, { textAlign: "center" }]}>{stops.filter((st) => st.code).map((st) => flag(st.code)).join("  →  ")}</Text>
          )}
        </Step>
      </ScrollView>
    </SafeAreaView>
  );
}
