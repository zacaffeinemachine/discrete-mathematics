// Languages of machines/two-conditions. See ../languages.ts for the rules.
import type { Language } from "../languages.ts";

const B = ["0", "1"];

const count = (s: string, c: string) => [...s].filter((x) => x === c).length;

export const L: Record<string, Language> = {
  "two-conditions/both-parities": {
    alphabet: B,
    accepts: (s) => count(s, "0") % 2 === 0 && count(s, "1") % 2 === 0,
  },
  "two-conditions/opposite": { alphabet: B, accepts: (s) => count(s, "1") % 3 !== 0 },
};
