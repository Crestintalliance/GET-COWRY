import { useEffect, useState } from "react";
import { Linking, Pressable, Text, View } from "react-native";
import { api, type GuidePick, type GuideResponse, type NearbyPlace } from "@/lib/api";
import { useLang } from "@/lib/i18n";
import { colors } from "@/lib/theme";
import { RecommendSheet } from "./RecommendSheet";
import { Button, Card, Chip, s } from "./ui";

type Category = "eat" | "do" | "go";

function PickCard({ pick, label }: { pick: GuidePick; label: string }) {
  const { t } = useLang();
  return (
    <Card style={{ gap: 4 }}>
      <Text style={{ color: colors.lime, fontSize: 12, fontWeight: "800" }}>{label}</Text>
      <Text style={{ color: colors.white, fontSize: 17, fontWeight: "700" }}>{pick.name}</Text>
      {!!pick.area && <Text style={s.small}>{pick.area}</Text>}
      {!!pick.note && <Text style={[s.body, { marginTop: 4 }]}>{pick.note}</Text>}
      {!!pick.by && (
        <Text style={[s.small, { marginTop: 4 }]}>
          {t.guide.by} {pick.by}
        </Text>
      )}
      {!!pick.mapsUrl && (
        <Pressable accessibilityRole="link" onPress={() => Linking.openURL(pick.mapsUrl!)}>
          <Text style={{ color: colors.lime, fontWeight: "700", marginTop: 6 }}>{t.guide.openMaps} ›</Text>
        </Pressable>
      )}
    </Card>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: 10, marginTop: 8 }}>
      <Text style={s.h2}>{title}</Text>
      {children}
    </View>
  );
}

function Basic({ title, body, sources }: { title: string; body: string; sources: string[] }) {
  const [open, setOpen] = useState(false);
  const { t } = useLang();
  return (
    <Card style={{ padding: 0 }}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen((o) => !o)}
        style={{ padding: 16, flexDirection: "row", alignItems: "center" }}
      >
        <Text style={{ flex: 1, color: colors.white, fontSize: 16, fontWeight: "700" }}>{title}</Text>
        <Text style={{ color: colors.lime, fontSize: 18 }}>{open ? "−" : "+"}</Text>
      </Pressable>
      {open && (
        <View style={{ paddingHorizontal: 16, paddingBottom: 16, gap: 8 }}>
          <Text style={s.body}>{body}</Text>
          {sources.length > 0 && (
            <Text style={s.small}>
              {t.guide.sources}:{" "}
              {sources.map((u, i) => (
                <Text key={u} style={{ color: colors.lime }} onPress={() => Linking.openURL(u)}>
                  {new URL(u).hostname.replace(/^www\./, "")}
                  {i < sources.length - 1 ? ", " : ""}
                </Text>
              ))}
            </Text>
          )}
        </View>
      )}
    </Card>
  );
}

/** Eat / Do / Go picks, traveler recommendations, Google listings, and arrival basics for one country. */
export function GuideView({ code, city }: { code: string; city?: string }) {
  const { lang, t } = useLang();
  const [data, setData] = useState<GuideResponse | null>(null);
  const [error, setError] = useState(false);
  const [category, setCategory] = useState<Category>("eat");
  const [nearby, setNearby] = useState<NearbyPlace[] | null>(null);
  const [recommend, setRecommend] = useState(false);

  useEffect(() => {
    api.guide(code).then(setData).catch(() => setError(true));
  }, [code]);

  const nearbyKind = category === "eat" ? "eat" : "do";
  useEffect(() => {
    if (!data?.nearbyEnabled) return;
    let live = true;
    api
      .nearby(code, nearbyKind, lang, city)
      .then((p) => live && setNearby(p))
      .catch(() => live && setNearby([]));
    return () => {
      live = false;
    };
  }, [code, nearbyKind, lang, city, data?.nearbyEnabled]);

  if (error) return <Text style={s.error}>{t.error}</Text>;
  if (!data) return <Text style={s.body}>{t.loading}</Text>;

  const guide = data.guide;
  const ours = (guide?.picks ?? []).filter((p) => p.category === category);
  const theirs = data.community.filter((p) => p.category === category);
  const sights = (guide?.places ?? []).filter((p) => category !== "eat" && p.category === category);

  return (
    <View style={{ gap: 12 }}>
      {!guide && <Text style={s.body}>{t.guide.comingSoon}</Text>}

      <View style={{ flexDirection: "row", gap: 8 }}>
        {(["eat", "do", "go"] as Category[]).map((c) => (
          <Chip key={c} label={t.guide[c]} active={c === category} onPress={() => setCategory(c)} />
        ))}
      </View>

      {ours.map((p) => (
        <PickCard key={`o-${p.name}`} pick={p} label={t.guide.picks} />
      ))}
      {theirs.map((p) => (
        <PickCard key={`c-${p.id ?? p.name}`} pick={p} label={t.guide.travelers} />
      ))}
      {sights.map((p) => (
        <Card key={`s-${p.name}`} style={{ gap: 4 }}>
          <Text style={{ color: colors.white, fontSize: 17, fontWeight: "700" }}>{p.name}</Text>
          <Text style={s.small}>{p.area}</Text>
          <Text style={[s.body, { marginTop: 4 }]}>{p.summary}</Text>
        </Card>
      ))}
      {ours.length + theirs.length + sights.length === 0 && <Text style={s.body}>{t.guide.noPicks}</Text>}

      <Button label={t.guide.recommend} variant="outline" onPress={() => setRecommend(true)} />

      {data.nearbyEnabled && !!nearby?.length && (
        <Section title={t.guide.google}>
          {nearby.map((p) => (
            <Pressable
              key={p.id}
              accessibilityRole="link"
              onPress={() => Linking.openURL(p.mapsUrl)}
              style={{ paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.line, gap: 2 }}
            >
              <Text style={{ color: colors.white, fontSize: 16, fontWeight: "700" }}>{p.name}</Text>
              <Text style={s.small}>
                {[p.type, p.rating ? `★ ${p.rating.toFixed(1)}${p.ratingCount ? ` (${p.ratingCount})` : ""}` : null, p.address]
                  .filter(Boolean)
                  .join(" · ")}
              </Text>
            </Pressable>
          ))}
          <Text style={[s.small, { fontSize: 12 }]}>Google Maps</Text>
        </Section>
      )}

      {!!guide?.basics.length && (
        <Section title={t.guide.basics}>
          {guide.basics.map((b) => (
            <Basic key={b.id} title={b.title} body={b.body} sources={b.sources} />
          ))}
          <Text style={s.small}>
            {t.guide.checked} {new Date(guide.asOf).toLocaleDateString(lang)}
            {guide.language !== lang ? ` · ${t.guide.englishOnly}` : ""}
          </Text>
        </Section>
      )}

      {!!guide?.phrases.length && (
        <Section title={t.guide.phrases}>
          <Card style={{ gap: 10 }}>
            {guide.phrases.map((p) => (
              <View key={`${p.en}-${p.language}`} style={{ flexDirection: "row", gap: 12 }}>
                <Text style={[s.body, { flex: 1 }]}>{p.en}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.white, fontWeight: "700", fontSize: 15 }}>{p.local}</Text>
                  <Text style={s.small}>{p.language}</Text>
                </View>
              </View>
            ))}
          </Card>
        </Section>
      )}

      <RecommendSheet code={code} visible={recommend} onClose={() => setRecommend(false)} initial={category} />
    </View>
  );
}
