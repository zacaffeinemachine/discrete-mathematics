/**
 * Tower of Hanoi -- the rules, with no rendering attached.
 *
 * Discs are integers: 1 is the smallest and n the largest. A peg is an
 * array with its BOTTOM disc first, so the top of a peg is its last entry.
 */

export type Pegs = [number[], number[], number[]];
export type Move = { from: number; to: number };

export const SOURCE = 0;
export const TARGET = 2;

export function initialPegs(n: number): Pegs {
  return [Array.from({ length: n }, (_, i) => n - i), [], []];
}

export function topOf(peg: number[]): number | null {
  return peg.length ? peg[peg.length - 1] : null;
}

export function canMove(pegs: Pegs, from: number, to: number): boolean {
  if (from === to) return false;
  const d = topOf(pegs[from]);
  if (d == null) return false;
  const t = topOf(pegs[to]);
  return t == null || d < t;
}

export function applyMove(pegs: Pegs, m: Move): Pegs {
  const next: Pegs = [[...pegs[0]], [...pegs[1]], [...pegs[2]]];
  const d = next[m.from].pop();
  if (d != null) next[m.to].push(d);
  return next;
}

/** The standard move list transferring a tower of `k` discs. */
export function transfer(k: number, from: number, to: number, via: number): Move[] {
  if (k <= 0) return [];
  return [
    ...transfer(k - 1, from, via, to),
    { from, to },
    ...transfer(k - 1, via, to, from),
  ];
}

/**
 * The peg carrying the n-1 smallest discs as one clean tower on top, or
 * null when they are scattered. The expert may be asked exactly when this
 * is non-null: it is the only situation the book's argument ever needs.
 */
export function subTowerPeg(pegs: Pegs, n: number): number | null {
  if (n <= 1) return null;
  for (let p = 0; p < 3; p++) {
    const peg = pegs[p];
    const small = peg.filter((d) => d < n);
    if (small.length !== n - 1) continue;
    const tail = peg.slice(peg.length - (n - 1));
    if (tail.every((d) => d < n)) return p;
  }
  return null;
}

/**
 * Where the expert should carry the sub-tower. Forced by the largest disc:
 * if it is already home, the sub-tower follows it home; otherwise the
 * sub-tower parks on the spare peg so the largest disc can move.
 */
export function expertTarget(pegs: Pegs, n: number): number | null {
  const sub = subTowerPeg(pegs, n);
  if (sub == null) return null;
  const largestPeg = pegs.findIndex((peg) => peg.includes(n));
  if (largestPeg === TARGET) return sub === TARGET ? null : TARGET;
  return [0, 1, 2].find((p) => p !== sub && p !== TARGET) ?? null;
}
