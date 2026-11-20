// Languages of machines/looking-back. See ../languages.ts for the rules.
import type { Language } from "../languages.ts";

const B = ["0", "1"];

export const L: Record<string, Language> = {
  // length at least 2, last two symbols the same
  "looking-back/last-two-agree":  { alphabet: B, accepts: (s) => s.length >= 2 && s.at(-1) === s.at(-2) },
  // length at least 2, last two symbols different
  "looking-back/last-two-differ": { alphabet: B, accepts: (s) => s.length >= 2 && s.at(-1) !== s.at(-2) },
};
