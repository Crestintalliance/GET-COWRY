import { useMemo, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import type { Country } from "@/lib/api";
import { countryName, formatPrice, useLang } from "@/lib/i18n";
import { colors, radius } from "@/lib/theme";
import { CodeBadge, s } from "./ui";

/** Type to search; tap results to add. Several countries can be picked; each shows as a removable chip. */
export function DestinationPicker({
  countries,
  selected,
  onChange,
}: {
  countries: Country[];
  selected: string[];
  onChange: (codes: string[]) => void;
}) {
  const { lang, t } = useLang();
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);

  const labelled = useMemo(
    () =>
      countries
        .map((c) => ({ ...c, label: countryName(c.countryCode, c.countryName, lang) }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    [countries, lang],
  );
  const q = query.trim().toLowerCase();
  const results = labelled
    .filter(
      (c) =>
        !selected.includes(c.countryCode) &&
        (!q || c.label.toLowerCase().includes(q) || c.countryName.toLowerCase().includes(q)),
    )
    .slice(0, 8);
  const label = (code: string) => labelled.find((c) => c.countryCode === code)?.label ?? code;

  return (
    <View>
      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 8,
          alignItems: "center",
          backgroundColor: colors.night2,
          borderColor: focused ? colors.lime : colors.line,
          borderWidth: 1,
          borderRadius: 20,
          padding: 8,
        }}
      >
        {selected.map((code) => (
          <Pressable
            key={code}
            accessibilityRole="button"
            accessibilityLabel={`${t.home.remove} ${label(code)}`}
            onPress={() => onChange(selected.filter((c) => c !== code))}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              backgroundColor: colors.lime,
              borderRadius: radius.pill,
              paddingLeft: 12,
              paddingRight: 8,
              minHeight: 36,
            }}
          >
            <Text style={{ color: colors.night, fontWeight: "700" }}>{label(code)}</Text>
            <Text style={{ color: colors.night, fontSize: 18, fontWeight: "700" }}>×</Text>
          </Pressable>
        ))}
        <TextInput
          value={query}
          onChangeText={setQuery}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={selected.length ? "" : t.home.search}
          placeholderTextColor={colors.mist}
          accessibilityLabel={t.home.search}
          autoCorrect={false}
          returnKeyType="search"
          style={{ flexGrow: 1, minWidth: 120, minHeight: 40, color: colors.white, fontSize: 16, paddingHorizontal: 6 }}
        />
      </View>
      {(focused || q.length > 0) && (
        <View style={{ marginTop: 6, backgroundColor: colors.night2, borderRadius: 18, borderWidth: 1, borderColor: colors.line, padding: 4 }}>
          {results.length === 0 && <Text style={[s.small, { padding: 12 }]}>{t.home.noMatch}</Text>}
          {results.map((c) => (
            <Pressable
              key={c.countryCode}
              accessibilityRole="button"
              onPress={() => {
                onChange([...selected, c.countryCode]);
                setQuery("");
              }}
              style={({ pressed }) => ({
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
                padding: 10,
                borderRadius: 12,
                backgroundColor: pressed ? colors.night : "transparent",
              })}
            >
              <CodeBadge code={c.countryCode} />
              <Text style={{ flex: 1, color: colors.white, fontWeight: "600", fontSize: 16 }}>{c.label}</Text>
              <Text style={s.small}>
                {t.from} {formatPrice(c.fromCents, lang)}
              </Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}
