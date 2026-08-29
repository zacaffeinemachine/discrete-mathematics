/**
 * Ball Boggle -- Induction, chapter 2.
 *
 * n bins, each holding some number of balls. A move picks any n-1 of the
 * bins and adds one ball to each. Equivalently it picks one bin to SPARE
 * and feeds all the others, which is how a move is named throughout.
 *
 * A bin is an index into the counts array, so a move is just the index of
 * the spared bin and a plan is a list of such indices.
 */

export type Bins = number[];

/** The move: one ball into every bin except `spared`. */
export function spare(bins: readonly number[], spared: number): Bins {
  return bins.map((b, i) => (i === spared ? b : b + 1));
}

export function isLevel(bins: readonly number[]): boolean {
  return bins.every((b) => b === bins[0]);
}

export function maxIndex(bins: readonly number[]): number {
  let best = 0;
  for (let i = 1; i < bins.length; i++) if (bins[i] > bins[best]) best = i;
  return best;
}

/**
 * The fewest moves that can level these bins.
 *
 * After M moves in which bin i was spared s_i times, bin i holds b_i + M -
 * s_i. Those are all equal exactly when b_i - s_i is constant, so s_i =
 * b_i - c for some c, and s_i >= 0 forces c <= min(b). Hence M = sum(s_i)
 * = sum(b_i) - n*c is smallest at c = min(b).
 *
 * This is the answer to one of the chapter's exercises, so it exists for
 * the tests to check a plan against and is NEVER shown to the student.
 */
export function fewestMoves(bins: readonly number[]): number {
  const m = Math.min(...bins);
  return bins.reduce((t, b) => t + (b - m), 0);
}

/**
 * A plan that levels the bins, as the list of bins to spare in order.
 *
 * This is the chapter's own construction rather than the short direct one,
 * because the widget shows it happening and the shape is the point:
 *
 *   two bins   -- a move feeds one bin, so spare the fuller one until the
 *                 emptier one catches up;
 *   n bins     -- keep a fullest bin as the STAR, hand the other n-1 to an
 *                 expert, and realize each of the expert's moves by sparing
 *                 the same bin the expert spared. That feeds one extra ball
 *                 into the star every time. When the expert is done the
 *                 star is ahead, and sparing it closes the gap.
 */
export function expertPlan(bins: readonly number[]): number[] {
  const n = bins.length;
  if (n <= 1) return [];
  if (n === 2) {
    const hi = bins[0] >= bins[1] ? 0 : 1;
    return Array.from({ length: Math.abs(bins[0] - bins[1]) }, () => hi);
  }

  const star = maxIndex(bins);
  const others = bins.map((_, i) => i).filter((i) => i !== star);

  // The expert sees only the other n-1 bins and spares one of them; we
  // spare that same bin, which feeds the star as well.
  const plan = expertPlan(others.map((i) => bins[i])).map((s) => others[s]);

  let after: Bins = [...bins];
  for (const s of plan) after = spare(after, s);

  // The star started at the maximum and gained a ball per expert move, so
  // it is now at least level with the rest. Sparing it closes the gap.
  const gap = after[star] - after[others[0]];
  return [...plan, ...Array.from({ length: gap }, () => star)];
}

/** Run a plan, for tests and for the widget's animation. */
export function applyPlan(bins: readonly number[], plan: readonly number[]): Bins {
  let out: Bins = [...bins];
  for (const s of plan) out = spare(out, s);
  return out;
}

/** A starting configuration. Small counts, and never already level. */
export function randomStart(n: number, rand: () => number = Math.random): Bins {
  for (let tries = 0; tries < 40; tries++) {
    const bins = Array.from({ length: n }, () => Math.floor(rand() * 6));
    if (!isLevel(bins)) return bins;
  }
  return Array.from({ length: n }, (_, i) => i);
}
