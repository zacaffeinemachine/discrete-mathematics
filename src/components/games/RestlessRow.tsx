import { useEffect, useRef, useState } from "react";
import { PuzzleFrame, Button, Stat, Verdict, SegmentedControl } from "./ui";
import { useAvailableWidth, useBoardSize, BoardSizeControl, fitCell } from "./boardSize";
import {
  type MoveSet,
  type Pair,
  isSorted,
  legalMoves,
  swap,
  shuffled,
} from "./models/restlessRow";

/**
 * The Restless Row -- Induction, chapter 6.
 *
 * The chapter has no figure in the book, so this is its only picture. What
 * it has to show is the MONOVARIANT: the row never gets shorter, but the
 * inversion count falls by exactly one at every move, and a quantity that
 * falls by one each time cannot fall for ever.
 *
 * The three move-sets are the point of the exercise section, so they are a
 * control rather than three separate widgets: the same row, the same
 * counter, three rules, visibly different behaviour.
 */

const MOVE_SETS = [
  { key: "adjacent" as const, label: "Neighbours, out of order", title: "The chapter's rule: swap two neighbours standing in the wrong order." },
  { key: "far" as const, label: "Any pair, out of order", title: "Swap any out-of-order pair, adjacent or not." },
  { key: "any" as const, label: "Any neighbours", title: "Swap neighbours whether or not they are out of order." },
];

const BOOK_ROW = [4, 2, 5, 1, 3];

export default function RestlessRow() {
  const [row, setRow] = useState<number[]>(BOOK_ROW);
  const [startRow, setStartRow] = useState<number[]>(BOOK_ROW);
  const [moveSet, setMoveSet] = useState<MoveSet>("adjacent");
  const [moves, setMoves] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [refused, setRefused] = useState(false);
  const [running, setRunning] = useState(false);

  const { sizeKey, factor, setSizeKey } = useBoardSize();
  const { ref, width } = useAvailableWidth<HTMLDivElement>();

  const legal = legalMoves(row, moveSet);
  const sorted = isSorted(row);
  const stuck = legal.length === 0;

  const legalKey = new Set(legal.map((p) => `${p.i}-${p.j}`));
  const isLegalPair = (i: number, j: number) =>
    legalKey.has(`${Math.min(i, j)}-${Math.max(i, j)}`);

  const doSwap = (p: Pair) => {
    setRow((r) => swap(r, p));
    setMoves((m) => m + 1);
  };

  const clickTile = (idx: number) => {
    if (running) return;
    if (selected == null) {
      setSelected(idx);
      return;
    }
    if (selected === idx) {
      setSelected(null);
      return;
    }
    const p = { i: Math.min(selected, idx), j: Math.max(selected, idx) };
    if (isLegalPair(p.i, p.j)) {
      doSwap(p);
      setSelected(null);
    } else {
      setRefused(true);
      window.setTimeout(() => setRefused(false), 380);
      setSelected(idx);
    }
  };

  // Auto-run. Its real job is the third rule, where the run visibly never
  // settles down however long it is left going.
  const tick = useRef<number | null>(null);
  useEffect(() => {
    if (!running) return;
    const ms = legalMoves(row, moveSet);
    if (!ms.length) {
      setRunning(false);
      return;
    }
    tick.current = window.setTimeout(() => {
      doSwap(ms[Math.floor(Math.random() * ms.length)]);
    }, 320);
    return () => {
      if (tick.current) window.clearTimeout(tick.current);
    };
  }, [running, row, moveSet]);

  const reset = () => {
    setRow(startRow);
    setMoves(0);
    setSelected(null);
    setRunning(false);
  };

  const reshuffle = (n = row.length) => {
    // Shuffling only ever happens on a click, never during the first render,
    // so the server and client markup agree.
    let next = shuffled(n);
    let guard = 0;
    while (isSorted(next) && guard++ < 20) next = shuffled(n);
    setRow(next);
    setStartRow(next);
    setMoves(0);
    setSelected(null);
    setRunning(false);
  };

  // Geometry
  const n = row.length;
  const tileW = fitCell(Math.round(48 * factor), n, width);
  const tileH = Math.round(tileW * 0.92);
  const rowW = n * tileW + (n - 1) * 6;

  return (
    <PuzzleFrame
      toolbar={
        <>
          <SegmentedControl options={MOVE_SETS} value={moveSet} onChange={(v) => { setMoveSet(v); setRunning(false); setSelected(null); }} label="Rule" />
          <BoardSizeControl sizeKey={sizeKey} setSizeKey={setSizeKey} />
        </>
      }
      caption={<>Click one entry and then another to swap them.</>}
    >
      <div ref={ref} className="scroll-x mb-4">
        <div style={{ width: rowW, minWidth: rowW, margin: "0 auto" }}>

          <div className="flex gap-[6px]" style={{ marginTop: 2 }}>
            {row.map((v, i) => {
              const isSel = selected === i;
              const partOfLegal = legal.some((p) => p.i === i || p.j === i);
              return (
                <button
                  key={`${i}-${v}`}
                  type="button"
                  onClick={() => clickTile(i)}
                  aria-label={`Entry ${v} at position ${i + 1}`}
                  className="rounded-md tabular-nums font-bold transition-colors"
                  style={{
                    width: tileW,
                    height: tileH,
                    fontSize: Math.round(tileW * 0.42),
                    background: isSel ? "var(--accent-soft)" : "var(--bg)",
                    color: isSel ? "var(--accent)" : "var(--ink)",
                    border: `1px solid ${
                      isSel ? "var(--accent)" : partOfLegal ? "var(--rule)" : "var(--rule)"
                    }`,
                    opacity: partOfLegal || isSel ? 1 : 0.55,
                    cursor: running ? "default" : "pointer",
                  }}
                >
                  {v}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-x-6 gap-y-3 mb-4">
        <Stat label="Moves made" value={moves} tone={sorted ? "good" : undefined} />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={() => setRunning((r) => !r)} disabled={stuck} primary={running}>
          {running ? "Stop" : "Run at random"}
        </Button>
        <Button onClick={reset} disabled={moves === 0}>Reset</Button>
        <Button onClick={() => reshuffle()}>Shuffle</Button>
        <Button onClick={() => reshuffle(Math.min(9, n + 1))} disabled={n >= 9}>Longer</Button>
        <Button onClick={() => reshuffle(Math.max(3, n - 1))} disabled={n <= 3}>Shorter</Button>
      </div>

      <div className="mt-3">
        {refused && <Verdict tone="bad">That pair is not one the rule allows.</Verdict>}
        {!refused && sorted && stuck && (
          <Verdict tone="good">
            In order, and no move is left. It took {moves} move{moves === 1 ? "" : "s"}.
          </Verdict>
        )}
      </div>
    </PuzzleFrame>
  );
}
