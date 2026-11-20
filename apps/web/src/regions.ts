/** JoinCowry's home regions. Country codes are ISO 3166-1 alpha-2. */
export type Region = "africa" | "caribbean" | "latam";
export const REGIONS: Region[] = ["africa", "caribbean", "latam"];

const AFRICA = "DZ AO BJ BW BF BI CV CM CF TD KM CG CD CI DJ EG GQ ER SZ ET GA GM GH GN GW KE LS LR LY MG MW ML MR MU MA MZ NA NE NG RW ST SN SC SL SO ZA SS SD TZ TG TN UG ZM ZW RE YT";
const CARIBBEAN =
  "AG AI AW BB BS BL BM BQ CW DM DO GD GP HT JM KN KY LC MF MQ MS PR SX TC TT VC VG VI";
const LATAM = "AR BO BR CL CO EC GF GY PY PE SR UY VE BZ CR SV GT HN MX NI PA";

const SETS: Record<Region, Set<string>> = {
  africa: new Set(AFRICA.split(" ")),
  caribbean: new Set(CARIBBEAN.split(" ")),
  latam: new Set(LATAM.split(" ")),
};

export function regionOf(code: string): Region | null {
  return REGIONS.find((r) => SETS[r].has(code.toUpperCase())) ?? null;
}

/** Home page tabs: our three home regions, then where else the diaspora lives and travels. */
export type HomeTab = Region | "world";
export const HOME_TABS: HomeTab[] = ["africa", "caribbean", "latam", "world"];

/** Shown first on the home page, in this order, when the supplier sells them. */
export const FEATURED: Record<HomeTab, string[]> = {
  africa: ["GN", "SN", "CI", "ML", "NG", "GH"],
  caribbean: ["JM", "HT", "DO", "TT", "BB", "PR"],
  latam: ["PA", "CO", "BR", "MX", "PE", "AR"],
  world: ["FR", "BE", "GB", "US", "CA", "ES", "DE", "IT"],
};
