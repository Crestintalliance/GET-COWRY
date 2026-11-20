import type { Guide } from "../types.js";
import { gn } from "./gn.js";
import { pa } from "./pa.js";

/** Destinations with a written guide. Add a file per country and list it here. */
export const GUIDES: Record<string, Guide> = { GN: gn, PA: pa };
