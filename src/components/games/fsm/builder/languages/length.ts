// Languages of machines/length. See ../languages.ts for the rules.
import type { Language } from "../languages.ts";

const B = ["0", "1"];

export const L: Record<string, Language> = {
  "length/exactly-three":    { alphabet: B, accepts: (s) => s.length === 3 },
  "length/at-most-two":      { alphabet: B, accepts: (s) => s.length <= 2 },
  "length/at-least-four":    { alphabet: B, accepts: (s) => s.length >= 4 },
  "length/even-length":      { alphabet: B, accepts: (s) => s.length % 2 === 0 },
  "length/multiple-of-three": { alphabet: B, accepts: (s) => s.length % 3 === 0 },
};
