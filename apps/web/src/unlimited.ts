import { formatData, type Lang } from "./i18n";
/**
 * Wording for unlimited plans. Daily unlimited plans slow down after the day's fast data,
 * so every one of them carries a plain note saying how and when.
 */
export interface Unlimited {
  highSpeedBytesPerDay?: number;
  slowKbps?: number;
}

type Words = {
  title: string;
  perDay: string;
  dailyNote: string;
  fairUseNote: string;
  globalTitle: string;
  globalSub: string;
  unlimitedTitle: string;
  countries: string;
};

const WORDS: Record<Lang, Words> = {
  en: {
    globalTitle: "Global plans",
    globalSub: "One eSIM that works in many countries. Handy for trips with more than one stop.",
    unlimitedTitle: "Unlimited plans",
    countries: "Works in {n} countries",
    title: "Unlimited",
    perDay: "{gb} fast per day",
    dailyNote:
      "After {gb} of fast data each day, speed drops to about {speed} until the next day. Fine for messages and maps; video will be slow.",
    fairUseNote: "Unlimited under the network's fair-use policy: speed may be reduced after heavy use.",
  },
  fr: {
    globalTitle: "Forfaits mondiaux",
    globalSub: "Une seule eSIM pour plusieurs pays. Pratique pour les voyages avec plusieurs étapes.",
    unlimitedTitle: "Forfaits illimités",
    countries: "Fonctionne dans {n} pays",
    title: "Illimité",
    perDay: "{gb} en haut débit par jour",
    dailyNote:
      "Après {gb} de données rapides par jour, la vitesse baisse à environ {speed} jusqu'au lendemain. Suffisant pour les messages et les cartes ; la vidéo sera lente.",
    fairUseNote:
      "Illimité selon la politique d'usage raisonnable du réseau : la vitesse peut être réduite après une forte utilisation.",
  },
  es: {
    globalTitle: "Planes globales",
    globalSub: "Una sola eSIM para varios países. Ideal para viajes con varias paradas.",
    unlimitedTitle: "Planes ilimitados",
    countries: "Funciona en {n} países",
    title: "Ilimitado",
    perDay: "{gb} a alta velocidad por día",
    dailyNote:
      "Después de {gb} de datos rápidos cada día, la velocidad baja a unos {speed} hasta el día siguiente. Sirve para mensajes y mapas; el video irá lento.",
    fairUseNote: "Ilimitado según la política de uso justo de la red: la velocidad puede bajar tras un uso intensivo.",
  },
  pt: {
    globalTitle: "Planos globais",
    globalSub: "Um só eSIM para vários países. Ideal para viagens com várias paradas.",
    unlimitedTitle: "Planos ilimitados",
    countries: "Funciona em {n} países",
    title: "Ilimitado",
    perDay: "{gb} em alta velocidade por dia",
    dailyNote:
      "Depois de {gb} de dados rápidos por dia, a velocidade cai para cerca de {speed} até o dia seguinte. Dá para mensagens e mapas; vídeo fica lento.",
    fairUseNote: "Ilimitado conforme a política de uso justo da rede: a velocidade pode ser reduzida após uso intenso.",
  },
  de: {
    globalTitle: "Weltweite Tarife",
    globalSub: "Eine eSIM für mehrere Länder. Praktisch für Reisen mit mehreren Stopps.",
    unlimitedTitle: "Unbegrenzte Tarife",
    countries: "Gilt in {n} Ländern",
    title: "Unbegrenzt",
    perDay: "{gb} Highspeed pro Tag",
    dailyNote:
      "Nach {gb} schnellen Daten pro Tag sinkt die Geschwindigkeit bis zum nächsten Tag auf etwa {speed}. Reicht für Nachrichten und Karten; Videos laufen langsam.",
    fairUseNote:
      "Unbegrenzt im Rahmen der Fair-Use-Regeln des Netzes: Bei starker Nutzung kann die Geschwindigkeit gedrosselt werden.",
  },
};

const speedText = (kbps: number) => (kbps >= 1000 ? `${kbps / 1000} Mbps` : `${kbps} Kbps`);

/** Big label for a plan card: the data amount, or "Unlimited". */
export function dataTitle(plan: { dataBytes: number; unlimited?: Unlimited }, lang: Lang): string {
  return plan.unlimited ? WORDS[lang].title : formatData(plan.dataBytes);
}

/** "1 GB fast per day", for daily unlimited plans only. */
export function perDayText(u: Unlimited | undefined, lang: Lang): string | null {
  if (!u?.highSpeedBytesPerDay) return null;
  return WORDS[lang].perDay.replace("{gb}", formatData(u.highSpeedBytesPerDay));
}

/** The slow-down note every unlimited plan must show. */
export function unlimitedNote(u: Unlimited | undefined, lang: Lang): string | null {
  if (!u) return null;
  const w = WORDS[lang];
  if (!u.highSpeedBytesPerDay) return w.fairUseNote;
  return w.dailyNote
    .replace("{gb}", formatData(u.highSpeedBytesPerDay))
    .replace("{speed}", speedText(u.slowKbps ?? 512));
}

/** Headings for the global and unlimited groups on a country's plan list. */
export const groupWords = (lang: Lang) => {
  const w = WORDS[lang];
  return { globalTitle: w.globalTitle, globalSub: w.globalSub, unlimitedTitle: w.unlimitedTitle };
};

/** "Works in 117 countries", for global plans. */
export const countriesText = (n: number, lang: Lang) => WORDS[lang].countries.replace("{n}", String(n));

/** Country plans first, then global plans, then unlimited plans. */
export function groupPlans<P extends { unlimited?: Unlimited; region?: unknown }>(plans: P[], global: P[] = []) {
  return {
    country: plans.filter((p) => !p.unlimited && !p.region),
    global,
    unlimited: plans.filter((p) => p.unlimited),
  };
}
