import * as Clipboard from "expo-clipboard";
import { Stack, useLocalSearchParams } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { useEffect, useState } from "react";
import { Linking, Platform, ScrollView, Text, View } from "react-native";
import QRCode from "react-native-qrcode-svg";
import { Button, Card, s } from "@/components/ui";
import { api, installLink, parseLpa, type OrderView } from "@/lib/api";
import { countryName, formatData, useLang } from "@/lib/i18n";
import { findEsim, type SavedEsim } from "@/lib/store";
import { colors } from "@/lib/theme";

const POLL_MS = 3000;
const DONE = new Set(["fulfilled", "fulfillment_failed"]);

function CopyRow({ label, value }: { label: string; value: string }) {
  const { t } = useLang();
  const [copied, setCopied] = useState(false);
  return (
    <View style={{ gap: 6 }}>
      <Text style={{ color: colors.white, fontWeight: "700" }}>{label}</Text>
      <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
        <Text selectable style={{ flex: 1, color: colors.mint, fontFamily: Platform.select({ ios: "Menlo", default: "monospace" }), fontSize: 13 }}>
          {value}
        </Text>
        <Button
          label={copied ? t.order.copied : t.order.copy}
          variant="outline"
          style={{ minHeight: 40, paddingHorizontal: 14 }}
          onPress={async () => {
            await Clipboard.setStringAsync(value);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
        />
      </View>
    </View>
  );
}

export default function OrderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { lang, t } = useLang();
  const [saved, setSaved] = useState<SavedEsim | null | undefined>(undefined);
  const [order, setOrder] = useState<OrderView | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    findEsim(id).then((e) => setSaved(e ?? null));
  }, [id]);

  useEffect(() => {
    if (!saved) return;
    let stop = false;
    let timer: ReturnType<typeof setTimeout>;
    const load = async () => {
      try {
        const o = await api.order(saved.orderId, saved.token);
        if (stop) return;
        setOrder(o);
        setError(false);
        if (!DONE.has(o.status)) timer = setTimeout(load, POLL_MS);
      } catch {
        if (stop) return;
        setError(true);
        timer = setTimeout(load, POLL_MS * 2);
      }
    };
    load();
    return () => {
      stop = true;
      clearTimeout(timer);
    };
  }, [saved]);

  if (saved === null) {
    return (
      <View style={{ padding: 20 }}>
        <Text style={s.body}>{t.order.notFound}</Text>
      </View>
    );
  }

  const lpa = order?.esim?.activationCode ?? null;
  const parts = lpa ? parseLpa(lpa) : null;
  const title = saved ? `${countryName(saved.countryCode, saved.countryName, lang)} · ${(saved.dataBytes ? formatData(saved.dataBytes) : saved.planName)}` : t.order.title;
  const canInstall = Platform.OS === "ios" || Platform.OS === "android";

  return (
    <ScrollView contentContainerStyle={{ padding: 20, gap: 16, paddingBottom: 40 }}>
      <Stack.Screen options={{ title: t.order.title }} />
      <Text style={s.h1}>{title}</Text>
      {saved && (
        <Text style={s.small}>
          {saved.validityDays} {t.country.days}
        </Text>
      )}

      <Card style={{ gap: 6 }}>
        <Text style={{ color: order?.status === "fulfillment_failed" ? colors.danger : colors.lime, fontWeight: "800", fontSize: 17 }}>
          {order ? t.order.status[order.status] : t.loading}
        </Text>
        {order && !DONE.has(order.status) && <Text style={s.body}>{t.order.waiting}</Text>}
        {order?.status === "fulfillment_failed" && <Text style={s.body}>{t.order.failed}</Text>}
        {error && <Text style={s.error}>{t.error}</Text>}
      </Card>

      {order?.status === "awaiting_payment" && saved?.checkoutUrl && (
        <Button label={t.order.finishPayment} onPress={() => WebBrowser.openBrowserAsync(saved.checkoutUrl!)} />
      )}

      {order?.status === "fulfilled" && lpa && (
        <View style={{ gap: 16 }}>
          {canInstall && (
            <View style={{ gap: 8 }}>
              <Button label={t.order.install} onPress={() => Linking.openURL(installLink(Platform.OS === "ios" ? "ios" : "android", lpa))} />
              <Text style={s.small}>{t.order.installHint}</Text>
            </View>
          )}
          <Card style={{ gap: 12, alignItems: "center" }}>
            <Text style={[s.body, { alignSelf: "stretch" }]}>{t.order.scan}</Text>
            <View style={{ backgroundColor: "#FFFFFF", padding: 14, borderRadius: 16 }}>
              <QRCode value={lpa} size={200} />
            </View>
          </Card>
          {parts && (
            <Card style={{ gap: 14 }}>
              <Text style={s.body}>{t.order.manual}</Text>
              <CopyRow label={t.order.smdp} value={parts.smdp} />
              <CopyRow label={t.order.code} value={parts.code} />
            </Card>
          )}
          <Text style={s.body}>{t.order.roaming}</Text>
        </View>
      )}
    </ScrollView>
  );
}
