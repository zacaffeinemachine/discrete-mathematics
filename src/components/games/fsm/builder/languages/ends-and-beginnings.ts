// Languages of machines/ends-and-beginnings. See ../languages.ts for the rules.
import type { Language } from "../languages.ts";

const B = ["0", "1"];

export const L: Record<string, Language> = {
  "ends-and-beginnings/ends-1":        { alphabet: B, accepts: (s) => s.endsWith("1") },
  "ends-and-beginnings/ends-00":       { alphabet: B, accepts: (s) => s.endsWith("00") },
  "ends-and-beginnings/begins-1":      { alphabet: B, accepts: (s) => s.startsWith("1") },
  "ends-and-beginnings/begins-00":     { alphabet: B, accepts: (s) => s.startsWith("00") },
  // every 0 comes before every 1
  "ends-and-beginnings/zeros-first": {
    alphabet: B,
    accepts: (s) => !s.includes("10"),
  },
};
