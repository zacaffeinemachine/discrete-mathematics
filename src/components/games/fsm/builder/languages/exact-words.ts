// Languages of machines/exact-words. See ../languages.ts for the rules.
import type { Language } from "../languages.ts";

import { LOWER } from "./alphabets.ts";

export const L: Record<string, Language> = {
  "exact-words/one-short-word": {
    alphabet: LOWER,
    bound: 6,
    relevant: ["h", "a", "t"],
    accepts: (s) => s === "hat",
  },
  "exact-words/one-longer-word": {
    alphabet: LOWER,
    bound: 7,
    relevant: ["c", "o", "d", "e"],
    accepts: (s) => s === "code",
  },
  "exact-words/two-words": {
    alphabet: LOWER,
    // Every accepted word has at most 4 letters, so suffixes up to length 4
    // already tell any two states apart and bound 5 is exact. A bound above
    // the state count would mean billions of suffixes over 8 symbols.
    bound: 5,
    longest: 4,
    relevant: ["h", "a", "t", "e", "m"],
    accepts: (s) => ["hate", "math"].includes(s),
  },
  "exact-words/three-words": {
    alphabet: LOWER,
    // Every accepted word has at most 5 letters, so suffixes up to length 5
    // already tell any two states apart and bound 6 is exact. A bound above
    // the state count would mean billions of suffixes over 9 symbols.
    bound: 6,
    longest: 5,
    relevant: ["s", "t", "a", "r", "o", "p", "u", "e"],
    accepts: (s) => ["start", "stop", "pause"].includes(s),
  },
  "exact-words/prefix-words": {
    alphabet: LOWER,
    bound: 7,
    relevant: ["t", "o", "l"],
    accepts: (s) => ["to", "too", "tool"].includes(s),
  },
  // no letter is treated differently from any other
  "exact-words/every-short-word": {
    alphabet: LOWER,
    relevant: [],
    accepts: (s) => s.length <= 2,
  },
};
