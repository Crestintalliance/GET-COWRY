import { router, Stack, useLocalSearchParams } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useEffect, useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, View } from "react-native";
import { PlanCard, featuredIndex } from "@/components/PlanCard";
import { Button, s } from "@/components/ui";
import { api, type Plan } from "@/lib/api";
import { countryName, useLang } from "@/lib/i18n";
import { saveEsim } from "@/lib/store";
import { colors } from "@/lib/theme";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function CountryScreen() {
  const params = useLocalSearchParams<{ code: string; plan?: string }>();
  const code = (params.code ?? "").toUpperCase();
  const { lang, t } = useLang();
  const [plans, setPlans] = useState<Plan[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api
      .plans(code)
      .then((p) => {
        setPlans(p);
        const f = featuredIndex(p);
        setSelected((p.find((x) => x.planCode === params.plan) ?? p[f >= 0 ? f : 0])?.planCode ?? null);
      })
      .catch(() => setError(t.error));
  }, [code, params.plan, t.error]);

  const name = plans?.[0] ? countryName(code, plans[0].countryName, lang) : code;
  const plan = plans?.find((p) => p.planCode === selected);

  async function pay() {
    if (!plan) return setError(t.country.pickFirst);
    if (!EMAIL.test(email.trim())) return setError(t.country.badEmail);
    setError(null);
    setBusy(true);
    try {
      const res = await api.checkout({ countryCode: code, planCode: plan.planCode, email: email.trim(), locale: lang });
      await saveEsim({
        orderId: res.orderId,
        token: res.token,
        checkoutUrl: res.checkoutUrl,
        countryCode: code,
        countryName: plan.countryName,
        planName: plan.name,
        dataBytes: plan.dataBytes,
        validityDays: plan.validityDays,
        createdAt: new Date().toISOString(),
      });
      // The order screen polls for the eSIM while Stripe's page is open, and is there when it closes.
      router.replace({ pathname: "/order/[id]", params: { id: res.orderId } });
      await WebBrowser.openBrowserAsync(res.checkoutUrl, { presentationStyle: WebBrowser.WebBrowserPresentationStyle.FORM_SHEET });
    } catch {
      setError(t.error);
    } finally {
      setBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <Stack.Screen options={{ title: name }} />
      <ScrollView contentContainerStyle={{ padding: 20, gap: 12, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        <Text style={s.h1}>{name}</Text>
        {!plans && !error && <Text style={s.body}>{t.loading}</Text>}
        {plans?.length === 0 && <Text style={s.body}>{t.country.none}</Text>}
        {plans?.map((p, i) => (
          <PlanCard
            key={p.planCode}
            plan={p}
            selected={p.planCode === selected}
            popular={i === featuredIndex(plans)}
            onPress={() => setSelected(p.planCode)}
          />
        ))}

        {!!plans?.length && (
          <View style={{ gap: 8, marginTop: 12 }}>
            <Text style={{ color: colors.white, fontWeight: "700", fontSize: 15 }}>{t.country.emailLabel}</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              textContentType="emailAddress"
              placeholder="name@example.com"
              placeholderTextColor={colors.mist}
              accessibilityLabel={t.country.emailLabel}
              style={{
                minHeight: 52,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: colors.line,
                backgroundColor: colors.night2,
                color: colors.white,
                fontSize: 16,
                paddingHorizontal: 16,
              }}
            />
            <Text style={s.small}>{t.country.emailHint}</Text>
            {error && <Text style={s.error}>{error}</Text>}
            <Button label={busy ? t.country.paying : t.country.pay} busy={busy} onPress={pay} style={{ marginTop: 6 }} />
            <Text style={[s.small, { marginTop: 4 }]}>{t.country.compat}</Text>
          </View>
        )}
        {error && !plans?.length && <Text style={s.error}>{error}</Text>}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
