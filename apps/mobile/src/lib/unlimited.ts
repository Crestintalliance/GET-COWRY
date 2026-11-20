import { formatData, type Lang } from "./i18n";
/**
 * Wording for unlimited plans. Daily unlimited plans slow down after the day's fast data,
 * so every one of them carries a plain note saying how and when.
 */
export interface Unlimited {
  highSpeedBytesPerDay?: number;
  slowKbps?: number;
}

type Words = { title: string; perDay: string; dailyNote: string; fairUseNote: string };

const WORDS: Record<Lang, Words> = {
  en: {
    title: "Unlimited",
    perDay: "{gb} fast per day",
    dailyNote:
      "After {gb} of fast data each day, speed drops to about {speed} until the next day. Fine for messages and maps; video will be slow.",
    fairUseNote: "Unlimited under the network's fair-use policy: speed may be reduced after heavy use.",
  },
  fr: {
    title: "Illimité",
    perDay: "{gb} en haut débit par jour",
    dailyNote:
      "Après {gb} de données rapides par jour, la vitesse baisse à environ {speed} jusqu'au lendemain. Suffisant pour les messages et les cartes ; la vidéo sera lente.",
    fairUseNote:
      "Illimité selon la politique d'usage raisonnable du réseau : la vitesse peut être réduite après une forte utilisation.",
  },
  es: {
    title: "Ilimitado",
    perDay: "{gb} a alta velocidad por día",
    dailyNote:
      "Después de {gb} de datos rápidos cada día, la velocidad baja a unos {speed} hasta el día siguiente. Sirve para mensajes y mapas; el video irá lento.",
    fairUseNote: "Ilimitado según la política de uso justo de la red: la velocidad puede bajar tras un uso intensivo.",
  },
  pt: {
    title: "Ilimitado",
    perDay: "{gb} em alta velocidade por dia",
    dailyNote:
      "Depois de {gb} de dados rápidos por dia, a velocidade cai para cerca de {speed} até o dia seguinte. Dá para mensagens e mapas; vídeo fica lento.",
    fairUseNote: "Ilimitado conforme a política de uso justo da rede: a velocidade pode ser reduzida após uso intenso.",
  },
  de: {
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
