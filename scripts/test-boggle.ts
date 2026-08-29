import {
  spare, isLevel, maxIndex, fewestMoves, expertPlan, applyPlan, randomStart,
} from "../src/components/games/models/ballBoggle.ts";

let fails = 0;
const ok = (c: boolean, m: string) => { if (!c) { console.error("FAIL:", m); fails++; } };

// A deterministic generator, so a failure is reproducible.
function lcg(seed: number) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

// --- The move -------------------------------------------------------
ok(spare([2, 1, 3], 0).join() === "2,2,4", `sparing B1 of (2,1,3) gives (2,2,4), got ${spare([2,1,3],0)}`);
ok(spare([2, 1, 3], 2).join() === "3,2,3", "sparing the third bin feeds the first two");
ok(spare([5], 0).join() === "5", "a lone bin is spared and nothing happens");
{
  const before = [4, 0, 1, 7];
  const after = spare(before, 2);
  ok(before.join() === "4,0,1,7", "spare does not mutate its argument");
  ok(after.filter((b, i) => b === before[i] + 1).length === 3,
     "a move feeds exactly n-1 of the n bins");
  ok(after[2] === before[2], "and leaves the spared bin alone");
}

// --- The chapter's worked run: (2,1,3) ------------------------------
// Star is B3. The expert holds (2,1) and spares B1 once, so we spare B1
// and the star collects a ball: (2,2,4). Two moves sparing the star then
// close the gap: (3,3,4), (4,4,4).
{
  const plan = expertPlan([2, 1, 3]);
  ok(plan.join() === "0,2,2", `the book's run spares B1 then the star twice, got ${plan}`);
  ok(applyPlan([2, 1, 3], plan).join() === "4,4,4",
     `(2,1,3) levels at 4 each, got ${applyPlan([2, 1, 3], plan)}`);
}

// --- The plan levels any configuration ------------------------------
{
  const rand = lcg(5);
  for (let trial = 0; trial < 600; trial++) {
    const n = 2 + Math.floor(rand() * 6);
    const bins = Array.from({ length: n }, () => Math.floor(rand() * 9));
    const end = applyPlan(bins, expertPlan(bins));
    ok(isLevel(end), `plan failed to level ${bins} -- reached ${end}`);
    ok(end.length === n, "the plan does not change how many bins there are");
  }
}

// Bins that are level already need no moves.
ok(expertPlan([3, 3, 3, 3]).length === 0, "level bins need no moves");
ok(expertPlan([0, 0]).length === 0, "two level bins need no moves");

// --- THE CHAPTER'S CLAIM: the star ends up ahead, never behind ------
// After the expert has levelled the other n-1 bins, the star holds
// b* + K and the rest hold b' <= b* + K. That is what makes the closing
// moves possible, and it is exactly why the star must start as a fullest
// bin.
{
  const rand = lcg(13);
  for (let trial = 0; trial < 600; trial++) {
    const n = 3 + Math.floor(rand() * 5);
    const bins = Array.from({ length: n }, () => Math.floor(rand() * 9));
    const star = maxIndex(bins);
    const others = bins.map((_, i) => i).filter((i) => i !== star);

    const sub = expertPlan(others.map((i) => bins[i])).map((s) => others[s]);
    const after = applyPlan(bins, sub);

    const levels = others.map((i) => after[i]);
    ok(isLevel(levels), `the expert should level the delegated bins, got ${levels}`);
    ok(after[star] >= levels[0],
       `star fell behind: ${bins} -> ${after}, star ${after[star]} vs ${levels[0]}`);
    ok(after[star] === bins[star] + sub.length,
       "the star collects exactly one ball per expert move");
  }
}

// And the reason the star must be a FULLEST bin: pick an emptiest one
// instead and it can finish behind, with no move able to catch it up.
{
  const bins = [0, 5, 5];
  const star = 0;                        // deliberately the wrong choice
  const others = [1, 2];
  const sub = expertPlan(others.map((i) => bins[i])).map((s) => others[s]);
  const after = applyPlan(bins, sub);
  ok(after[star] < after[1], `an emptiest star finishes behind, got ${after}`);
}

// --- No plan can be shorter than the minimum ------------------------
{
  const rand = lcg(29);
  for (let trial = 0; trial < 400; trial++) {
    const n = 2 + Math.floor(rand() * 5);
    const bins = Array.from({ length: n }, () => Math.floor(rand() * 7));
    ok(expertPlan(bins).length >= fewestMoves(bins),
       `plan for ${bins} beat the minimum, which is impossible`);
  }
}
ok(fewestMoves([2, 1, 3]) === 3, `(2,1,3) needs 3 moves, got ${fewestMoves([2, 1, 3])}`);
ok(fewestMoves([0, 1, 2]) === 3, "the exercise's (0,1,2) needs 3 moves");
ok(fewestMoves([4, 4]) === 0, "level bins need none");

// --- Starting positions ---------------------------------------------
{
  const rand = lcg(31);
  for (let trial = 0; trial < 200; trial++) {
    const n = 2 + Math.floor(rand() * 5);
    const bins = randomStart(n, rand);
    ok(bins.length === n, "a start has the right number of bins");
    ok(!isLevel(bins), `a start should not be level already, got ${bins}`);
    ok(bins.every((b) => b >= 0), "counts are never negative");
  }
}

console.log(fails === 0 ? "ball boggle: all checks passed" : `ball boggle: ${fails} FAILED`);
process.exit(fails === 0 ? 0 : 1);
