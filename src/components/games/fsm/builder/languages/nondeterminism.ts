// Languages of the Nondeterminism chapter's design pages (last-few-symbols,
// block-inside, two-cases). See ../languages.ts for the rules.
// The student draws an NFA, and the check compares its language with the
// smallest DFA for the predicate, so `bound` must exceed that DFA's size.
import type { Language } from "../languages.ts";

const B = ["0", "1"];

export const L: Record<string, Language> = {
  // ---- last-few-symbols ----
  "last-few-symbols/ends-01":          { alphabet: B, accepts: (s) => s.endsWith("01") },
  "last-few-symbols/ends-110":         { alphabet: B, accepts: (s) => s.endsWith("110") },
  // the second symbol from the end is 1
  "last-few-symbols/second-from-end":  { alphabet: B, accepts: (s) => s.length >= 2 && s[s.length - 2] === "1" },
  // the third symbol from the end is 1 (the smallest DFA has 8 states)
  "last-few-symbols/third-from-end":   { alphabet: B, accepts: (s) => s.length >= 3 && s[s.length - 3] === "1", bound: 10 },

  // ---- block-inside ----
  "block-inside/contains-101":      { alphabet: B, accepts: (s) => s.includes("101") },
  "block-inside/contains-0110":     { alphabet: B, accepts: (s) => s.includes("0110") },
  "block-inside/contains-00-or-11": { alphabet: B, accepts: (s) => s.includes("00") || s.includes("11") },
  // contains 11 somewhere, and the last symbol is 0
  "block-inside/eleven-then-ends-0": { alphabet: B, accepts: (s) => s.includes("11") && s.endsWith("0") },

  // ---- two-cases ----
  // length at least 2, first and last symbols equal
  "two-cases/same-at-both-ends": { alphabet: B, accepts: (s) => s.length >= 2 && s[0] === s[s.length - 1] },
  "two-cases/starts-11-or-ends-00": { alphabet: B, accepts: (s) => s.startsWith("11") || s.endsWith("00") },
  // the length is a multiple of 2 or a multiple of 3 (or both)
  "two-cases/two-or-three":    { alphabet: B, accepts: (s) => s.length % 2 === 0 || s.length % 3 === 0 },
};
