const BASE = import.meta.env.VITE_API_URL ?? "";

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
  return res.json() as Promise<T>;
}

export const api = {
  countries: () => request<{ countries: Country[] }>("/api/countries").then((r) => r.countries),
  plans: (code: string) =>
    request<{ plans: Plan[] }>(`/api/countries/${encodeURIComponent(code)}/plans`).then((r) => r.plans),
  checkout: (body: { countryCode: string; planCode: string; email: string; locale: string }) =>
    request<{ orderId: string; token: string; checkoutUrl: string }>("/api/checkout", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  order: (id: string, token: string) =>
    request<OrderView>(`/api/orders/${encodeURIComponent(id)}?token=${encodeURIComponent(token)}`),
  devPay: (id: string) =>
    request<{ status: OrderStatus }>(`/api/dev/orders/${encodeURIComponent(id)}/pay`, { method: "POST" }),
};

/** Split "LPA:1$smdp.example.com$CODE" into its parts for manual entry. */
export function parseLpa(lpa: string): { smdp: string; code: string } | null {
  const parts = lpa.split("$");
  if (parts.length < 3 || !parts[0]!.startsWith("LPA:")) return null;
  return { smdp: parts[1]!, code: parts[2]! };
}
