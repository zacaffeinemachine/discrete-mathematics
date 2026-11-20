// Languages of machines/somewhere-inside. See ../languages.ts for the rules.
import type { Language } from "../languages.ts";

const B = ["0", "1"];
import { LOWER } from "./alphabets.ts";

// how many times `t` occurs in `s`, overlaps counted separately
const occurrences = (s: string, t: string) => {
  let n = 0;
  for (let i = 0; i + t.length <= s.length; i++) if (s.startsWith(t, i)) n++;
  return n;
};

export const L: Record<string, Language> = {
  "somewhere-inside/two-in-a-row":   { alphabet: B, accepts: (s) => s.includes("00") },
  "somewhere-inside/three-in-a-row": { alphabet: B, accepts: (s) => s.includes("101") },
  "somewhere-inside/never-in-a-row": { alphabet: B, accepts: (s) => !s.includes("11") },
  "somewhere-inside/word-in-the-middle": { alphabet: ["a", "b", "c"], accepts: (s) => s.includes("abc") },
};
