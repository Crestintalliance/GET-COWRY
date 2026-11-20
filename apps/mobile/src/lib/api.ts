import { groupPlans, type Unlimited } from "./unlimited";
import Constants from "expo-constants";

/** EXPO_PUBLIC_API_URL overrides app.json, e.g. to test against an API on your computer. */
const BASE: string =
  process.env.EXPO_PUBLIC_API_URL ??
  (Constants.expoConfig?.extra as { apiUrl?: string } | undefined)?.apiUrl ??
  "https://cowry-api.onrender.com";

export interface Country {
  countryCode: string;
  countryName: string;
  fromCents: number;
  planCount: number;
}

export interface Plan {
  planCode: string;
  countryCode: string;
  countryName: string;
  name: string;
  dataBytes: number;
  validityDays: number;
  priceCents: number;
  currency: string;
  networks: { operator: string; type: string }[];
  /** Set on unlimited plans; dataBytes is then 0. */
  unlimited?: Unlimited;
  /** Set on regional and global plans. */
  region?: { name: string; countries: string[] };
}

export type OrderStatus = "awaiting_payment" | "paid" | "provisioning" | "fulfilled" | "fulfillment_failed";

export interface OrderView {
  id: string;
  status: OrderStatus;
  planName: string;
  countryCode: string;
  dataBytes: number;
  validityDays: number;
  retailCents: number;
  esim: { iccid: string; activationCode: string; qrCodeUrl?: string | null } | null;
}

export class ApiError extends Error {
  constructor(readonly status: number) {
    super(`API error ${status}`);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  if (!res.ok) throw new ApiError(res.status);
  return (await res.json()) as T;
}

export interface GuidePick {
  id?: string;
  name: string;
  category: "eat" | "do" | "go";
  area: string;
  note: string;
  by?: string;
  mapsUrl?: string;
}

export interface Guide {
  country: string;
  city: string;
  asOf: string;
  language: string;
  picks: GuidePick[];
  basics: { id: string; title: string; body: string; sources: string[] }[];
  phrases: { en: string; local: string; language: string }[];
  places: { name: string; category: "do" | "go"; area: string; summary: string; sources: string[] }[];
}

export interface GuideResponse {
  guide: Guide | null;
  community: GuidePick[];
  nearbyEnabled: boolean;
}

export interface NearbyPlace {
  id: string;
  name: string;
  address: string;
  rating?: number;
  ratingCount?: number;
  type?: string;
  mapsUrl: string;
}

export const api = {
  countries: () => request<{ countries: Country[] }>("/api/countries").then((r) => r.countries),
  /** Country plans, then global plans that also work there, then unlimited plans. */
  plans: (code: string) =>
    request<{ plans: Plan[]; global?: Plan[] }>(`/api/countries/${encodeURIComponent(code)}/plans`).then((r) => {
      const g = groupPlans(r.plans, r.global ?? []);
      return [...g.country, ...g.global, ...g.unlimited];
    }),
  checkout: (body: { countryCode: string; planCode: string; email: string; locale: string }) =>
    request<{ orderId: string; token: string; checkoutUrl: string }>("/api/checkout", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  guide: (code: string) => request<GuideResponse>(`/api/guides/${encodeURIComponent(code)}`),
  nearby: (code: string, kind: "eat" | "do", lang: string, city?: string) =>
    request<{ places: NearbyPlace[]; enabled: boolean }>(
      `/api/guides/${encodeURIComponent(code)}/nearby?kind=${kind}&lang=${lang}${city ? `&city=${encodeURIComponent(city)}` : ""}`,
    ).then((r) => r.places),
  suggest: (
    code: string,
    body: { category: "eat" | "do" | "go"; name: string; area: string; note: string; submittedBy?: string },
  ) =>
    request<{ ok: true }>(`/api/guides/${encodeURIComponent(code)}/suggestions`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  order: (id: string, token: string) =>
    request<OrderView>(`/api/orders/${encodeURIComponent(id)}?token=${encodeURIComponent(token)}`),
};

/** "LPA:1$smdp.example.com$CODE" → its two parts, for typing in by hand. */
export function parseLpa(lpa: string): { smdp: string; code: string } | null {
  const parts = lpa.split("$");
  if (parts.length < 3 || !parts[0]!.startsWith("LPA:")) return null;
  return { smdp: parts[1]!, code: parts[2]! };
}

/**
 * Links that open the phone's own eSIM setup with the code filled in:
 * Apple's works on iOS 17.4 and later, Google's on recent Android phones.
 */
export function installLink(os: "ios" | "android", lpa: string): string {
  const host = os === "ios" ? "esimsetup.apple.com" : "esimsetup.android.com";
  return `https://${host}/esim_qrcode_provisioning?carddata=${encodeURIComponent(lpa)}`;
}
