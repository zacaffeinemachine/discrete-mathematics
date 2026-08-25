/**
 * Tromino Trouble -- Induction, chapter 4.
 *
 * A 2^n x 2^n board with exactly one square removed can be covered by
 * L-trominoes. The count works out: 4^n is never divisible by 3 but
 * 4^n - 1 always is, so the hole is necessary, and the theorem says it is
 * also sufficient -- wherever the hole happens to be.
 *
 * The argument is a quartering. Cut the board into four quadrants; the hole
 * lies in one of them. Lay ONE tromino over the three inner corners of the
 * other three quadrants. Now every quadrant is a half-size board with
 * exactly one square missing, and each goes to the expert.
 */

export type Cell = { r: number; c: number };
/** A placed tile: three cells, plus the colour class it was given. */
export type Tile = { cells: [Cell, Cell, Cell]; shade: number };

/**
 * The four orientations, as offsets from the tile's 2x2 bounding box. Each
 * omits one corner of the box -- that omitted corner names the shape.
 */
export const ORIENTATIONS = [
  { key: "missing-tl", cells: [{ r: 0, c: 1 }, { r: 1, c: 0 }, { r: 1, c: 1 }] },
  { key: "missing-tr", cells: [{ r: 0, c: 0 }, { r: 1, c: 0 }, { r: 1, c: 1 }] },
  { key: "missing-bl", cells: [{ r: 0, c: 0 }, { r: 0, c: 1 }, { r: 1, c: 1 }] },
  { key: "missing-br", cells: [{ r: 0, c: 0 }, { r: 0, c: 1 }, { r: 1, c: 0 }] },
] as const;

export type OrientationKey = (typeof ORIENTATIONS)[number]["key"];

export const size = (n: number) => 2 ** n;
export const tileCount = (n: number) => (4 ** n - 1) / 3;

export const keyOf = (c: Cell) => `${c.r},${c.c}`;

/** Cells of the orientation `k` when its bounding box has corner (r, c). */
export function orientationCells(k: OrientationKey, r: number, c: number): Cell[] {
  const o = ORIENTATIONS.find((x) => x.key === k)!;
  return o.cells.map((d) => ({ r: r + d.r, c: c + d.c }));
}

export function inBounds(cells: readonly Cell[], n: number): boolean {
  const s = size(n);
  return cells.every((c) => c.r >= 0 && c.c >= 0 && c.r < s && c.c < s);
}

/** May these three cells be covered: on the board, empty, and not the hole? */
export function canPlace(
  cells: readonly Cell[],
  n: number,
  hole: Cell,
  occupied: ReadonlySet<string>
): boolean {
  if (!inBounds(cells, n)) return false;
  return cells.every(
    (c) => !(c.r === hole.r && c.c === hole.c) && !occupied.has(keyOf(c))
  );
}

/**
 * Solve a square sub-board by quartering.
 *
 * `r0, c0` is its top-left corner, `s` its side (a power of two), and
 * `hole` the one square already missing from it. Tiles come back in the
 * order they are laid, so an animation can simply play the list.
 */
export function solve(r0: number, c0: number, s: number, hole: Cell): Tile[] {
  if (s === 1) return [];
  const h = s / 2;
  const midR = r0 + h;
  const midC = c0 + h;

  // Which quadrant holds the hole? 0 TL, 1 TR, 2 BL, 3 BR.
  const top = hole.r < midR;
  const left = hole.c < midC;
  const quad = top ? (left ? 0 : 1) : left ? 2 : 3;

  // The bridge tile covers the inner corner of each of the other three.
  const inner: Cell[] = [
    { r: midR - 1, c: midC - 1 }, // TL's inner corner
    { r: midR - 1, c: midC },     // TR's
    { r: midR, c: midC - 1 },     // BL's
    { r: midR, c: midC },         // BR's
  ];
  const bridgeCells = inner.filter((_, i) => i !== quad) as [Cell, Cell, Cell];
  const bridge: Tile = { cells: bridgeCells, shade: 0 };

  // Each quadrant is now a board of side h with exactly one square gone:
  // the real hole in one, the bridge's cell in the other three.
  const holes: Cell[] = inner.map((cell, i) => (i === quad ? hole : cell));
  const corners: Cell[] = [
    { r: r0, c: c0 },
    { r: r0, c: midC },
    { r: midR, c: c0 },
    { r: midR, c: midC },
  ];

  const out: Tile[] = [bridge];
  for (let i = 0; i < 4; i++) {
    out.push(...solve(corners[i].r, corners[i].c, h, holes[i]));
  }
  return out;
}

/**
 * Give each tile a shade so that no two touching tiles share one. Greedy
 * over five classes, matching the shading of `ind-tromino-tiled.pdf`.
 */
export function shadeTiles(tiles: readonly Tile[]): Tile[] {
  const owner = new Map<string, number>();
  tiles.forEach((t, i) => t.cells.forEach((c) => owner.set(keyOf(c), i)));

  const shades: number[] = [];
  tiles.forEach((t, i) => {
    const taken = new Set<number>();
    for (const c of t.cells) {
      const around: Cell[] = [
        { r: c.r - 1, c: c.c }, { r: c.r + 1, c: c.c },
        { r: c.r, c: c.c - 1 }, { r: c.r, c: c.c + 1 },
      ];
      for (const a of around) {
        const j = owner.get(keyOf(a));
        if (j != null && j !== i && shades[j] != null) taken.add(shades[j]);
      }
    }
    let s = 0;
    while (taken.has(s)) s++;
    shades[i] = s % 5;
  });

  return tiles.map((t, i) => ({ ...t, shade: shades[i] }));
}
