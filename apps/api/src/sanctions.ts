/**
 * Countries under comprehensive US embargoes. JoinCowry doesn't list or sell plans for them,
 * as the Airalo partner agreement and US law require. Check with counsel before changing.
 */
export const BLOCKED_COUNTRIES = new Set(["CU", "IR", "KP", "SY"]);

export function isBlocked(countryCode: string): boolean {
  return BLOCKED_COUNTRIES.has(countryCode.toUpperCase());
}
