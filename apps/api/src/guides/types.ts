/** A section of practical arrival information, e.g. "Money" or "Getting around". */
export interface GuideBasic {
  id: string;
  title: string;
  body: string;
  sources: string[];
}

export interface GuidePhrase {
  en: string;
  local: string;
  language: string;
}

/** A sight, activity or region taken from published travel sources. */
export interface GuidePlace {
  name: string;
  category: "do" | "go";
  area: string;
  summary: string;
  sources: string[];
}

/** A personal recommendation from the JoinCowry team or someone they trust. */
export interface GuidePick {
  name: string;
  category: "eat" | "do" | "go";
  area: string;
  note: string;
  /** Who recommends it, e.g. "Ashley" or "Mariama, Conakry". */
  by?: string;
  mapsUrl?: string;
}

export interface Guide {
  country: string;
  /** City used to search for nearby places, e.g. "Conakry". */
  city: string;
  /** When the basics were last checked against their sources. */
  asOf: string;
  /** Language the content is written in. */
  language: string;
  picks: GuidePick[];
  basics: GuideBasic[];
  phrases: GuidePhrase[];
  places: GuidePlace[];
}
