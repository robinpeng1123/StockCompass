import { cx } from "@/lib/utils";

const COLOR_MAP: Record<string, string> = {
  "status-good": "#0ca30c",
  "status-warning": "#fab219",
  "status-critical": "#d03b3b",
  cyan: "#22e5ff",
  violet: "#8b6bf2",
};

/**
 * Meter: fill carries severity, track is a flat lighter step so state reads
 * across the whole bar. ≤24px would be a column; this horizontal meter caps
 * at 10px thick per the bar/column spec's "never fill the slot" rule, with a
 * 4px rounded leading edge and a square trailing edge at the baseline (0).
 */
export function Meter({
  label,
  value,
  color = "cyan",
  helper,
}: {
  label: string;
  value: number;
  color?: keyof typeof COLOR_MAP;
  helper?: string;
}) {
  const pct = Math.max(0, Math.min(100, value));
  const hex = COLOR_MAP[color] ?? COLOR_MAP.cyan;

  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between">
        <span className="text-xs font-medium text-ink-secondary">{label}</span>
        <span className="text-sm font-semibold tabular-nums text-ink-primary">{Math.round(pct)}%</span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/[0.07]">
        <div
          className="h-full rounded-full transition-[width] duration-500"
          style={{ width: `${pct}%`, backgroundColor: hex }}
        />
      </div>
      {helper && <p className={cx("mt-1 text-[11px] text-ink-muted")}>{helper}</p>}
    </div>
  );
}
