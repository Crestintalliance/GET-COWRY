/** A place listing from Google Maps, shown with Google attribution. */
export interface NearbyPlace {
  id: string;
  name: string;
  address: string;
  rating?: number;
  ratingCount?: number;
  type?: string;
  mapsUrl: string;
}

export type NearbyKind = "eat" | "do";

export interface NearbySearch {
  search(city: string, countryName: string, kind: NearbyKind, languageCode: string): Promise<NearbyPlace[]>;
}

const QUERY: Record<NearbyKind, string> = {
  eat: "restaurants",
  do: "tourist attractions",
};

interface TextSearchResponse {
  places?: {
    id: string;
    displayName?: { text: string };
    formattedAddress?: string;
    rating?: number;
    userRatingCount?: number;
    googleMapsUri?: string;
    primaryTypeDisplayName?: { text: string };
  }[];
}

/**
 * Google Places API (New) Text Search. Each call is billed by Google, so results are
 * kept in memory for a short time to absorb repeat views. Google's terms limit how long
 * place content may be stored; keep the cache short.
 */
export class GooglePlacesSearch implements NearbySearch {
  private cache = new Map<string, { at: number; places: NearbyPlace[] }>();

  constructor(
    private readonly apiKey: string,
    private readonly cacheMs = 30 * 60 * 1000,
    private readonly fetchFn: typeof fetch = fetch,
  ) {}

  async search(city: string, countryName: string, kind: NearbyKind, languageCode: string): Promise<NearbyPlace[]> {
    const key = `${city}|${countryName}|${kind}|${languageCode}`;
    const hit = this.cache.get(key);
    if (hit && Date.now() - hit.at < this.cacheMs) return hit.places;

    const res = await this.fetchFn("https://places.googleapis.com/v1/places:searchText", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": this.apiKey,
        "X-Goog-FieldMask":
          "places.id,places.displayName,places.formattedAddress,places.rating,places.userRatingCount,places.googleMapsUri,places.primaryTypeDisplayName",
      },
      body: JSON.stringify({ textQuery: `${QUERY[kind]} in ${city}, ${countryName}`, languageCode, pageSize: 10 }),
    });
    if (!res.ok) throw new Error(`Google Places error ${res.status}`);
    const data = (await res.json()) as TextSearchResponse;
    const places: NearbyPlace[] = (data.places ?? [])
      .filter((p) => p.displayName?.text && p.googleMapsUri)
      .map((p) => ({
        id: p.id,
        name: p.displayName!.text,
        address: p.formattedAddress ?? "",
        rating: p.rating,
        ratingCount: p.userRatingCount,
        type: p.primaryTypeDisplayName?.text,
        mapsUrl: p.googleMapsUri!,
      }));
    this.cache.set(key, { at: Date.now(), places });
    return places;
  }
}
