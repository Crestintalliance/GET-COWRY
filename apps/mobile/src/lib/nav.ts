import { router } from "expo-router";

/** One country opens its plans; several open the trip screen. */
export function openTrip(codes: string[]) {
  if (codes.length === 1) router.push({ pathname: "/country/[code]", params: { code: codes[0]!.toLowerCase() } });
  else router.push({ pathname: "/trip", params: { to: codes.join(",").toLowerCase() } });
}
