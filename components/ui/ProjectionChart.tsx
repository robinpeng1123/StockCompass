"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Scenario } from "@/lib/types";
import { formatPrice, signed } from "@/lib/utils";

type Point = { t: number; close: number };

function formatAxisDate(unixMs: number) {
  return new Date(unixMs).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/**
 * Recent price history as a solid line, followed by a dashed gray line
 * projecting forward to the probability-weighted price implied by the
 * scenario table, landing at December 31 of the current year. Actual vs.
 * projected gets its own legend since two series share the chart, and
 * hover shows the value + date on either side of "Today".
 */
export function ProjectionChart({ ticker, scenarios }: { ticker: string; scenarios: Scenario[] }) {
  const id = useId();
  const svgRef = useRef<SVGSVGElement>(null);
  const [hist, setHist] = useState<Point[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoverX, setHoverX] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/history/${ticker}?range=1mo`)
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) {
          setHist(d.points ?? []);
          setLoading(false);
        }
      })
      .catch(() => !cancelled && setLoading(false));
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

  if (loading || hist.length < 2) {
    return (
      <div className="flex h-[200px] items-center justify-center text-xs text-ink-muted">
        <span className="h-2 w-2 animate-pulse-soft rounded-full bg-accent-cyan" />
        <span className="ml-2">Loading recent price history…</span>
      </div>
    );
  }

  const price = hist[hist.length - 1].close;
  const lastT = hist[hist.length - 1].t * 1000;
  const up = price >= hist[0].close;
  const color = up ? "#0ca30c" : "#d03b3b";

  const now = new Date();
  const yearEnd = Date.UTC(now.getUTCFullYear(), 11, 31);
  const msRemaining = Math.max(yearEnd - lastT, 86_400_000);
  const weeksRemaining = Math.max(1, Math.min(52, Math.ceil(msRemaining / (7 * 86_400_000))));

  const expectedPct = scenarios.reduce((sum, s) => sum + (s.probabilityPct / 100) * ((s.rangeLowPct + s.rangeHighPct) / 2), 0);
  const projectedPrice = price * (1 + expectedPct / 100);

  const totalSlots = hist.length - 1 + weeksRemaining;
  const closes = hist.map((p) => p.close);
  const min = Math.min(...closes, projectedPrice);
  const max = Math.max(...closes, projectedPrice);
  const span = max - min || 1;

  const xAt = (i: number) => axisW + padX + (i / totalSlots) * usableW;
  const yAt = (v: number) => padY + usableH - ((v - min) / span) * usableH;
  const dateAt = (i: number) => (i < hist.length ? hist[i].t * 1000 : lastT + (i - (hist.length - 1)) * (msRemaining / weeksRemaining));

  const histPoints = hist.map((p, i) => [xAt(i), yAt(p.close)] as const);
  const histPath = histPoints.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`).join(" ");

  const lastX = histPoints[histPoints.length - 1][0];
  const lastY = histPoints[histPoints.length - 1][1];
  const projX = xAt(totalSlots);
  const projY = yAt(projectedPrice);
  const projPath = `M${lastX.toFixed(2)},${lastY.toFixed(2)} L${projX.toFixed(2)},${projY.toFixed(2)}`;

  const yTicks = [0, 0.33, 0.66, 1].map((f) => ({ y: padY + usableH * (1 - f), value: min + span * f }));
  const xTickIdx = [0, Math.round(hist.length * 0.5), hist.length - 1, hist.length - 1 + Math.round(weeksRemaining * 0.5), totalSlots];
  const xTicks = Array.from(new Set(xTickIdx)).map((i) => ({ x: xAt(i), label: formatAxisDate(dateAt(i)) }));

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
      const f = Math.max(0, Math.min(1, (hoverX - lastX) / (projX - lastX)));
      hover = {
        x: hoverX,
        y: lastY + f * (projY - lastY),
        value: price + f * (projectedPrice - price),
        label: `${formatAxisDate(lastT + f * msRemaining)} (estimate)`,
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
          aria-label="Recent price history with a probability-weighted projection to year-end, hover for detail"
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

          <path d={projPath} fill="none" stroke="#5b6580" strokeWidth={2} strokeDasharray="5 4" strokeLinecap="round" />
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
            Year-end projection
          </span>
        </div>
        <span className="text-[11px] font-medium text-ink-secondary">
          Est. {formatPrice(projectedPrice)} by Dec 31 ({signed(expectedPct, 1)}%)
        </span>
      </div>
    </div>
  );
}
