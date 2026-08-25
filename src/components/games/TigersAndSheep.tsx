import { useState } from "react";
import { PuzzleFrame, Button, Stat, Slider, Verdict } from "./ui";
import Tex from "../Tex";

/**
 * Tigers and Sheep -- Induction, chapter 1.
 *
 * n tigers and one sheep. A tiger would rather eat than not, but a tiger
 * that eats BECOMES the sheep, among the n-1 tigers that remain. So a
 * tiger eats exactly when it would then be safe, and safety at n turns on
 * what happens at n-1. The whole answer is the parity of n.
 *
 * COPY RULE: this chapter is chapter 1, and the book withholds climbing
 * language until its final chapter. No "base case", no "inductive
 * hypothesis", no "P(n)", no "by induction". Speak of the expert.
 */

/** Is the sheep eaten, on an island holding `n` tigers? */
function sheepIsEaten(n: number): boolean {
  return n % 2 === 1;
}

function Tiger({ size, dimmed }: { size: number; dimmed?: boolean }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      aria-hidden="true"
      style={{ opacity: dimmed ? 0.28 : 1, transition: "opacity 200ms" }}
    >
      {/* head */}
      <circle cx="16" cy="17" r="9" fill="var(--term)" />
      {/* ears */}
      <circle cx="9" cy="9" r="3.6" fill="var(--term)" />
      <circle cx="23" cy="9" r="3.6" fill="var(--term)" />
      {/* stripes */}
      <path
        d="M11 11.5 L13 15 M16 9.5 L16 13 M21 11.5 L19 15"
        stroke="var(--bg)"
        strokeWidth="1.6"
        strokeLinecap="round"
        fill="none"
      />
      {/* eyes and muzzle */}
      <circle cx="12.6" cy="17" r="1.35" fill="var(--bg)" />
      <circle cx="19.4" cy="17" r="1.35" fill="var(--bg)" />
      <path
        d="M13.5 21.5 Q16 23.5 18.5 21.5"
        stroke="var(--bg)"
        strokeWidth="1.4"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}

function Sheep({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      {/* fleece */}
      <circle cx="13" cy="17" r="7.5" fill="var(--ink)" />
      <circle cx="19" cy="14" r="5.5" fill="var(--ink)" />
      <circle cx="20" cy="20" r="5" fill="var(--ink)" />
      {/* face */}
      <circle cx="24" cy="12.5" r="3.8" fill="var(--muted)" />
      <circle cx="23" cy="11.8" r="0.9" fill="var(--bg)" />
      {/* legs */}
      <path
        d="M11 24 L11 28 M17 24 L17 28"
        stroke="var(--muted)"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function TigersAndSheep() {
  const [start, setStart] = useState(5);
  const [tigers, setTigers] = useState(5);
  const [meals, setMeals] = useState(0);

  // The sheep survives only when no tiger dares eat. A tiger dares when,
  // after eating, it would be the sheep among tigers - 1 tigers and the
  // sheep there is NOT eaten.
  const safeToEat = tigers >= 1 && !sheepIsEaten(tigers - 1);
  const eatenHere = sheepIsEaten(tigers);
  const settled = !safeToEat;

  const reset = (n: number) => {
    setStart(n);
    setTigers(n);
    setMeals(0);
  };

  const eat = () => {
    if (!safeToEat) return;
    setTigers((t) => t - 1);
    setMeals((m) => m + 1);
  };

  const shown = Math.min(tigers, 15);

  return (
    <PuzzleFrame
      toolbar={
        <>
          <Slider label="Tigers" value={start} min={1} max={15} onChange={reset} />
          <Button onClick={() => reset(99)}>Start with 99</Button>
          <Button onClick={() => reset(start)}>Reset</Button>
        </>
      }
      caption={
        <>
          A tiger eats only when eating is safe — and eating turns it into the sheep on an
          island of one fewer tiger. Slide the count up and down and watch the answer
          alternate.
        </>
      }
    >
      {/* The island */}
      <div
        className="rounded-lg p-4 mb-4 flex flex-wrap items-center justify-center gap-2 min-h-[92px]"
        style={{
          background: "var(--bg)",
          border: `1px solid ${eatenHere ? "var(--bad)" : "var(--good)"}`,
          transition: "border-color 250ms",
        }}
      >
        {Array.from({ length: shown }, (_, i) => (
          <Tiger key={i} size={34} />
        ))}
        {tigers > 15 && (
          <span className="tabular-nums text-sm text-[var(--muted)] px-1">
            + {tigers - 15} more
          </span>
        )}
        <span className="mx-2 text-[var(--faint)]">|</span>
        <Sheep size={38} />
      </div>

      <div className="flex flex-wrap items-end gap-x-6 gap-y-3 mb-4">
        <Stat label="Tigers" value={tigers} />
        <Stat label="Meals so far" value={meals} />
        <Stat
          label="The sheep is"
          value={eatenHere ? "eaten" : "safe"}
          tone={eatenHere ? "bad" : "good"}
        />
      </div>

      {/* The reasoning panel: what the expert on n-1 tigers reports, and what
          that makes a tiger here decide. This is the delegation, in words. */}
      <div
        className="rounded-lg p-3 text-sm mb-4"
        style={{ background: "var(--bg)", border: "1px solid var(--rule)" }}
      >
        {tigers === 0 ? (
          <span className="text-[var(--muted)]">No tigers are left. The sheep grazes on.</span>
        ) : (
          <>
            <div className="text-[var(--muted)] mb-1">
              Ask the expert about an island of <Tex>{String(tigers - 1)}</Tex>{" "}
              {tigers - 1 === 1 ? "tiger" : "tigers"}:
            </div>
            <div>
              there, the sheep is{" "}
              <strong style={{ color: sheepIsEaten(tigers - 1) ? "var(--bad)" : "var(--good)" }}>
                {sheepIsEaten(tigers - 1) ? "eaten" : "safe"}
              </strong>
              . So a tiger that eats here would be{" "}
              <strong style={{ color: safeToEat ? "var(--good)" : "var(--bad)" }}>
                {safeToEat ? "safe — and so it eats" : "eaten in turn — so no tiger moves"}
              </strong>
              .
            </div>
          </>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={eat} disabled={!safeToEat} primary={safeToEat}>
          A tiger eats
        </Button>
        {settled && tigers > 0 && (
          <Verdict tone="good">Nobody dares. The sheep survives.</Verdict>
        )}
        {settled && tigers === 0 && <Verdict tone="neutral">The island is empty.</Verdict>}
        {!settled && (
          <Verdict tone="bad">
            Eating is safe here, so the sheep does not last.
          </Verdict>
        )}
      </div>
    </PuzzleFrame>
  );
}
