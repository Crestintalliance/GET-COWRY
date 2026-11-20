import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export interface Stop {
  /** ISO country code, or "" while the traveler is still choosing. */
  code: string;
  city: string;
}

const KEY = "cowry.trip.v1";
const EMPTY: Stop[] = [{ code: "", city: "" }];

interface TripCtx {
  stops: Stop[];
  setStop: (i: number, patch: Partial<Stop>) => void;
  addStop: () => void;
  removeStop: (i: number) => void;
}

const Ctx = createContext<TripCtx>({ stops: EMPTY, setStop: () => undefined, addStop: () => undefined, removeStop: () => undefined });
export const useTrip = () => useContext(Ctx);

/** The trip being planned, kept on the phone so it's still there next time. */
export function TripProvider({ children }: { children: ReactNode }) {
  const [stops, setStops] = useState<Stop[]>(EMPTY);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((raw) => {
        const saved = raw ? (JSON.parse(raw) as Stop[]) : null;
        if (Array.isArray(saved) && saved.length) setStops(saved);
      })
      .catch(() => undefined)
      .finally(() => setLoaded(true));
  }, []);

  useEffect(() => {
    if (loaded) AsyncStorage.setItem(KEY, JSON.stringify(stops)).catch(() => undefined);
  }, [stops, loaded]);

  const value: TripCtx = {
    stops,
    setStop: (i, patch) => setStops((prev) => prev.map((s, j) => (j === i ? { ...s, ...patch } : s))),
    addStop: () => setStops((prev) => [...prev, { code: "", city: "" }]),
    removeStop: (i) => setStops((prev) => (prev.length > 1 ? prev.filter((_, j) => j !== i) : EMPTY)),
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
