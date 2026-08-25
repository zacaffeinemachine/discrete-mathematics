import {
  solve, shadeTiles, tileCount, size, keyOf, orientationCells, canPlace,
  ORIENTATIONS, type Cell,
} from "../src/components/games/models/tromino.ts";

let fails = 0;
const ok = (c: boolean, m: string) => { if (!c) { console.error("FAIL:", m); fails++; } };

// The tile is an L: three cells inside a 2x2 box, one corner omitted.
for (const o of ORIENTATIONS) {
  const cs = orientationCells(o.key, 0, 0);
  ok(cs.length === 3, `${o.key}: three cells`);
  ok(new Set(cs.map(keyOf)).size === 3, `${o.key}: cells are distinct`);
  ok(cs.every((c) => c.r <= 1 && c.c <= 1), `${o.key}: fits a 2x2 box`);
}

// EXHAUSTIVE for n = 1..3: every hole position must tile perfectly.
for (let n = 1; n <= 3; n++) {
  const s = size(n);
  for (let hr = 0; hr < s; hr++) {
    for (let hc = 0; hc < s; hc++) {
      const hole: Cell = { r: hr, c: hc };
      const tiles = solve(0, 0, s, hole);

      ok(tiles.length === tileCount(n),
        `n=${n} hole ${hr},${hc}: ${tiles.length} tiles, expected ${tileCount(n)}`);

      const seen = new Map<string, number>();
      for (const t of tiles) {
        ok(t.cells.length === 3, "a tile covers three cells");
        // Each tile must be an L, i.e. sit inside some 2x2 box.
        const rs = t.cells.map((c) => c.r), cs2 = t.cells.map((c) => c.c);
        ok(Math.max(...rs) - Math.min(...rs) === 1 && Math.max(...cs2) - Math.min(...cs2) === 1,
          `n=${n} hole ${hr},${hc}: a tile is not an L: ${JSON.stringify(t.cells)}`);
        for (const c of t.cells) {
          ok(c.r >= 0 && c.c >= 0 && c.r < s && c.c < s,
            `n=${n} hole ${hr},${hc}: cell off the board`);
          ok(!(c.r === hole.r && c.c === hole.c),
            `n=${n} hole ${hr},${hc}: a tile covered the hole`);
          const k = keyOf(c);
          ok(!seen.has(k), `n=${n} hole ${hr},${hc}: overlap at ${k}`);
          seen.set(k, 1);
        }
      }
      ok(seen.size === s * s - 1,
        `n=${n} hole ${hr},${hc}: covered ${seen.size}, expected ${s * s - 1}`);

      // Shading: no two edge-adjacent tiles share a shade.
      const shaded = shadeTiles(tiles);
      const owner = new Map<string, number>();
      shaded.forEach((t, i) => t.cells.forEach((c) => owner.set(keyOf(c), i)));
      for (const [k, i] of owner) {
        const [r, c] = k.split(",").map(Number);
        for (const a of [[r-1,c],[r+1,c],[r,c-1],[r,c+1]] as const) {
          const j = owner.get(`${a[0]},${a[1]}`);
          if (j != null && j !== i) {
            ok(shaded[i].shade !== shaded[j].shade,
              `n=${n} hole ${hr},${hc}: touching tiles share shade ${shaded[i].shade}`);
          }
        }
        ok(shaded[i].shade >= 0 && shaded[i].shade < 5, "shade is one of five");
      }
    }
  }
}

// Spot-check n = 4 on a few holes: 85 tiles each.
for (const hole of [{ r: 0, c: 0 }, { r: 7, c: 8 }, { r: 15, c: 15 }, { r: 3, c: 11 }]) {
  const tiles = solve(0, 0, 16, hole as Cell);
  ok(tiles.length === 85, `n=4 hole ${hole.r},${hole.c}: ${tiles.length} tiles, expected 85`);
  const seen = new Set(tiles.flatMap((t) => t.cells.map(keyOf)));
  ok(seen.size === 255, `n=4 hole ${hole.r},${hole.c}: covered ${seen.size}, expected 255`);
}

// The book's numbers.
ok(tileCount(3) === 21, `an 8x8 board takes 21 tiles, got ${tileCount(3)}`);
ok(tileCount(1) === 1, "a 2x2 board takes one tile");
ok(tileCount(2) === 5, "a 4x4 board takes five tiles");

// canPlace refuses the hole, an overlap, and the edge.
{
  const hole: Cell = { r: 0, c: 0 };
  const occupied = new Set([keyOf({ r: 2, c: 2 })]);
  ok(!canPlace(orientationCells("missing-br", 0, 0), 2, hole, occupied), "refuses the hole");
  ok(!canPlace(orientationCells("missing-tl", 1, 1), 2, hole, occupied), "refuses an overlap");
  ok(!canPlace(orientationCells("missing-tl", 3, 3), 2, hole, new Set()), "refuses off-board");
  ok(canPlace(orientationCells("missing-tl", 0, 0), 2, { r: 3, c: 3 }, new Set()), "allows a clear spot");
}

console.log(fails === 0 ? "tromino: all checks passed" : `tromino: ${fails} FAILED`);
process.exit(fails === 0 ? 0 : 1);
