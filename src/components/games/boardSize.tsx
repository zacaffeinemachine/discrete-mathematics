import { useEffect, useLayoutEffect, useRef, useState } from "react";

/**
 * A shared board-size preference, and the width clamp that keeps a board
 * inside the prose column.
 *
 * Ported from the MathematicalThinking site. Two islands on the same page
 * are separate React roots and cannot share state through context, so the
 * preference lives in localStorage and changes are broadcast on a window
 * CustomEvent. The effect is that setting one board to L sets every board
 * on the page -- and on the next page -- to L.
 */

const STORAGE_KEY = "dm-board-size";
const SIZE_EVENT = "dm-board-size-change";

export const BOARD_SIZES = [
  { key: "S", label: "S", factor: 0.8 },
  { key: "M", label: "M", factor: 1 },
  { key: "L", label: "L", factor: 1.35 },
  { key: "XL", label: "XL", factor: 1.75 },
] as const;

export type BoardSizeKey = (typeof BOARD_SIZES)[number]["key"];

function isSizeKey(v: unknown): v is BoardSizeKey {
  return typeof v === "string" && BOARD_SIZES.some((s) => s.key === v);
}

export function useBoardSize() {
  // Start at the SSR-safe default; the stored value is read in an effect so
  // that server and first client render agree and hydration does not warn.
  const [sizeKey, setKeyState] = useState<BoardSizeKey>("M");

  useEffect(() => {
    let stored: string | null = null;
    try {
      stored = window.localStorage.getItem(STORAGE_KEY);
    } catch {
      /* private mode, blocked storage -- the default is fine */
    }
    if (isSizeKey(stored)) setKeyState(stored);

    const onChange = (e: Event) => {
      const k = (e as CustomEvent).detail;
      if (isSizeKey(k)) setKeyState(k);
    };
    window.addEventListener(SIZE_EVENT, onChange);
    return () => window.removeEventListener(SIZE_EVENT, onChange);
  }, []);

  const setSizeKey = (k: BoardSizeKey) => {
    setKeyState(k);
    try {
      window.localStorage.setItem(STORAGE_KEY, k);
    } catch {
      /* ignore */
    }
    window.dispatchEvent(new CustomEvent(SIZE_EVENT, { detail: k }));
  };

  const factor = BOARD_SIZES.find((s) => s.key === sizeKey)?.factor ?? 1;
  return { sizeKey, factor, setSizeKey };
}

/** Measured content width of an element, tracked through resizes. */
export function useAvailableWidth<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [width, setWidth] = useState<number | null>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => setWidth(el.clientWidth);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return { ref, width };
}

/**
 * Shrink a desired cell size so `cols` of them fit the available width.
 * Without this an XL preference overflows the prose column on a phone and
 * the whole page scrolls sideways.
 */
export function fitCell(desired: number, cols: number, available: number | null): number {
  if (available == null || available <= 0) return desired;
  return Math.max(18, Math.min(desired, Math.floor((available - 18) / cols)));
}

export function BoardSizeControl({
  sizeKey,
  setSizeKey,
}: {
  sizeKey: BoardSizeKey;
  setSizeKey: (k: BoardSizeKey) => void;
}) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="uppercase tracking-wider text-[var(--muted)]">Size</span>
      <div className="flex rounded-md overflow-hidden border border-[var(--rule)]">
        {BOARD_SIZES.map((s) => (
          <button
            key={s.key}
            type="button"
            onClick={() => setSizeKey(s.key)}
            aria-pressed={sizeKey === s.key}
            className="px-2.5 py-1 transition-colors"
            style={{
              background: sizeKey === s.key ? "var(--accent-soft)" : "transparent",
              color: sizeKey === s.key ? "var(--accent)" : "var(--muted)",
              fontWeight: sizeKey === s.key ? 700 : 400,
            }}
          >
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );
}
