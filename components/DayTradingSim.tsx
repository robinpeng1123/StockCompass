"use client";

import { useId, useMemo, useRef, useState } from "react";
import { Scenario } from "@/lib/types";
import { Card, CardHeader } from "@/components/ui/Card";
import { formatPrice, signed } from "@/lib/utils";
import { buildDayTradingSim } from "@/lib/dayTradingSim";

export function DayTradingSim({
  ticker,
  price,
  volatility,
  scenarios,
}: {
  ticker: string;
  price: number;
  volatility: number;
  scenarios: Scenario[];
}) {
  const id = useId();
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const sim = useMemo(() => {
    const neutral = scenarios.find((s) => s.label === "Neutral");
    const neutralMidpointPct = neutral ? (neutral.rangeLowPct + neutral.rangeHighPct) / 2 : 0;
    return buildDayTradingSim({ ticker, currentPrice: price, volatilityScore: volatility, neutralMidpointPct });
  }, [ticker, price, volatility, scenarios]);

  const { checkpoints, sessionLabel } = sim;
  const prices = checkpoints.map((c) => c.price);
  const up = prices.length > 1 ? prices[prices.length - 1] >= prices[0] : true;
  const color = up ? "#0ca30c" : "#d03b3b";

  const width = 640;
  const height = 180;
  const padY = 14;
  const padX = 8;
  const usableH = height - padY * 2;
  const usableW = width - padX * 2;

  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const span = max - min || 1;
  const n = prices.length - 1;

  const points = prices.map(
    (p, i) => [padX + (n > 0 ? (i / n) * usableW : usableW / 2), padY + usableH - ((p - min) / span) * usableH] as const
  );
  const linePath = points.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`).join(" ");
  const areaPath = points.length
    ? `${linePath} L${points[points.length - 1][0]},${height - padY} L${points[0][0]},${height - padY} Z`
    : "";

  function handleMove(e: React.PointerEvent<SVGSVGElement>) {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect || n <= 0) return;
    const relX = ((e.clientX - rect.left) / rect.width) * width;
    const idx = Math.round(((relX - padX) / usableW) * n);
    setHoverIdx(Math.max(0, Math.min(n, idx)));
  }

  const hover = hoverIdx !== null ? points[hoverIdx] : null;
  const hoverPct = hover ? (hover[0] / width) * 100 : 0;

  return (
    <Card>
      <CardHeader
        eyebrow={ticker}
        title="Day Trading Sim"
        icon={<ClockIcon />}
        action={<span className="text-[11px] text-ink-muted">Simulated, not a forecast</span>}
      />

      <p className="mb-3 text-xs text-ink-secondary">{sessionLabel}</p>

      <div className="relative">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${width} ${height}`}
          width="100%"
          height={height}
          className="overflow-visible"
          onPointerMove={handleMove}
          onPointerLeave={() => setHoverIdx(null)}
          role="img"
          aria-label={`Simulated hour-by-hour price path for ${ticker} through market close`}
        >
          <defs>
            <linearGradient id={`daysim-fill-${id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.18} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <path d={areaPath} fill={`url(#daysim-fill-${id})`} stroke="none" />
          <path d={linePath} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          {points.map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r={i === 0 || i === n ? 3.5 : 2} fill={color} stroke="#10141f" strokeWidth={1.5} />
          ))}
          {hover && (
            <>
              <line x1={hover[0]} x2={hover[0]} y1={padY} y2={height - padY} stroke="rgba(255,255,255,0.25)" strokeWidth={1} />
              <circle cx={hover[0]} cy={hover[1]} r={4} fill={color} stroke="#10141f" strokeWidth={2} />
            </>
          )}
        </svg>

        {hover && hoverIdx !== null && (
          <div
            className={`pointer-events-none absolute top-0 rounded-lg border border-white/10 bg-surface-raised px-2.5 py-1.5 text-xs shadow-lg ${
              hoverPct < 12 ? "translate-x-0" : hoverPct > 88 ? "-translate-x-full" : "-translate-x-1/2"
            }`}
            style={{ left: `${hoverPct}%` }}
          >
            <div className="font-semibold text-ink-primary">{formatPrice(checkpoints[hoverIdx].price)}</div>
            <div className="text-[10px] text-ink-muted">{checkpoints[hoverIdx].label}</div>
          </div>
        )}
      </div>

      <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
        {checkpoints.map((c, i) => (
          <div
            key={i}
            className={`flex shrink-0 flex-col items-center rounded-lg border px-2.5 py-1.5 text-center ${
              c.isNow ? "border-accent-cyan/40 bg-accent-cyan/10" : "border-white/[0.06] bg-white/[0.02]"
            }`}
          >
            <span className="text-[10px] text-ink-muted">{c.isNow ? "Now" : c.label}</span>
            <span className="text-xs font-semibold tabular-nums text-ink-primary">{formatPrice(c.price)}</span>
          </div>
        ))}
      </div>

      <p className="mt-4 text-[11px] leading-relaxed text-ink-muted">
        A simulated hour-by-hour path to market close, derived from {ticker}&apos;s own volatility and the Neutral scenario
        above — not real intraday data or a guarantee of where the price will actually be at any given hour.
        {n > 0 && (
          <>
            {" "}
            Projected close: {formatPrice(prices[prices.length - 1])} (
            {signed(((prices[prices.length - 1] - prices[0]) / prices[0]) * 100, 1)}%).
          </>
        )}
      </p>
    </Card>
  );
}

function ClockIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <circle cx="9" cy="9" r="6.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M9 5.5V9l2.5 1.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
