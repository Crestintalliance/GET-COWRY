import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, CodeBadge, s } from "@/components/ui";
import { countryName, formatData, useLang } from "@/lib/i18n";
import { listEsims, type SavedEsim } from "@/lib/store";
import { colors } from "@/lib/theme";

export default function MyEsims() {
  const { lang, t } = useLang();
  const [esims, setEsims] = useState<SavedEsim[] | null>(null);

  useFocusEffect(
    useCallback(() => {
      listEsims().then(setEsims);
    }, []),
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.night }} edges={["top"]}>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 12 }}>
        <Text style={s.h1}>{t.esims.title}</Text>
        {esims?.length === 0 && (
          <View style={{ gap: 14, marginTop: 8 }}>
            <Text style={s.body}>{t.esims.empty}</Text>
            <Button label={t.esims.shop} onPress={() => router.navigate("/")} />
          </View>
        )}
        {esims?.map((e) => (
          <Pressable
            key={e.orderId}
            accessibilityRole="button"
            onPress={() => router.push({ pathname: "/order/[id]", params: { id: e.orderId } })}
            style={({ pressed }) => ({
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
              padding: 14,
              borderRadius: 18,
              backgroundColor: pressed ? colors.night : colors.night2,
              borderWidth: 1,
              borderColor: colors.line,
            })}
          >
            <CodeBadge code={e.countryCode} active />
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.white, fontSize: 16, fontWeight: "700" }}>{countryName(e.countryCode, e.countryName, lang)}</Text>
              <Text style={s.small}>
                {(e.dataBytes ? formatData(e.dataBytes) : e.planName)} · {e.validityDays} {t.country.days} · {new Date(e.createdAt).toLocaleDateString(lang)}
              </Text>
            </View>
            <Text style={{ color: colors.white, fontSize: 20 }}>›</Text>
          </Pressable>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
