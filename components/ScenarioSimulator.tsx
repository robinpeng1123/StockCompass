"use client";

import { Scenario } from "@/lib/types";
import { Card, CardHeader } from "./ui/Card";
import { signed } from "@/lib/utils";
import { ProjectionChart } from "./ui/ProjectionChart";

const SCENARIO_COLOR: Record<Scenario["label"], string> = {
  Bullish: "#0ca30c",
  Neutral: "#5b6580",
  Bearish: "#d03b3b",
};

export function ScenarioSimulator({ ticker, scenarios }: { ticker: string; scenarios: Scenario[] }) {
  const allLows = scenarios.map((s) => s.rangeLowPct);
  const allHighs = scenarios.map((s) => s.rangeHighPct);
  const min = Math.min(0, ...allLows) - 2;
  const max = Math.max(0, ...allHighs) + 2;
  const span = max - min;
  const pctToX = (pct: number) => ((pct - min) / span) * 100;
  const zeroX = pctToX(0);

  return (
    <Card>
      <CardHeader
        eyebrow={ticker}
        title="Prediction Simulator"
        icon={<DiceIcon />}
        action={<span className="text-[11px] text-ink-muted">Scenario analysis, not a forecast</span>}
      />

      <div className="mb-6">
        <ProjectionChart ticker={ticker} scenarios={scenarios} />
      </div>

      {/* Combined probability — single stacked bar, part-to-whole across the three scenarios */}
      <div className="mb-1.5 flex text-[11px] text-ink-muted">
        <span>Probability weighting</span>
      </div>
      <div className="flex h-6 w-full overflow-hidden rounded-lg">
        {scenarios.map((s, i) => (
          <div
            key={s.label}
            className="flex items-center justify-center text-[11px] font-semibold text-white/90"
            style={{
              width: `${s.probabilityPct}%`,
              backgroundColor: SCENARIO_COLOR[s.label],
              marginLeft: i === 0 ? 0 : 2,
            }}
          >
            {s.probabilityPct >= 12 ? `${s.probabilityPct}%` : ""}
          </div>
        ))}
      </div>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
        {scenarios.map((s) => (
          <span key={s.label} className="flex items-center gap-1.5 text-[11px] text-ink-secondary">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: SCENARIO_COLOR[s.label] }} />
            {s.label}
          </span>
        ))}
      </div>

      {/* Per-scenario detail rows with a floating range bar on a shared axis */}
      <div className="mt-6 space-y-5">
        <div className="relative h-4">
          <div className="absolute inset-y-0 border-l border-white/15" style={{ left: `${zeroX}%` }} />
          <span
            className="absolute -top-4 -translate-x-1/2 text-[10px] text-ink-muted"
            style={{ left: `${zeroX}%` }}
          >
            0%
          </span>
        </div>

        {scenarios.map((s) => {
          const lowX = pctToX(s.rangeLowPct);
          const highX = pctToX(s.rangeHighPct);
          const color = SCENARIO_COLOR[s.label];
          return (
            <div key={s.label}>
              <div className="mb-1 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: color }} />
                  <span className="text-sm font-medium text-ink-primary">{s.label}</span>
                  <span className="text-xs text-ink-muted">· {s.probabilityPct}% chance</span>
                </div>
                <span className="text-xs font-semibold tabular-nums text-ink-primary">
                  {signed(s.rangeLowPct, 0)}% to {signed(s.rangeHighPct, 0)}%
                </span>
              </div>
              <p className="mb-1.5 text-xs text-ink-secondary">{s.trigger}</p>
              <div className="relative h-3 rounded-full bg-white/[0.05]">
                <div className="absolute inset-y-0 border-l border-white/15" style={{ left: `${zeroX}%` }} />
                <div
                  className="absolute inset-y-0 rounded-full"
                  style={{
                    left: `${Math.min(lowX, highX)}%`,
                    width: `${Math.max(2, Math.abs(highX - lowX))}%`,
                    backgroundColor: color,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-5 text-[11px] leading-relaxed text-ink-muted">
        These are illustrative probability-weighted ranges based on historical analogues, not a guarantee — markets
        don&apos;t owe any scenario its stated odds.
      </p>
    </Card>
  );
}

function DiceIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <rect x="2.5" y="2.5" width="13" height="13" rx="3" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="6.5" cy="6.5" r="1" fill="currentColor" />
      <circle cx="11.5" cy="6.5" r="1" fill="currentColor" />
      <circle cx="9" cy="9" r="1" fill="currentColor" />
      <circle cx="6.5" cy="11.5" r="1" fill="currentColor" />
      <circle cx="11.5" cy="11.5" r="1" fill="currentColor" />
    </svg>
  );
}
