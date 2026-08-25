import {
  inversions, inversionPairs, legalMoves, swap, isSorted, shuffled,
} from "../src/components/games/models/restlessRow.ts";

let fails = 0;
const ok = (c: boolean, m: string) => { if (!c) { console.error("FAIL:", m); fails++; } };

// A deterministic generator, so a failure is reproducible.
function lcg(seed: number) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

ok(inversions([4, 2, 5, 1, 3]) === 6, `book row 4 2 5 1 3 has 6 inversions, got ${inversions([4,2,5,1,3])}`);
ok(inversions([1, 2, 3, 4, 5]) === 0, "sorted row has no inversions");
ok(inversions([5, 4, 3, 2, 1]) === 10, "reversed row of 5 has 10 = C(5,2) inversions");

// THE CHAPTER'S FACT: an adjacent move drops I by exactly one.
{
  const rand = lcg(7);
  for (let trial = 0; trial < 400; trial++) {
    const n = 2 + Math.floor(rand() * 7);
    const a = shuffled(n, rand);
    for (const p of legalMoves(a, "adjacent")) {
      const before = inversions(a);
      const after = inversions(swap(a, p));
      ok(after === before - 1, `adjacent move changed I by ${after - before}, not -1`);
    }
  }
}

// ...and so every run takes exactly I(start) moves, whatever it picks.
{
  const rand = lcg(11);
  for (let trial = 0; trial < 200; trial++) {
    const n = 2 + Math.floor(rand() * 6);
    const start = shuffled(n, rand);
    const target = inversions(start);
    for (let run = 0; run < 4; run++) {
      let a = [...start];
      let steps = 0;
      while (!isSorted(a)) {
        const ms = legalMoves(a, "adjacent");
        ok(ms.length > 0, "an unsorted row must offer an adjacent move");
        a = swap(a, ms[Math.floor(rand() * ms.length)]);
        steps++;
        if (steps > 500) break;
      }
      ok(steps === target, `run took ${steps} moves, expected I(start)=${target}`);
      ok(isSorted(a), "a stopped run is sorted");
    }
  }
}

// "far": I falls, but not always by one, so run lengths differ.
{
  const rand = lcg(23);
  let sawBigDrop = false;
  for (let trial = 0; trial < 300; trial++) {
    const a = shuffled(2 + Math.floor(rand() * 6), rand);
    for (const p of legalMoves(a, "far")) {
      const d = inversions(a) - inversions(swap(a, p));
      ok(d >= 1, `a far swap must reduce I, got a change of ${-d}`);
      if (d > 1) sawBigDrop = true;
    }
  }
  ok(sawBigDrop, "far swaps should sometimes drop I by more than one");
}

// "any": I can rise, so a run need not stop.
{
  let a = [1, 2, 3];
  const before = inversions(a);
  a = swap(a, { i: 0, j: 1 });
  ok(inversions(a) > before, "an unrestricted adjacent swap can raise I");
  ok(legalMoves([1, 2, 3], "any").length === 2, "every neighbour pair is legal under 'any'");
  ok(legalMoves([1, 2, 3], "adjacent").length === 0, "a sorted row offers no adjacent inversion");
}

// The overlay draws one arc per inverted pair.
ok(inversionPairs([2, 1]).length === 1, "one inverted pair in 2 1");
ok(inversionPairs([3, 1, 2]).some((p) => p.i === 0 && p.j === 2), "3..2 is an inverted pair");

console.log(fails === 0 ? "restless row: all checks passed" : `restless row: ${fails} FAILED`);
process.exit(fails === 0 ? 0 : 1);
