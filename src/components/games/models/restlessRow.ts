/**
 * The Restless Row -- Induction, chapter 6.
 *
 * A row of distinct numbers. A move swaps two entries that are in the wrong
 * order. Nothing shrinks -- the row keeps its n entries -- so the descent
 * runs on a quantity ATTACHED to the state: the number of inversions.
 *
 * The chapter's three move-sets, which behave quite differently:
 *
 *   "adjacent"  swap neighbours that are out of order.
 *               Every move drops I by exactly one, so a run stops, and
 *               every run takes exactly I(start) moves however it chooses.
 *
 *   "far"       swap ANY out-of-order pair, adjacent or not.
 *               I still falls, but can fall by more than one, so runs stop
 *               at different lengths.
 *
 *   "any"       swap neighbours whether or not they are out of order.
 *               I can rise. A run need never stop -- which is what kills
 *               the "finitely many states, so it must halt" fallacy.
 */

export type MoveSet = "adjacent" | "far" | "any";
export type Pair = { i: number; j: number };

/** Pairs i < j with a[i] > a[j]. */
export function inversionPairs(a: readonly number[]): Pair[] {
  const out: Pair[] = [];
  for (let i = 0; i < a.length; i++) {
    for (let j = i + 1; j < a.length; j++) {
      if (a[i] > a[j]) out.push({ i, j });
    }
  }
  return out;
}

export function inversions(a: readonly number[]): number {
  return inversionPairs(a).length;
}

export function isSorted(a: readonly number[]): boolean {
  for (let i = 1; i < a.length; i++) if (a[i - 1] > a[i]) return false;
  return true;
}

/** The moves the chosen rule allows, as index pairs. */
export function legalMoves(a: readonly number[], set: MoveSet): Pair[] {
  if (set === "far") return inversionPairs(a);
  const out: Pair[] = [];
  for (let i = 0; i + 1 < a.length; i++) {
    if (set === "any" || a[i] > a[i + 1]) out.push({ i, j: i + 1 });
  }
  return out;
}

export function swap(a: readonly number[], p: Pair): number[] {
  const next = [...a];
  const t = next[p.i];
  next[p.i] = next[p.j];
  next[p.j] = t;
  return next;
}

/** A shuffled row of the numbers 1..n. `rand` is injectable for testing. */
export function shuffled(n: number, rand: () => number = Math.random): number[] {
  const a = Array.from({ length: n }, (_, i) => i + 1);
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
