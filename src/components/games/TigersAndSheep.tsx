import { useEffect, useRef, useState } from "react";
import { PuzzleFrame, Button, Stat, Slider } from "./ui";

/**
 * Tigers and Sheep -- Induction, chapter 1.
 *
 * AN ARENA, NOT AN ANSWER. This widget deliberately reports no verdict: it
 * does not say whether the sheep survives, it does not rank a move as safe
 * or fatal, and it does not reason on the student's behalf. It lets them
 * make a tiger eat and watch what that tiger becomes. Whether eating was a
 * good idea is the thing they are here to work out.
 *
 * Every creature carries a stable id so React keeps the same DOM node
 * through the change, which is what lets the eater visibly turn into the
 * sheep rather than being swapped out for a new element.
 */

type Creature = { id: number; kind: "tiger" | "sheep" };

const EAT_MS = 900;

function makeIsland(n: number): Creature[] {
  return [
    ...Array.from({ length: n }, (_, i) => ({ id: i, kind: "tiger" as const })),
    { id: 10_000, kind: "sheep" as const },
  ];
}

function Tiger({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <circle cx="16" cy="17" r="9" fill="var(--term)" />
      <circle cx="9" cy="9" r="3.6" fill="var(--term)" />
      <circle cx="23" cy="9" r="3.6" fill="var(--term)" />
      <path d="M11 11.5 L13 15 M16 9.5 L16 13 M21 11.5 L19 15"
            stroke="var(--bg)" strokeWidth="1.6" strokeLinecap="round" fill="none" />
      <circle cx="12.6" cy="17" r="1.35" fill="var(--bg)" />
      <circle cx="19.4" cy="17" r="1.35" fill="var(--bg)" />
      <path d="M13.5 21.5 Q16 23.5 18.5 21.5"
            stroke="var(--bg)" strokeWidth="1.4" fill="none" strokeLinecap="round" />
    </svg>
  );
}

function Sheep({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <circle cx="13" cy="17" r="7.5" fill="var(--ink)" />
      <circle cx="19" cy="14" r="5.5" fill="var(--ink)" />
      <circle cx="20" cy="20" r="5" fill="var(--ink)" />
      <circle cx="24" cy="12.5" r="3.8" fill="var(--muted)" />
      <circle cx="23" cy="11.8" r="0.9" fill="var(--bg)" />
      <path d="M11 24 L11 28 M17 24 L17 28"
            stroke="var(--muted)" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export default function TigersAndSheep() {
  const [start, setStart] = useState(5);
  const [island, setIsland] = useState<Creature[]>(() => makeIsland(5));
  const [meals, setMeals] = useState(0);
  /** The tiger currently mid-meal, and the sheep it is eating. */
  const [eater, setEater] = useState<number | null>(null);
  const [victim, setVictim] = useState<number | null>(null);

  const timer = useRef<number | null>(null);
  useEffect(() => () => { if (timer.current) window.clearTimeout(timer.current); }, []);

  const tigers = island.filter((c) => c.kind === "tiger");
  const busy = eater != null;

  const reset = (n: number) => {
    if (timer.current) window.clearTimeout(timer.current);
    setStart(n);
    setIsland(makeIsland(n));
    setMeals(0);
    setEater(null);
    setVictim(null);
  };

  const eat = (tigerId: number) => {
    if (busy) return;
    const sheep = island.find((c) => c.kind === "sheep");
    if (!sheep) return;

    // Two beats: the sheep goes, and the eater turns into the sheep. The
    // element stays the same one throughout, so the change reads as one
    // creature becoming another rather than as a redraw.
    setEater(tigerId);
    setVictim(sheep.id);
    timer.current = window.setTimeout(() => {
      setIsland((prev) =>
        prev
          .filter((c) => c.id !== sheep.id)
          .map((c) => (c.id === tigerId ? { ...c, kind: "sheep" } : c))
      );
      setMeals((m) => m + 1);
      setEater(null);
      setVictim(null);
    }, EAT_MS);
  };

  const size = 38;

  return (
    <PuzzleFrame
      toolbar={
        <>
          <Slider label="Tigers" value={start} min={1} max={12} onChange={reset} disabled={busy} />
          <Button onClick={() => reset(start)} disabled={busy}>Reset</Button>
        </>
      }
      caption={<>Click a tiger to make it eat, and watch what becomes of it.</>}
    >
      <div
        className="rounded-lg p-4 mb-4 flex flex-wrap items-center justify-center gap-2"
        style={{ background: "var(--bg)", border: "1px solid var(--rule)", minHeight: 96 }}
      >
        {island.length === 0 && (
          <span className="text-sm text-[var(--muted)]">The island is empty.</span>
        )}
        {island.map((c) => {
          const isEater = eater === c.id;
          const isVictim = victim === c.id;
          const clickable = c.kind === "tiger" && !busy;
          return (
            <button
              key={c.id}
              type="button"
              disabled={!clickable}
              onClick={() => eat(c.id)}
              aria-label={
                c.kind === "sheep"
                  ? "the sheep"
                  : `a tiger${clickable ? ", click to eat" : ""}`
              }
              className="rounded-full p-1"
              style={{
                border: `1px solid ${isEater ? "var(--accent)" : "transparent"}`,
                background: isEater ? "var(--accent-soft)" : "transparent",
                cursor: clickable ? "pointer" : "default",
                // The victim shrinks away; the eater lunges, then settles.
                transform: isVictim
                  ? "scale(0.2) rotate(25deg)"
                  : isEater
                    ? "scale(1.35)"
                    : "scale(1)",
                opacity: isVictim ? 0 : 1,
                transition: `transform ${EAT_MS * 0.55}ms cubic-bezier(.34,1.56,.64,1), opacity ${EAT_MS * 0.5}ms ease, background 200ms`,
              }}
            >
              {c.kind === "tiger" ? <Tiger size={size} /> : <Sheep size={size} />}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-end gap-x-6 gap-y-3">
        <Stat label="Tigers" value={tigers.length} />
        <Stat label="Meals so far" value={meals} />
      </div>
    </PuzzleFrame>
  );
}
