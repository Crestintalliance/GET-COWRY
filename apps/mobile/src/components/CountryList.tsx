import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import type { Country } from "@/lib/api";
import { flag } from "@/lib/flags";
import { allCountryCodes, countryName, useLang } from "@/lib/i18n";
import { FEATURED } from "@/lib/regions";
import { colors } from "@/lib/theme";
import { s } from "./ui";

/** Search box over a scrollable list of every country, with flags. Countries we sell eSIMs for show how many plans there are. */
export function CountryList({ sold, onPick }: { sold: Country[]; onPick: (code: string) => void }) {
  const { lang, t } = useLang();
  const [query, setQuery] = useState("");
  const count = useMemo(() => new Map(sold.map((c) => [c.countryCode, c.planCount])), [sold]);
  const featured = useMemo(() => new Set([...FEATURED.africa, ...FEATURED.caribbean, ...FEATURED.latam]), []);

  const all = useMemo(
    () =>
      allCountryCodes()
        .map((code) => ({ code, name: countryName(code, code, lang) }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [lang],
  );
  const q = query.trim().toLowerCase();
  const shown = q
    ? all.filter((c) => c.name.toLowerCase().includes(q) || countryName(c.code, c.code, "en").toLowerCase().includes(q))
    : // Before typing: our home regions first, then everything else.
      [...all.filter((c) => featured.has(c.code)), ...all.filter((c) => !featured.has(c.code))];

  return (
    <View style={{ gap: 8 }}>
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder={t.plan.search}
        placeholderTextColor={colors.mist}
        accessibilityLabel={t.plan.search}
        autoCorrect={false}
        style={{
          minHeight: 50,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: colors.line,
          backgroundColor: colors.night2,
          color: colors.white,
          fontSize: 16,
          paddingHorizontal: 16,
        }}
      />
      <View style={{ height: 300, borderRadius: 16, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.night2, overflow: "hidden" }}>
        <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled">
          {shown.length === 0 && <Text style={[s.small, { padding: 14 }]}>{t.home.noMatch}</Text>}
          {shown.map((c) => {
            const n = count.get(c.code);
            return (
              <Pressable
                key={c.code}
                accessibilityRole="button"
                onPress={() => onPick(c.code)}
                style={({ pressed }) => ({
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 12,
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                  borderBottomWidth: 1,
                  borderBottomColor: colors.night,
                  backgroundColor: pressed ? colors.night : "transparent",
                })}
              >
                <Text style={{ fontSize: 24 }}>{flag(c.code)}</Text>
                <Text style={{ flex: 1, color: colors.white, fontSize: 16, fontWeight: "600" }}>{c.name}</Text>
                {!!n && (
                  <Text style={s.small}>
                    {n} {n === 1 ? t.plan.planOne : t.plan.planMany}
                  </Text>
                )}
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
}
