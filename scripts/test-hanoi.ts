import {
  initialPegs, canMove, applyMove, transfer, subTowerPeg, expertTarget, TARGET,
  type Pegs,
} from "../src/components/games/models/hanoi.ts";

let fails = 0;
const ok = (cond: boolean, msg: string) => {
  if (!cond) { console.error("FAIL:", msg); fails++; }
};

for (let n = 1; n <= 10; n++) {
  let pegs: Pegs = initialPegs(n);
  const ms = transfer(n, 0, TARGET, 1);
  ok(ms.length === 2 ** n - 1, `n=${n}: ${ms.length} moves, expected ${2 ** n - 1}`);
  for (const m of ms) {
    ok(canMove(pegs, m.from, m.to), `n=${n}: illegal move ${m.from}->${m.to}`);
    pegs = applyMove(pegs, m);
  }
  ok(pegs[TARGET].length === n, `n=${n}: tower did not arrive`);
  ok(
    pegs[TARGET].join() === initialPegs(n)[0].join(),
    `n=${n}: arrived out of order: ${pegs[TARGET]}`
  );
}

// The expert is offered at the start, parks the sub-tower on the spare peg,
// and after the largest disc moves is offered again, now aiming home.
{
  const n = 4;
  let pegs: Pegs = initialPegs(n);
  ok(subTowerPeg(pegs, n) === 0, "start: sub-tower is on peg A");
  const t1 = expertTarget(pegs, n);
  ok(t1 === 1, `start: expert should park on B, got ${t1}`);

  for (const m of transfer(n - 1, 0, 1, TARGET)) pegs = applyMove(pegs, m);
  ok(pegs[0].join() === "4", `after delegation peg A holds only the largest, got ${pegs[0]}`);
  ok(canMove(pegs, 0, TARGET), "largest disc can now move home");
  pegs = applyMove(pegs, { from: 0, to: TARGET });

  ok(subTowerPeg(pegs, n) === 1, "sub-tower is now on peg B");
  const t2 = expertTarget(pegs, n);
  ok(t2 === TARGET, `expert should now aim home, got ${t2}`);
  for (const m of transfer(n - 1, 1, TARGET, 0)) pegs = applyMove(pegs, m);
  ok(pegs[TARGET].length === n, "delegation finishes the puzzle");
}

// Scattered smaller discs: the expert must NOT be offered.
{
  const pegs: Pegs = [[4, 3], [2], [1]];
  ok(subTowerPeg(pegs, 4) === null, "scattered discs offer no delegation");
  ok(expertTarget(pegs, 4) === null, "scattered discs give no target");
}

// A disc may not land on a smaller one.
{
  const pegs: Pegs = [[3], [1], []];
  ok(!canMove(pegs, 0, 1), "3 must not land on 1");
  ok(canMove(pegs, 1, 0), "1 may land on 3");
  ok(canMove(pegs, 0, 2), "3 may move to an empty peg");
}

console.log(fails === 0 ? "hanoi: all checks passed" : `hanoi: ${fails} FAILED`);
process.exit(fails === 0 ? 0 : 1);
