"use client";

import { Scenario } from "@/lib/types";
import { Card, CardHeader } from "./ui/Card";
import { Badge } from "./ui/Badge";
import { signed } from "@/lib/utils";
import { ScenarioComboChart } from "./ui/ScenarioComboChart";

const SCENARIO_COLOR: Record<Scenario["label"], string> = {
  Bullish: "#0ca30c",
  Neutral: "#5b6580",
  Bearish: "#d03b3b",
};

const SCENARIO_STATUS: Record<Scenario["label"], "good" | "neutral" | "critical"> = {
  Bullish: "good",
  Neutral: "neutral",
  Bearish: "critical",
};

export function ScenarioSimulator({
  ticker,
  scenarios,
  price,
  volatility,
}: {
  ticker: string;
  scenarios: Scenario[];
  price: number;
  volatility: number;
}) {
  return (
    <Card>
      <CardHeader
        eyebrow={ticker}
        title="Prediction Simulator"
        icon={<DiceIcon />}
        action={<span className="text-[11px] text-ink-muted">ML model prediction, not a forecast</span>}
      />

      {/* Combined probability — single stacked bar, part-to-whole across the three scenarios */}
      <div className="mb-1.5 text-[11px] text-ink-muted">Probability weighting</div>
      <div className="flex h-6 w-full overflow-hidden rounded-lg">
        {scenarios.map((s, i) => (
          <div
            key={s.label}
            className="flex items-center justify-center text-[11px] font-semibold text-white/90"
            style={{ width: `${s.probabilityPct}%`, backgroundColor: SCENARIO_COLOR[s.label], marginLeft: i === 0 ? 0 : 2 }}
          >
            {s.probabilityPct >= 12 ? `${s.probabilityPct}%` : ""}
          </div>
        ))}
      </div>

      <div className="mt-5">
        <ScenarioComboChart ticker={ticker} scenarios={scenarios} price={price} volatilityScore={volatility} />
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        {scenarios.map((s) => (
          <div key={s.label} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3.5">
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="text-sm font-semibold text-ink-primary">{s.label}</span>
              <Badge status={SCENARIO_STATUS[s.label]} className="px-1.5 py-0.5 text-[10px]">
                {s.probabilityPct}% chance
              </Badge>
            </div>

            <div className="text-xs font-semibold tabular-nums text-ink-primary">
              {signed(s.rangeLowPct, 0)}% to {signed(s.rangeHighPct, 0)}%
            </div>
            <p className="mt-1 text-[11px] leading-relaxed text-ink-secondary">{s.trigger}</p>
          </div>
        ))}
      </div>

      <p className="mt-5 text-[11px] leading-relaxed text-ink-muted">
        Probabilities come from a supervised model trained on 5 years of price action across 500+ stocks — on
        held-out stocks it predicts direction correctly about 39% of the time (vs. 33% random, 36% always-guess-
        Neutral). A real, modest edge — not a reliable forecast. Each path is a ~30-day-out estimate for that
        scenario, not a guarantee.
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
