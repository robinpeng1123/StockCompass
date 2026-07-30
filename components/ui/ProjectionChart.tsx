"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Scenario } from "@/lib/types";
import { formatPrice, signed } from "@/lib/utils";
import { generateProjectionPath } from "@/lib/projectionPath";

type Point = { t: number; close: number };

function formatAxisDate(unixMs: number) {
  return new Date(unixMs).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function recentDailyVolatilityPct(closes: number[]) {
  if (closes.length < 3) return 1.5;
  const returns: number[] = [];
  for (let i = 1; i < closes.length; i++) returns.push((closes[i] - closes[i - 1]) / closes[i - 1]);
  const mean = returns.reduce((s, r) => s + r, 0) / returns.length;
  const variance = returns.reduce((s, r) => s + (r - mean) ** 2, 0) / returns.length;
  return Math.sqrt(variance) * 100;
}

/**
 * Recent price history as a solid line, followed by a dashed gray line
 * projecting forward — with realistic-looking ups and downs, not a straight
 * ramp — to the probability-weighted price implied by the scenario table,
 * landing at the end of the current month. The wiggle is seeded by ticker +
 * today's date, so it's stable all day and only reshapes the next day.
 * Actual vs. projected gets its own legend, and hover shows value + date on
 * either side of "Today".
 */
export function ProjectionChart({ ticker, scenarios }: { ticker: string; scenarios: Scenario[] }) {
  const id = useId();
  const svgRef = useRef<SVGSVGElement>(null);
  const [hist, setHist] = useState<Point[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [hoverX, setHoverX] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setFailed(false);
    fetch(`/api/history/${ticker}?range=1mo`)
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        const points: Point[] = d.points ?? [];
        setHist(points);
        setFailed(points.length < 2);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setFailed(true);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [ticker]);

  const width = 640;
  const height = 200;
  const padY = 16;
  const padX = 4;
  const axisW = 56;
  const usableH = height - padY * 2;
  const usableW = width - padX * 2 - axisW;

  if (loading) {
    return (
      <div className="flex h-[200px] items-center justify-center text-xs text-ink-muted">
        <span className="h-2 w-2 animate-pulse-soft rounded-full bg-accent-cyan" />
        <span className="ml-2">Loading recent price history…</span>
      </div>
    );
  }

  if (failed || hist.length < 2) {
    return (
      <div className="flex h-[200px] items-center justify-center text-xs text-ink-muted">
        Couldn&apos;t load price history for {ticker} right now.
      </div>
    );
  }

  const price = hist[hist.length - 1].close;
  const lastT = hist[hist.length - 1].t * 1000;
  const up = price >= hist[0].close;
  const color = up ? "#0ca30c" : "#d03b3b";

  const now = new Date();
  const dateKey = now.toISOString().slice(0, 10);
  const monthEnd = Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0);
  const msRemaining = Math.max(monthEnd - lastT, 86_400_000);
  const daysRemaining = Math.max(1, Math.min(31, Math.round(msRemaining / 86_400_000)));

  const expectedPct = scenarios.reduce((sum, s) => sum + (s.probabilityPct / 100) * ((s.rangeLowPct + s.rangeHighPct) / 2), 0);
  const projectedPrice = price * (1 + expectedPct / 100);
  const dailyVol = recentDailyVolatilityPct(hist.map((p) => p.close));
  const wigglePath = generateProjectionPath({ ticker, dateKey, startPrice: price, endPrice: projectedPrice, days: daysRemaining, dailyVolatilityPct: dailyVol });

  const totalSlots = hist.length - 1 + daysRemaining;
  const closes = hist.map((p) => p.close);
  const min = Math.min(...closes, ...wigglePath);
  const max = Math.max(...closes, ...wigglePath);
  const span = max - min || 1;

  const xAt = (i: number) => axisW + padX + (i / totalSlots) * usableW;
  const yAt = (v: number) => padY + usableH - ((v - min) / span) * usableH;
  const dateAt = (i: number) => (i < hist.length ? hist[i].t * 1000 : lastT + (i - (hist.length - 1)) * (msRemaining / daysRemaining));

  const histPoints = hist.map((p, i) => [xAt(i), yAt(p.close)] as const);
  const histPath = histPoints.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`).join(" ");

  const lastX = histPoints[histPoints.length - 1][0];
  const lastY = histPoints[histPoints.length - 1][1];

  const projPoints = wigglePath.map((v, i) => [xAt(hist.length - 1 + i), yAt(v)] as const);
  const projPath = projPoints.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`).join(" ");
  const projX = projPoints[projPoints.length - 1][0];
  const projY = projPoints[projPoints.length - 1][1];

  const yTicks = [0, 0.33, 0.66, 1].map((f) => ({ y: padY + usableH * (1 - f), value: min + span * f }));
  const xTickIdx = [0, Math.round(hist.length * 0.5), hist.length - 1, hist.length - 1 + Math.round(daysRemaining * 0.5), totalSlots];
  const xTicks: { x: number; label: string }[] = [];
  for (const i of Array.from(new Set(xTickIdx))) {
    const x = xAt(i);
    if (xTicks.length > 0 && x - xTicks[xTicks.length - 1].x < 36) continue; // avoid label collisions when the range is short
    xTicks.push({ x, label: formatAxisDate(dateAt(i)) });
  }

  function handleMove(e: React.PointerEvent<SVGSVGElement>) {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const relX = ((e.clientX - rect.left) / rect.width) * width;
    setHoverX(Math.max(axisW + padX, Math.min(projX, relX)));
  }

  let hover: { x: number; y: number; value: number; label: string; isProjected: boolean } | null = null;
  if (hoverX !== null) {
    if (hoverX <= lastX) {
      const idx = Math.max(0, Math.min(hist.length - 1, Math.round(((hoverX - axisW - padX) / usableW) * totalSlots)));
      hover = { x: histPoints[idx][0], y: histPoints[idx][1], value: hist[idx].close, label: formatAxisDate(hist[idx].t * 1000), isProjected: false };
    } else {
      // Find the projected-path segment the pointer falls in and interpolate within it.
      let segIdx = 0;
      for (let i = 0; i < projPoints.length - 1; i++) {
        if (hoverX >= projPoints[i][0] && hoverX <= projPoints[i + 1][0]) {
          segIdx = i;
          break;
        }
        segIdx = i;
      }
      const [x0, y0] = projPoints[segIdx];
      const [x1, y1] = projPoints[Math.min(segIdx + 1, projPoints.length - 1)];
      const f = x1 > x0 ? Math.max(0, Math.min(1, (hoverX - x0) / (x1 - x0))) : 0;
      hover = {
        x: hoverX,
        y: y0 + f * (y1 - y0),
        value: wigglePath[segIdx] + f * (wigglePath[Math.min(segIdx + 1, wigglePath.length - 1)] - wigglePath[segIdx]),
        label: `${formatAxisDate(dateAt(hist.length - 1 + segIdx + f))} (estimate)`,
        isProjected: true,
      };
    }
  }

  return (
    <div>
      <div className="relative">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${width} ${height}`}
          width="100%"
          height={height}
          className="overflow-visible"
          onPointerMove={handleMove}
          onPointerLeave={() => setHoverX(null)}
          role="img"
          aria-label="Recent price history with a probability-weighted projection to month-end, hover for detail"
        >
          <defs>
            <linearGradient id={`proj-fill-${id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.14} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>

          {yTicks.map((t, i) => (
            <g key={i}>
              <line x1={axisW} x2={width} y1={t.y} y2={t.y} stroke="#2c2c2a" strokeWidth={1} />
              <text x={axisW - 8} y={t.y + 3} textAnchor="end" fontSize="10" fill="#5b6580">
                {formatPrice(t.value)}
              </text>
            </g>
          ))}

          <line x1={lastX} x2={lastX} y1={padY} y2={height - padY} stroke="rgba(255,255,255,0.15)" strokeWidth={1} />
          <text x={lastX} y={padY - 4} textAnchor="middle" fontSize="10" fill="#5b6580">
            Today
          </text>

          <path d={`${histPath} L${lastX},${height - padY} L${axisW + padX},${height - padY} Z`} fill={`url(#proj-fill-${id})`} stroke="none" />
          <path d={histPath} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />

          <path d={projPath} fill="none" stroke="#5b6580" strokeWidth={2} strokeDasharray="5 4" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx={lastX} cy={lastY} r={4} fill={color} stroke="#10141f" strokeWidth={2} />
          <circle cx={projX} cy={projY} r={4} fill="#5b6580" stroke="#10141f" strokeWidth={2} />

          {xTicks.map((t, i) => (
            <text key={i} x={t.x} y={height - 2} textAnchor="middle" fontSize="10" fill="#5b6580">
              {t.label}
            </text>
          ))}

          {hover && (
            <>
              <line x1={hover.x} x2={hover.x} y1={padY} y2={height - padY} stroke="rgba(255,255,255,0.25)" strokeWidth={1} />
              <circle cx={hover.x} cy={hover.y} r={4} fill={hover.isProjected ? "#5b6580" : color} stroke="#10141f" strokeWidth={2} />
            </>
          )}
        </svg>

        {hover && (
          <div
            className="pointer-events-none absolute top-0 -translate-x-1/2 rounded-lg border border-white/10 bg-surface-raised px-2.5 py-1.5 text-xs shadow-lg"
            style={{ left: `${(hover.x / width) * 100}%` }}
          >
            <div className="font-semibold text-ink-primary">{formatPrice(hover.value)}</div>
            <div className="text-[10px] text-ink-muted">{hover.label}</div>
          </div>
        )}
      </div>

      <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-4 text-[11px] text-ink-secondary">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
            Recent price
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-ink-muted" />
            Month-end projection
          </span>
        </div>
        <span className="text-[11px] font-medium text-ink-secondary">
          Est. {formatPrice(projectedPrice)} by {formatAxisDate(monthEnd)} ({signed(expectedPct, 1)}%)
        </span>
      </div>
    </div>
  );
}
