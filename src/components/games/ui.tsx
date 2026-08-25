import type { ReactNode, CSSProperties } from "react";

/**
 * The shared chrome of a puzzle island: frame, controls, counters.
 *
 * Everything here styles through the CSS custom properties in global.css,
 * so a puzzle never names a raw colour and both themes come free.
 */

export function PuzzleFrame({
  children,
  toolbar,
  caption,
}: {
  children: ReactNode;
  toolbar?: ReactNode;
  caption?: ReactNode;
}) {
  return (
    <figure className="widget">
      <div
        className="rounded-xl p-4 sm:p-5"
        style={{ background: "var(--surface)", border: "1px solid var(--rule)" }}
      >
        {toolbar && (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-4">{toolbar}</div>
        )}
        {children}
      </div>
      {caption && (
        <figcaption className="mt-2 text-sm text-[var(--muted)]">{caption}</figcaption>
      )}
    </figure>
  );
}

export function Button({
  children,
  onClick,
  disabled,
  primary,
  title,
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  primary?: boolean;
  title?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className="px-3 py-1.5 rounded-md text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      style={{
        border: `1px solid ${primary ? "var(--accent)" : "var(--rule)"}`,
        background: primary ? "var(--accent-soft)" : "transparent",
        color: primary ? "var(--accent)" : "var(--ink)",
        fontWeight: primary ? 700 : 400,
      }}
    >
      {children}
    </button>
  );
}

/** A labelled readout. `tone` tints the value when it is worth noticing. */
export function Stat({
  label,
  value,
  tone,
}: {
  label: ReactNode;
  value: ReactNode;
  tone?: "good" | "bad" | "accent" | "term";
}) {
  const color =
    tone === "good" ? "var(--good)"
    : tone === "bad" ? "var(--bad)"
    : tone === "accent" ? "var(--accent)"
    : tone === "term" ? "var(--term)"
    : "var(--ink)";
  return (
    <div className="flex flex-col">
      <span className="text-xs uppercase tracking-wider text-[var(--muted)]">{label}</span>
      <span className="tabular-nums font-bold" style={{ color, fontSize: "1.05rem" }}>
        {value}
      </span>
    </div>
  );
}

export function Slider({
  label,
  value,
  min,
  max,
  onChange,
  disabled,
}: {
  label: ReactNode;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
  disabled?: boolean;
}) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="text-[var(--muted)]">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ accentColor: "var(--accent)", width: 110 }}
      />
      <span className="tabular-nums font-bold" style={{ minWidth: "1.6em" }}>
        {value}
      </span>
    </label>
  );
}

/** A short line of feedback. Never explains the puzzle; just reports state. */
export function Verdict({
  tone,
  children,
}: {
  tone: "good" | "bad" | "neutral";
  children: ReactNode;
}) {
  const color =
    tone === "good" ? "var(--good)" : tone === "bad" ? "var(--bad)" : "var(--muted)";
  return (
    <span role="status" className="text-sm font-medium" style={{ color }}>
      {children}
    </span>
  );
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: readonly { key: T; label: string; title?: string }[];
  value: T;
  onChange: (v: T) => void;
  label?: string;
}) {
  const style = (active: boolean): CSSProperties => ({
    background: active ? "var(--accent-soft)" : "transparent",
    color: active ? "var(--accent)" : "var(--muted)",
    fontWeight: active ? 700 : 400,
  });
  return (
    <div className="flex items-center gap-2 text-xs">
      {label && <span className="uppercase tracking-wider text-[var(--muted)]">{label}</span>}
      <div className="flex rounded-md overflow-hidden border border-[var(--rule)] flex-wrap">
        {options.map((o) => (
          <button
            key={o.key}
            type="button"
            title={o.title}
            onClick={() => onChange(o.key)}
            aria-pressed={value === o.key}
            className="px-2.5 py-1 transition-colors"
            style={style(value === o.key)}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}
