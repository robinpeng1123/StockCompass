"use client";

import { useId, useRef, useState } from "react";
import { Scenario } from "@/lib/types";
import { formatPrice } from "@/lib/utils";
import { generateProjectionPath } from "@/lib/projectionPath";

/**
 * One scenario's own compact chart: today's real price anchors the left
 * edge, a jagged (not straight) simulated path runs to that scenario's
 * target price at the right edge — no history shown here, no client fetch,
 * everything comes from props already available on the page. Seeded by
 * ticker + scenario + date, so it's stable all day and reshapes tomorrow.
 */
export function ScenarioMiniChart({
  ticker,
  scenario,
  price,
  volatilityScore,
  color,
}: {
  ticker: string;
  scenario: Scenario;
  price: number;
  volatilityScore: number;
  color: string;
}) {
  const id = useId();
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const width = 220;
  const height = 110;
  const padY = 10;
  const padX = 6;
  const usableH = height - padY * 2;
  const usableW = width - padX * 2;

  const now = new Date();
  const dateKey = now.toISOString().slice(0, 10);
  const monthEnd = Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0);
  const daysRemaining = Math.max(1, Math.min(31, Math.round((monthEnd - now.getTime()) / 86_400_000)));
  // Plot week-over-week rather than day-over-day — fewer, bigger steps read as
  // a much more jagged zigzag than a smoothed-out daily line. Floored at 3 so
  // the path still has room to zigzag even in the last few days of the month.
  const weeksRemaining = Math.max(3, Math.round(daysRemaining / 7));

  const midpointPct = (scenario.rangeLowPct + scenario.rangeHighPct) / 2;
  const targetPrice = price * (1 + midpointPct / 100);
  const dailyVolPct = Math.min(5, Math.max(0.3, volatilityScore / 20));
  const weeklyVolPct = dailyVolPct * Math.sqrt(7);

  const path = generateProjectionPath({
    ticker: `${ticker}:${scenario.label}`,
    dateKey,
    startPrice: price,
    endPrice: targetPrice,
    days: weeksRemaining,
    dailyVolatilityPct: weeklyVolPct,
  });

  const min = Math.min(...path);
  const max = Math.max(...path);
  const span = max - min || 1;
  const n = path.length - 1;

  const points = path.map((v, i) => [padX + (i / n) * usableW, padY + usableH - ((v - min) / span) * usableH] as const);
  const linePath = points.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`).join(" ");
  const areaPath = `${linePath} L${points[n][0]},${height - padY} L${points[0][0]},${height - padY} Z`;

  function handleMove(e: React.PointerEvent<SVGSVGElement>) {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const relX = ((e.clientX - rect.left) / rect.width) * width;
    const idx = Math.round(((relX - padX) / usableW) * n);
    setHoverIdx(Math.max(0, Math.min(n, idx)));
  }

  const hover = hoverIdx !== null ? points[hoverIdx] : null;
  const hoverPct = hover ? (hover[0] / width) * 100 : 0;

  return (
    <div className="relative">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${width} ${height}`}
        width="100%"
        height={height}
        onPointerMove={handleMove}
        onPointerLeave={() => setHoverIdx(null)}
        role="img"
        aria-label={`${scenario.label} simulated path from today's price to a month-end estimate`}
      >
        <defs>
          <linearGradient id={`mini-fill-${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.18} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <path d={areaPath} fill={`url(#mini-fill-${id})`} stroke="none" />
        <path d={linePath} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        <circle cx={points[0][0]} cy={points[0][1]} r={3.5} fill={color} stroke="#10141f" strokeWidth={1.5} />
        <circle cx={points[n][0]} cy={points[n][1]} r={3.5} fill={color} stroke="#10141f" strokeWidth={1.5} />
        {hover && (
          <>
            <line x1={hover[0]} x2={hover[0]} y1={padY} y2={height - padY} stroke="rgba(255,255,255,0.25)" strokeWidth={1} />
            <circle cx={hover[0]} cy={hover[1]} r={3.5} fill={color} stroke="#10141f" strokeWidth={1.5} />
          </>
        )}
      </svg>

      {hover && hoverIdx !== null && (
        <div
          className={`pointer-events-none absolute top-0 rounded-lg border border-white/10 bg-surface-raised px-2 py-1 text-[11px] shadow-lg ${
            hoverPct < 15 ? "translate-x-0" : hoverPct > 85 ? "-translate-x-full" : "-translate-x-1/2"
          }`}
          style={{ left: `${hoverPct}%` }}
        >
          <div className="font-semibold text-ink-primary">{formatPrice(path[hoverIdx])}</div>
          <div className="text-[9px] text-ink-muted">{hoverIdx === 0 ? "Today" : hoverIdx === n ? "Month-end" : `Week ${hoverIdx}`}</div>
        </div>
      )}

      <div className="mt-1 flex justify-between text-[10px] text-ink-muted">
        <span>Today · {formatPrice(price)}</span>
        <span className="font-medium" style={{ color }}>
          {formatPrice(targetPrice)}
        </span>
      </div>
    </div>
  );
}
