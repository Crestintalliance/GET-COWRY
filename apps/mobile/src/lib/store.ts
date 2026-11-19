import AsyncStorage from "@react-native-async-storage/async-storage";

/** An eSIM bought on this phone. The token lets the app read the order without an account. */
export interface SavedEsim {
  orderId: string;
  token: string;
  /** Stripe page to reopen if payment wasn't finished. */
  checkoutUrl?: string;
  countryCode: string;
  countryName: string;
  planName: string;
  dataBytes: number;
  validityDays: number;
  createdAt: string;
}

const KEY = "cowry.esims.v1";

export async function listEsims(): Promise<SavedEsim[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as SavedEsim[]) : [];
  } catch {
    return [];
  }
}

export async function saveEsim(e: SavedEsim): Promise<void> {
  const all = (await listEsims()).filter((x) => x.orderId !== e.orderId);
  await AsyncStorage.setItem(KEY, JSON.stringify([e, ...all]));
}

export async function findEsim(orderId: string): Promise<SavedEsim | undefined> {
  return (await listEsims()).find((x) => x.orderId === orderId);
}
