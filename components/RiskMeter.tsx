"use client";

import { useState } from "react";
import { Stock } from "@/lib/types";
import { Card, CardHeader } from "./ui/Card";
import { Meter } from "./ui/Meter";
import { explainMomentum, explainOverall, explainRisk, explainVolatility } from "@/lib/scoring";
import { cx } from "@/lib/utils";

export function RiskMeter({ stock }: { stock: Stock }) {
  return (
    <Card>
      <CardHeader eyebrow={stock.ticker} title="AI Risk Meter" icon={<GaugeIcon />} />

      <div className="space-y-4">
        <MeterRow label="Risk" value={stock.risk} color="status-critical" explain={explainRisk(stock)} />
        <MeterRow label="Momentum" value={stock.momentum} color="status-good" explain={explainMomentum(stock)} />
        <MeterRow label="Volatility" value={stock.volatility} color="status-warning" explain={explainVolatility(stock)} />
      </div>

      <div className="my-4 h-px bg-white/[0.06]" />

      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs font-medium text-ink-muted">Overall AI Score</div>
          <div className="mt-0.5 text-3xl font-semibold tracking-tight text-ink-primary">
            {stock.aiScore}
            <span className="text-base font-medium text-ink-muted">/100</span>
          </div>
        </div>
        <div className="h-2 w-28 overflow-hidden rounded-full bg-white/[0.07]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-accent-cyan to-accent-violet"
            style={{ width: `${stock.aiScore}%` }}
          />
        </div>
      </div>
      <p className="mt-2 text-xs leading-relaxed text-ink-secondary">{explainOverall(stock)}</p>
    </Card>
  );
}

function MeterRow({
  label,
  value,
  color,
  explain,
}: {
  label: string;
  value: number;
  color: "status-good" | "status-warning" | "status-critical";
  explain: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <Meter label={label} value={value} color={color} />
      <button
        onClick={() => setOpen((o) => !o)}
        className="mt-1.5 flex items-center gap-1 text-[11px] font-medium text-accent-cyan/90 hover:text-accent-cyan"
      >
        {open ? "Hide reasoning" : "Why this score?"}
        <svg
          width="10"
          height="10"
          viewBox="0 0 10 10"
          fill="none"
          className={cx("transition-transform", open && "rotate-180")}
        >
          <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && <p className="mt-1.5 text-xs leading-relaxed text-ink-secondary">{explain}</p>}
    </div>
  );
}

function GaugeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M2.5 14a6.5 6.5 0 1113 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M9 14L12 8.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
