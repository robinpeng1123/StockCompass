"use client";

import { useId } from "react";
import { Scenario } from "@/lib/types";
import { formatPrice, signed } from "@/lib/utils";

/**
 * Recent price history as a solid line, followed by a dashed gray line
 * projecting forward to the probability-weighted expected price implied by
 * the scenario table below it — actual vs. projected gets its own legend
 * since two series now share the chart.
 */
export function ProjectionChart({
  history,
  price,
  scenarios,
  color,
}: {
  history: number[];
  price: number;
  scenarios: Scenario[];
  color: string;
}) {
  const id = useId();
  const width = 640;
  const height = 180;
  const padY = 16;
  const padX = 4;

  const histCount = Math.min(history.length, 30);
  const hist = history.slice(-histCount);
  const projectionSteps = 8;

  const expectedPct = scenarios.reduce((sum, s) => sum + (s.probabilityPct / 100) * ((s.rangeLowPct + s.rangeHighPct) / 2), 0);
  const projectedPrice = price * (1 + expectedPct / 100);

  const totalSlots = hist.length - 1 + projectionSteps;
  const min = Math.min(...hist, projectedPrice);
  const max = Math.max(...hist, projectedPrice);
  const span = max - min || 1;
  const usableH = height - padY * 2;
  const usableW = width - padX * 2;

  const xAt = (i: number) => padX + (i / totalSlots) * usableW;
  const yAt = (v: number) => padY + usableH - ((v - min) / span) * usableH;

  const histPoints = hist.map((v, i) => [xAt(i), yAt(v)] as const);
  const histPath = histPoints.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`).join(" ");

  const lastX = histPoints[histPoints.length - 1][0];
  const lastY = histPoints[histPoints.length - 1][1];
  const projX = xAt(totalSlots);
  const projY = yAt(projectedPrice);
  const projPath = `M${lastX.toFixed(2)},${lastY.toFixed(2)} L${projX.toFixed(2)},${projY.toFixed(2)}`;

  const todayX = lastX;

  return (
    <div>
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} role="img" aria-label="Recent price history with a probability-weighted forward projection">
        <defs>
          <linearGradient id={`proj-fill-${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.14} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>

        {/* "today" boundary between actual and projected */}
        <line x1={todayX} x2={todayX} y1={padY} y2={height - padY} stroke="rgba(255,255,255,0.15)" strokeWidth={1} />
        <text x={todayX} y={padY - 4} textAnchor="middle" fontSize="10" fill="#5b6580">
          Today
        </text>

        <path d={`${histPath} L${lastX},${height - padY} L${padX},${height - padY} Z`} fill={`url(#proj-fill-${id})`} stroke="none" />
        <path d={histPath} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />

        <path d={projPath} fill="none" stroke="#5b6580" strokeWidth={2} strokeDasharray="5 4" strokeLinecap="round" />
        <circle cx={lastX} cy={lastY} r={4} fill={color} stroke="#10141f" strokeWidth={2} />
        <circle cx={projX} cy={projY} r={4} fill="#5b6580" stroke="#10141f" strokeWidth={2} />
      </svg>

      <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-4 text-[11px] text-ink-secondary">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
            Recent price
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-ink-muted" />
            Probability-weighted projection
          </span>
        </div>
        <span className="text-[11px] font-medium text-ink-secondary">
          Est. {formatPrice(projectedPrice)} ({signed(expectedPct, 1)}%)
        </span>
      </div>
    </div>
  );
}
