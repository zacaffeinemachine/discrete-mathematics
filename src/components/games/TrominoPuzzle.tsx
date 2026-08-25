import { useEffect, useMemo, useRef, useState } from "react";
import { PuzzleFrame, Button, Stat, Verdict, SegmentedControl } from "./ui";
import { useAvailableWidth, useBoardSize, BoardSizeControl, fitCell } from "./boardSize";
import {
  type Cell,
  type Tile,
  type OrientationKey,
  ORIENTATIONS,
  canPlace,
  keyOf,
  orientationCells,
  shadeTiles,
  size,
  solve,
  tileCount,
} from "./models/tromino";

/**
 * Tromino Trouble -- Induction, chapter 4.
 *
 * Two ways in. FREE PLAY is the puzzle: pick where the hole goes, pick an
 * orientation, and cover the rest by hand. DELEGATION is the proof: quarter
 * the board, drop one tile across the three whole quadrants, and hand each
 * quarter -- now a smaller board with one square missing -- to the expert.
 *
 * The delegation runs a level at a time so the student can watch the
 * frontier of sub-boards halve, which is the part a static figure cannot
 * show.
 *
 * COPY RULE: this is chapter 4. Descent only, and the word is EXPERT.
 */

type Mode = "play" | "delegate";
type Board = { r0: number; c0: number; s: number; hole: Cell };

const MODES = [
  { key: "play" as const, label: "Play", title: "Place the tiles yourself." },
  { key: "delegate" as const, label: "Delegate", title: "Quarter the board and hand each quarter to the expert." },
];

export default function TrominoPuzzle() {
  const [n, setN] = useState(3);
  const [hole, setHole] = useState<Cell>({ r: 2, c: 5 });
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [mode, setMode] = useState<Mode>("play");
  const [orient, setOrient] = useState<OrientationKey>("missing-tl");
  const [hover, setHover] = useState<Cell | null>(null);
  const [refused, setRefused] = useState(false);
  const [holePick, setHolePick] = useState(false);
  const [frontier, setFrontier] = useState<Board[]>([]);
  const [queue, setQueue] = useState<Tile[]>([]);

  const { sizeKey, factor, setSizeKey } = useBoardSize();
  const { ref, width } = useAvailableWidth<HTMLDivElement>();

  const s = size(n);
  const total = tileCount(n);
  const occupied = useMemo(() => {
    const set = new Set<string>();
    tiles.forEach((t) => t.cells.forEach((c) => set.add(keyOf(c))));
    return set;
  }, [tiles]);

  const shaded = useMemo(() => shadeTiles(tiles), [tiles]);
  const ownerOf = useMemo(() => {
    const m = new Map<string, number>();
    shaded.forEach((t, i) => t.cells.forEach((c) => m.set(keyOf(c), i)));
    return m;
  }, [shaded]);

  const done = tiles.length === total;
  const started = tiles.length > 0;

  const reset = (nextN = n, nextHole?: Cell) => {
    setN(nextN);
    const sz = size(nextN);
    const h = nextHole ?? { r: Math.floor(sz / 2) - 1, c: Math.floor(sz / 2) + 1 };
    setHole({ r: Math.min(h.r, sz - 1), c: Math.min(h.c, sz - 1) });
    setTiles([]);
    setFrontier([]);
    setQueue([]);
    setHover(null);
    setHolePick(false);
  };

  // Animate a queued run of tiles, so "finish" reads as work being done.
  const timer = useRef<number | null>(null);
  useEffect(() => {
    if (!queue.length) return;
    timer.current = window.setTimeout(() => {
      setTiles((t) => [...t, queue[0]]);
      setQueue((q) => q.slice(1));
    }, Math.max(14, 110 - n * 18));
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [queue, n]);

  const busy = queue.length > 0;

  const clickCell = (r: number, c: number) => {
    if (busy) return;

    // Moving the hole is an explicit, armed action. It used to happen on any
    // click while the board was empty, which deadlocked Play mode: a tile
    // could never be laid, because laying one was what ended hole-picking.
    if (holePick) {
      setHole({ r, c });
      setHolePick(false);
      setFrontier([]);
      return;
    }

    if (mode !== "play") return;
    const cells = orientationCells(orient, r, c);
    if (canPlace(cells, n, hole, occupied)) {
      setTiles((t) => [...t, { cells: cells as [Cell, Cell, Cell], shade: 0 }]);
    } else {
      setRefused(true);
      window.setTimeout(() => setRefused(false), 380);
    }
  };

  /** One level of the argument: bridge every sub-board, then quarter it. */
  const stepDelegate = () => {
    const boards = frontier.length ? frontier : [{ r0: 0, c0: 0, s, hole }];
    const live = boards.filter((b) => b.s > 1);
    if (!live.length) return;

    const newTiles: Tile[] = [];
    const next: Board[] = [];
    for (const b of live) {
      const h = b.s / 2;
      const midR = b.r0 + h;
      const midC = b.c0 + h;
      const top = b.hole.r < midR;
      const left = b.hole.c < midC;
      const quad = top ? (left ? 0 : 1) : left ? 2 : 3;
      const inner: Cell[] = [
        { r: midR - 1, c: midC - 1 },
        { r: midR - 1, c: midC },
        { r: midR, c: midC - 1 },
        { r: midR, c: midC },
      ];
      newTiles.push({
        cells: inner.filter((_, i) => i !== quad) as [Cell, Cell, Cell],
        shade: 0,
      });
      const corners = [
        { r: b.r0, c: b.c0 },
        { r: b.r0, c: midC },
        { r: midR, c: b.c0 },
        { r: midR, c: midC },
      ];
      for (let i = 0; i < 4; i++) {
        next.push({
          r0: corners[i].r,
          c0: corners[i].c,
          s: h,
          hole: i === quad ? b.hole : inner[i],
        });
      }
    }
    setTiles((t) => [...t, ...newTiles]);
    setFrontier(next.filter((b) => b.s > 1));
  };

  const finish = () => {
    const boards = frontier.length ? frontier : [{ r0: 0, c0: 0, s, hole }];
    const rest: Tile[] = [];
    for (const b of boards) rest.push(...solve(b.r0, b.c0, b.s, b.hole));
    setFrontier([]);
    setQueue(rest);
  };

  // Geometry
  const cellPx = fitCell(Math.round((n <= 2 ? 46 : 30) * factor), s, width);
  const boardPx = cellPx * s;

  const previewCells =
    mode === "play" && !holePick && hover && !busy
      ? orientationCells(orient, hover.r, hover.c)
      : [];
  const previewOk =
    previewCells.length > 0 && canPlace(previewCells, n, hole, occupied);
  const previewKeys = new Set(previewCells.map(keyOf));

  // Quadrant dividers for whatever sub-boards are currently in play.
  const dividers = (frontier.length ? frontier : []).map((b, i) => (
    <div
      key={`d${i}`}
      style={{
        position: "absolute",
        left: b.c0 * cellPx,
        top: b.r0 * cellPx,
        width: b.s * cellPx,
        height: b.s * cellPx,
        border: "1px dashed var(--accent)",
        pointerEvents: "none",
        opacity: 0.75,
      }}
    />
  ));

  return (
    <PuzzleFrame
      toolbar={
        <>
          <SegmentedControl options={MODES} value={mode} onChange={(m) => { setMode(m); setHover(null); }} label="Mode" />
          <SegmentedControl
            options={[1, 2, 3, 4].map((k) => ({ key: String(k), label: `${2 ** k}×${2 ** k}` }))}
            value={String(n)}
            onChange={(v) => reset(Number(v))}
            label="Board"
          />
          <BoardSizeControl sizeKey={sizeKey} setSizeKey={setSizeKey} />
        </>
      }
      caption={
        holePick ? (
          <>Click the square the hole should move to. Wherever you put it, the rest can still
            be covered.</>
        ) : mode === "play" ? (
          <>Pick a shape, then click the board — the click sets the top-left corner of the
            tile's two-by-two box.</>
        ) : started ? (
          <>Each dashed square is a smaller board with one square already missing — exactly
            the problem we started with.</>
        ) : (
          <>Quarter the board and hand each quarter to the expert.</>
        )
      }
    >
      <div ref={ref} className="scroll-x mb-4">
        <div
          style={{
            position: "relative",
            width: boardPx,
            height: boardPx,
            margin: "0 auto",
            border: "1px solid var(--rule)",
            borderRadius: 6,
            overflow: "hidden",
          }}
          onMouseLeave={() => setHover(null)}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${s}, ${cellPx}px)`,
              gridTemplateRows: `repeat(${s}, ${cellPx}px)`,
            }}
          >
            {Array.from({ length: s * s }, (_, idx) => {
              const r = Math.floor(idx / s);
              const c = idx % s;
              const k = `${r},${c}`;
              const isHole = r === hole.r && c === hole.c;
              const owner = ownerOf.get(k);
              const inPreview = previewKeys.has(k);

              let bg: string;
              if (isHole) bg = "var(--cell-hole)";
              else if (owner != null) bg = `var(--tile-${(shaded[owner].shade % 5) + 1})`;
              else bg = (r + c) % 2 === 0 ? "var(--cell-a)" : "var(--cell-b)";

              // Draw a hairline only where two DIFFERENT tiles meet, so each
              // L reads as one piece rather than as three squares.
              const edge = (dr: number, dc: number) => {
                const o = ownerOf.get(`${r + dr},${c + dc}`);
                return owner != null && o !== owner ? "1px solid var(--bg)" : "none";
              };

              return (
                <button
                  key={k}
                  type="button"
                  onMouseEnter={() => setHover({ r, c })}
                  onFocus={() => setHover({ r, c })}
                  onClick={() => clickCell(r, c)}
                  aria-label={
                    isHole ? `Row ${r + 1} column ${c + 1}, the hole`
                    : owner != null ? `Row ${r + 1} column ${c + 1}, covered`
                    : `Row ${r + 1} column ${c + 1}, empty`
                  }
                  style={{
                    width: cellPx,
                    height: cellPx,
                    background: bg,
                    borderTop: edge(-1, 0),
                    borderBottom: edge(1, 0),
                    borderLeft: edge(0, -1),
                    borderRight: edge(0, 1),
                    outline: inPreview
                      ? `2px solid ${previewOk ? "var(--accent)" : "var(--bad)"}`
                      : "none",
                    outlineOffset: -2,
                    padding: 0,
                    cursor: busy ? "default" : "pointer",
                    transition: "background 140ms",
                  }}
                >
                  {isHole && (
                    <span
                      aria-hidden="true"
                      style={{
                        display: "block",
                        width: "38%",
                        height: "38%",
                        margin: "0 auto",
                        borderRadius: 2,
                        background: "var(--faint)",
                      }}
                    />
                  )}
                </button>
              );
            })}
          </div>
          {dividers}
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-x-6 gap-y-3 mb-4">
        <Stat label="Tiles laid" value={tiles.length} tone={done ? "good" : undefined} />
        <Stat label="Squares left" value={s * s - 1 - tiles.length * 3} />
      </div>

      {mode === "play" ? (
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs uppercase tracking-wider text-[var(--muted)]">Shape</span>
          {ORIENTATIONS.map((o) => (
            <button
              key={o.key}
              type="button"
              onClick={() => setOrient(o.key)}
              aria-pressed={orient === o.key}
              aria-label={`Orientation ${o.key}`}
              className="rounded-md p-1.5 transition-colors"
              style={{
                border: `1px solid ${orient === o.key ? "var(--accent)" : "var(--rule)"}`,
                background: orient === o.key ? "var(--accent-soft)" : "transparent",
              }}
            >
              <span style={{ display: "grid", gridTemplateColumns: "12px 12px", gap: 2 }}>
                {[0, 1, 2, 3].map((q) => {
                  const rr = q < 2 ? 0 : 1;
                  const cc = q % 2;
                  const on = o.cells.some((d) => d.r === rr && d.c === cc);
                  return (
                    <span
                      key={q}
                      style={{
                        width: 12,
                        height: 12,
                        borderRadius: 2,
                        background: on ? "var(--accent)" : "transparent",
                        border: on ? "none" : "1px dashed var(--rule)",
                      }}
                    />
                  );
                })}
              </span>
            </button>
          ))}
          <Button
            onClick={() => setHolePick((v) => !v)}
            disabled={started || busy}
            primary={holePick}
            title={started ? "Clear the board first" : "Then click the square it should move to"}
          >
            {holePick ? "Pick a square…" : "Move the hole"}
          </Button>
          <Button onClick={() => reset(n, hole)} disabled={!started || busy}>Clear</Button>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={stepDelegate} disabled={done || busy} primary={!done && !busy}>
            {frontier.length ? "Quarter again" : "Quarter, and bridge"}
          </Button>
          <Button onClick={finish} disabled={done || busy}>Hand it all to the expert</Button>
          <Button
            onClick={() => setHolePick((v) => !v)}
            disabled={started || busy}
            primary={holePick}
          >
            {holePick ? "Pick a square…" : "Move the hole"}
          </Button>
          <Button onClick={() => reset(n, hole)} disabled={!started || busy}>Clear</Button>
        </div>
      )}

      <div className="mt-3">
        {refused && <Verdict tone="bad">That tile will not fit there.</Verdict>}
        {!refused && done && <Verdict tone="good">Covered.</Verdict>}
      </div>
    </PuzzleFrame>
  );
}
