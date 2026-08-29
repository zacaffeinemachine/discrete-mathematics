import { useEffect, useRef, useState } from "react";
import { PuzzleFrame, Button, Stat, Verdict, Slider, SegmentedControl } from "./ui";
import { useAvailableWidth, useBoardSize, BoardSizeControl, fitCell } from "./boardSize";
import { type Bins, spare, isLevel, expertPlan, randomStart } from "./models/ballBoggle";

/**
 * Ball Boggle -- Induction, chapter 2.
 *
 * Two ways in. PLAY is the puzzle: click a bin to spare it and watch every
 * other bin gain a ball. DELEGATE is the chapter's argument: keep one bin
 * as the star, hand the rest to the expert, and watch the expert's moves
 * arrive in our system with an extra ball falling into the star each time.
 *
 * AN ARENA, NOT AN ANSWER. Nothing here says how many moves are needed,
 * which bin to spare, or which bin to keep. In particular the student may
 * choose ANY bin as the star, including an emptiest one -- finding out why
 * a fullest bin is the one to keep is the whole of the chapter, and a
 * widget that refused the other choices would hand that over.
 *
 * COPY RULE: this is chapter 2. Descent only, and the word is EXPERT.
 */

type Mode = "play" | "delegate";
type Snap = { bins: Bins; star: number | null; moves: number };

const BOOK_START = [2, 1, 3];

const MODES = [
  { key: "play" as const, label: "Play", title: "Spare a bin yourself." },
  { key: "delegate" as const, label: "Delegate", title: "Keep a star bin and hand the rest to the expert." },
];

/** Padded so the start of a run and the end of one animate at one speed. */
const TICK_MS = 420;

export default function BallBoggle() {
  const [start, setStart] = useState<Bins>(BOOK_START);
  const [bins, setBins] = useState<Bins>(BOOK_START);
  const [moves, setMoves] = useState(0);
  const [mode, setMode] = useState<Mode>("play");
  const [star, setStar] = useState<number | null>(null);
  const [handed, setHanded] = useState(false);
  const [queue, setQueue] = useState<number[]>([]);
  const [fed, setFed] = useState<number[]>([]);
  const [history, setHistory] = useState<Snap[]>([]);

  const { sizeKey, factor, setSizeKey } = useBoardSize();
  const { ref, width } = useAvailableWidth<HTMLDivElement>();

  const n = bins.length;
  const busy = queue.length > 0;
  const level = isLevel(bins);

  /** Record the state as it stands, before changing it. */
  const record = () =>
    setHistory((h) => [...h, { bins, star, moves }]);

  const undoRef = useRef<() => void>(() => {});
  const undo = () => {
    if (!history.length) return;
    const prev = history[history.length - 1];
    setHistory((h) => h.slice(0, -1));
    setBins(prev.bins);
    setStar(prev.star);
    setMoves(prev.moves);
    // Undoing during a hand-over cancels it rather than fighting it, so one
    // press retracts the whole delegation instead of its last move.
    setQueue([]);
    setFed([]);
    setHanded(false);
  };
  undoRef.current = undo;

  const reset = (next: Bins) => {
    setStart(next);
    setBins(next);
    setMoves(0);
    setStar(null);
    setHanded(false);
    setQueue([]);
    setFed([]);
    setHistory([]);
  };

  // Ctrl+Z / Cmd+Z, as in the tromino. Registered once and calling through
  // a ref, so it never closes over a stale `undo`.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "z" && e.key !== "Z") return;
      if (!(e.ctrlKey || e.metaKey) || e.altKey || e.shiftKey) return;
      const t = e.target as HTMLElement | null;
      const tag = t?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || t?.isContentEditable) return;
      e.preventDefault();
      undoRef.current();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  // Drain a handed-over run one move at a time, so the delegation reads as
  // work being done rather than as an answer appearing.
  const timer = useRef<number | null>(null);
  useEffect(() => {
    if (!queue.length) return;
    timer.current = window.setTimeout(() => {
      const s = queue[0];
      setBins((b) => spare(b, s));
      setMoves((m) => m + 1);
      setFed(Array.from({ length: n }, (_, i) => i).filter((i) => i !== s));
      setQueue((q) => q.slice(1));
    }, TICK_MS);
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [queue, n]);

  // Clear the flash once the run stops.
  useEffect(() => {
    if (queue.length || !fed.length) return;
    const t = window.setTimeout(() => setFed([]), TICK_MS);
    return () => window.clearTimeout(t);
  }, [queue, fed]);

  const clickBin = (i: number) => {
    if (busy) return;
    // In Delegate mode the first click names the star. After that a click
    // is an ordinary move again, so there is no state in which clicking
    // does nothing.
    if (mode === "delegate" && star == null) {
      setStar(i);
      return;
    }
    record();
    setBins((b) => spare(b, i));
    setMoves((m) => m + 1);
    setFed(Array.from({ length: n }, (_, k) => k).filter((k) => k !== i));
  };

  /** Hand every bin except the star to the expert. */
  const handOver = () => {
    if (star == null || busy) return;
    const others = bins.map((_, i) => i).filter((i) => i !== star);
    const plan = expertPlan(others.map((i) => bins[i])).map((s) => others[s]);
    record();
    setHanded(true);
    if (!plan.length) return;
    setQueue(plan);
  };

  const changeSize = (k: number) => {
    if (k === n) return;
    reset(k === 3 ? BOOK_START : randomStart(k));
  };

  // Geometry. The tallest stack sets both the ball size and the height of
  // the bins: the balls shrink once a stack would outgrow the frame, and
  // until then the bins are only as tall as they need to be. Balls are
  // never removed, so a bin grows during play and never jumps back.
  const binPx = fitCell(Math.round(64 * factor), n, width);
  const maxH = Math.round(170 * factor);
  const tallest = Math.max(1, ...bins);
  const ballPx = Math.max(4, Math.min(Math.round(20 * factor), Math.floor(maxH / tallest) - 2));
  const colH = Math.max(Math.round(52 * factor), Math.min(maxH, tallest * (ballPx + 2) + 8));

  return (
    <PuzzleFrame
      toolbar={
        <>
          <SegmentedControl
            options={MODES}
            value={mode}
            onChange={(m) => { setMode(m); setStar(null); setHanded(false); }}
            label="Mode"
          />
          <Slider label="Bins" value={n} min={2} max={6} onChange={changeSize} disabled={busy} />
          <Button onClick={() => reset(randomStart(n))} disabled={busy}>New start</Button>
          <Button onClick={() => reset(start)} disabled={busy}>Reset</Button>
          <Button onClick={undo} disabled={!history.length}>Undo</Button>
          <BoardSizeControl sizeKey={sizeKey} setSizeKey={setSizeKey} />
        </>
      }
      caption={
        mode === "delegate" && star == null ? (
          <>Click the bin you want to keep for yourself. The rest go to the expert.</>
        ) : mode === "delegate" && !handed ? (
          <>The expert sees the other {n - 1} bins and nothing else. Their moves have to be
            carried out in here.</>
        ) : (
          <>Click a bin to spare it. Every other bin gets one ball.</>
        )
      }
    >
      <div ref={ref} className="scroll-x mb-4">
        <div
          className="rounded-lg p-4 flex items-end justify-center gap-2 sm:gap-3"
          style={{ background: "var(--bg)", border: "1px solid var(--rule)" }}
        >
          {bins.map((count, i) => {
            const isStar = star === i;
            const justFed = fed.includes(i);
            return (
              <button
                key={i}
                type="button"
                disabled={busy}
                onClick={() => clickBin(i)}
                aria-label={
                  `Bin ${i + 1}, ${count === 1 ? "1 ball" : `${count} balls`}` +
                  (isStar ? ", the star bin" : "")
                }
                className="flex flex-col items-center gap-1 rounded-md p-1 transition-colors"
                style={{ cursor: busy ? "default" : "pointer", width: binPx }}
              >
                {/* The bin is the container itself -- two walls and a
                    floor -- and the balls stack up from the floor. */}
                <span
                  className="flex flex-col-reverse items-center justify-start gap-[2px] w-full"
                  style={{
                    height: colH,
                    padding: "0 4px 4px",
                    borderLeft: `2px solid ${isStar ? "var(--accent)" : "var(--rule)"}`,
                    borderRight: `2px solid ${isStar ? "var(--accent)" : "var(--rule)"}`,
                    borderBottom: `2px solid ${isStar ? "var(--accent)" : "var(--rule)"}`,
                    borderBottomLeftRadius: 4,
                    borderBottomRightRadius: 4,
                    background: justFed ? "var(--accent-soft)" : "transparent",
                    transition: "background 260ms ease, border-color 200ms ease",
                  }}
                >
                  {Array.from({ length: count }, (_, k) => (
                    <span
                      key={k}
                      style={{
                        width: ballPx,
                        height: ballPx,
                        borderRadius: "50%",
                        background: "var(--term)",
                        flex: "0 0 auto",
                      }}
                    />
                  ))}
                </span>
                <span
                  className="tabular-nums text-sm font-bold"
                  style={{ color: isStar ? "var(--accent)" : "var(--ink)" }}
                >
                  {count}
                </span>
                <span className="text-xs" style={{ color: isStar ? "var(--accent)" : "var(--muted)" }}>
                  {isStar ? "star" : `B${i + 1}`}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-x-6 gap-y-3">
        <Stat label="Moves made" value={moves} />
        {mode === "delegate" && star != null && !handed && (
          <Button primary onClick={handOver} disabled={busy}>
            Hand the others to the expert
          </Button>
        )}
        {mode === "delegate" && star != null && (
          <Button onClick={() => { setStar(null); setHanded(false); }} disabled={busy}>
            Choose another star
          </Button>
        )}
        {level && moves > 0 && !busy && <Verdict tone="good">Level.</Verdict>}
      </div>
    </PuzzleFrame>
  );
}
