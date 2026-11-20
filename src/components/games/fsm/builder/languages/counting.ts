// Languages of machines/counting. See ../languages.ts for the rules.
import type { Language } from "../languages.ts";

const B = ["0", "1"];
const count = (s: string, c: string) => [...s].filter((x) => x === c).length;

export const L: Record<string, Language> = {
  "counting/parity":           { alphabet: B, accepts: (s) => count(s, "1") % 2 === 0 },
  "counting/other-parity":     { alphabet: B, accepts: (s) => count(s, "0") % 2 === 1 },
  "counting/threshold":        { alphabet: B, accepts: (s) => count(s, "1") >= 3 },
  "counting/exactly-two":      { alphabet: B, accepts: (s) => count(s, "1") === 2 },
  "counting/ceiling":          { alphabet: B, accepts: (s) => count(s, "0") <= 2 },
  "counting/remainder":        { alphabet: B, accepts: (s) => count(s, "0") % 4 === 0 },
};
