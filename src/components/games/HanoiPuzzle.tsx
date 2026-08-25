import { useCallback, useEffect, useRef, useState } from "react";
import { PuzzleFrame, Button, Stat, Slider, Verdict } from "./ui";
import { useAvailableWidth, useBoardSize, BoardSizeControl, fitCell } from "./boardSize";
import Tex from "../Tex";
import {
  type Pegs,
  type Move,
  SOURCE,
  TARGET,
  initialPegs,
  canMove,
  applyMove,
  transfer,
  subTowerPeg,
  expertTarget,
} from "./models/hanoi";

/**
 * Tower of Hanoi -- Induction, chapter 3.
 *
 * Discs are integers: 1 is the smallest, n the largest. A peg is an array
 * with its BOTTOM disc first, so the top of peg p is p[p.length - 1] and a
 * move is legal when the moving disc is smaller than what it lands on.
 *
 * The button that matters here is "Ask the expert". The book's proof hands
 * the top n-1 discs to somebody who already knows how to move a tower that
 * size, moves the largest disc by hand, and delegates again. The button
 * performs exactly that delegation, as one animated chunk, so the student
 * sees the argument rather than only the puzzle.
 *
 * COPY RULE: chapters 1-12 of the book use descent only, and the teaching
 * script says to speak of the EXPERT, never of recursion. Obey that here.
 */

export default function HanoiPuzzle() {
  const [n, setN] = useState(4);
  const [pegs, setPegs] = useState<Pegs>(() => initialPegs(4));
  const [moves, setMoves] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [refused, setRefused] = useState<number | null>(null);
  const [queue, setQueue] = useState<Move[]>([]);

  const { sizeKey, factor, setSizeKey } = useBoardSize();
  const { ref, width } = useAvailableWidth<HTMLDivElement>();

  const reset = useCallback((k: number) => {
    setN(k);
    setPegs(initialPegs(k));
    setMoves(0);
    setSelected(null);
    setQueue([]);
  }, []);

  // Play a queued sequence one move at a time, so a delegation reads as a
  // process rather than a jump cut.
  const timer = useRef<number | null>(null);
  useEffect(() => {
    if (!queue.length) return;
    timer.current = window.setTimeout(() => {
      setPegs((p) => applyMove(p, queue[0]));
      setMoves((m) => m + 1);
      setQueue((q) => q.slice(1));
    }, 260);
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [queue]);

  const playing = queue.length > 0;
  const solved = pegs[TARGET].length === n;
  const optimal = 2 ** n - 1;

  const clickPeg = (p: number) => {
    if (playing || solved) return;
    if (selected == null) {
      if (pegs[p].length) setSelected(p);
      return;
    }
    if (selected === p) {
      setSelected(null);
      return;
    }
    if (canMove(pegs, selected, p)) {
      setPegs(applyMove(pegs, { from: selected, to: p }));
      setMoves((m) => m + 1);
      setSelected(null);
    } else {
      setRefused(p);
      window.setTimeout(() => setRefused(null), 380);
      setSelected(null);
    }
  };

  // The delegation. Available exactly when the n-1 smallest discs form one
  // clean tower; the destination is forced by where the largest disc is.
  const subPeg = subTowerPeg(pegs, n);
  const expertGoal = expertTarget(pegs, n);
  const canDelegate = !playing && !solved && subPeg != null && expertGoal != null;

  const askExpert = () => {
    if (subPeg == null || expertGoal == null) return;
    const via = [0, 1, 2].find((p) => p !== subPeg && p !== expertGoal)!;
    setSelected(null);
    setQueue(transfer(n - 1, subPeg, expertGoal, via));
  };

  const solveAll = () => {
    if (moves !== 0 || playing) return;
    setSelected(null);
    setQueue(transfer(n, SOURCE, TARGET, 1));
  };

  // Geometry. The widest disc must fit its peg's third of the board.
  const unit = fitCell(Math.round(15 * factor), n, width ? Math.floor(width / 3) : null);
  const discH = Math.max(10, Math.round(unit * 0.95));
  const boardH = discH * (n + 1) + 26;

  return (
    <PuzzleFrame
      toolbar={
        <>
          <Slider label="Discs" value={n} min={1} max={7} onChange={reset} disabled={playing} />
          <BoardSizeControl sizeKey={sizeKey} setSizeKey={setSizeKey} />
          <Button onClick={() => reset(n)} disabled={playing}>Reset</Button>
        </>
      }
      caption={
        <>
          Click a peg to lift its top disc, then click another to drop it. A disc may never
          land on a smaller one.
        </>
      }
    >
      <div ref={ref} className="mb-4">
        <div
          className="flex items-end justify-between gap-2 rounded-lg px-2 pt-2"
          style={{ background: "var(--bg)", border: "1px solid var(--rule)", minHeight: boardH }}
        >
          {pegs.map((peg, p) => {
            const isSel = selected === p;
            const isRefused = refused === p;
            return (
              <button
                key={p}
                type="button"
                onClick={() => clickPeg(p)}
                aria-label={`Peg ${"ABC"[p]}, ${peg.length} discs`}
                className="flex-1 flex flex-col justify-end items-center rounded-md transition-colors"
                style={{
                  minHeight: boardH,
                  paddingBottom: 6,
                  cursor: playing || solved ? "default" : "pointer",
                  background: isRefused
                    ? "color-mix(in srgb, var(--bad) 22%, transparent)"
                    : isSel
                      ? "var(--accent-soft)"
                      : "transparent",
                  border: `1px solid ${isSel ? "var(--accent)" : "transparent"}`,
                }}
              >
                <div className="flex flex-col-reverse items-center gap-[2px] w-full">
                  {peg.map((d) => (
                    <div
                      key={d}
                      style={{
                        width: Math.max(unit, unit * d),
                        maxWidth: "100%",
                        height: discH,
                        borderRadius: discH / 2,
                        background: `var(--tile-${((d - 1) % 5) + 1})`,
                        transition: "width 160ms",
                      }}
                    />
                  ))}
                </div>
                {/* the spindle */}
                <div
                  style={{
                    width: 3,
                    height: Math.max(8, boardH - discH * peg.length - 18),
                    background: "var(--rule)",
                    order: -1,
                    borderRadius: 2,
                  }}
                />
                <div className="text-xs text-[var(--muted)] mt-1.5 tabular-nums">
                  {"ABC"[p]}
                  {p === TARGET ? " ·" : ""}
                </div>
              </button>
            );
          })}
        </div>
        <div style={{ height: 3, background: "var(--rule)", borderRadius: 2, marginTop: -1 }} />
      </div>

      <div className="flex flex-wrap items-end gap-x-6 gap-y-3 mb-4">
        <Stat label="Moves" value={moves} tone={solved && moves === optimal ? "good" : undefined} />
        <Stat label={<>Best possible</>} value={<Tex>{`2^{${n}}-1=${optimal}`}</Tex>} />
        <Stat label="On peg C" value={`${pegs[TARGET].length} / ${n}`} />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={askExpert} disabled={!canDelegate} primary={canDelegate}>
          Ask the expert
        </Button>
        <Button onClick={solveAll} disabled={moves !== 0 || playing}>
          Watch it done
        </Button>
        {solved && (
          <Verdict tone="good">
            Done in {moves} move{moves === 1 ? "" : "s"}
            {moves === optimal ? " — the fewest there are." : `; ${optimal} is the fewest there are.`}
          </Verdict>
        )}
        {!solved && !canDelegate && !playing && n > 1 && (
          <Verdict tone="neutral">
            The expert takes over only when the {n - 1} smaller discs sit together on one peg.
          </Verdict>
        )}
        {playing && <Verdict tone="neutral">The expert is working…</Verdict>}
      </div>
    </PuzzleFrame>
  );
}
