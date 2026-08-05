"use client";

import { useEffect, useId, useRef, useState } from "react";
import { formatPrice } from "@/lib/utils";
import { CHART_RANGES, ChartRangeKey, RANGE_LABELS } from "@/lib/chartRanges";

type Point = { t: number; close: number };

function formatAxisDate(unixSeconds: number, rangeKey: ChartRangeKey) {
  const d = new Date(unixSeconds * 1000);
  if (rangeKey === "1d") return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  if (rangeKey === "5d") return d.toLocaleDateString("en-US", { weekday: "short" });
  if (rangeKey === "max") return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/**
 * Single-series price chart with a range switcher (Today/5D/Month/Year/Max),
 * a date x-axis and price y-axis, and a crosshair + tooltip hover layer.
 */
export function PriceChart({ ticker }: { ticker: string }) {
  const id = useId();
  const svgRef = useRef<SVGSVGElement>(null);
  const [rangeKey, setRangeKey] = useState<ChartRangeKey>("1mo");
  const [points, setPoints] = useState<Point[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`/api/history/${ticker}?range=${rangeKey}`)
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        setPoints(d.points ?? []);
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [ticker, rangeKey]);

  const width = 640;
  const height = 220;
  const padY = 16;
  const padX = 4;
  const axisW = 56;
  const usableH = height - padY * 2;
  const usableW = width - padX * 2 - axisW;

  const data = points.map((p) => p.close);
  const up = data.length > 1 ? data[data.length - 1] >= data[0] : true;
  const color = up ? "#0ca30c" : "#d03b3b";

  const min = data.length ? Math.min(...data) : 0;
  const max = data.length ? Math.max(...data) : 1;
  const span = max - min || 1;

  const xy = points.map((p, i) => {
    const x = axisW + padX + (data.length > 1 ? (i / (data.length - 1)) * usableW : usableW / 2);
    const y = padY + usableH - ((p.close - min) / span) * usableH;
    return [x, y] as const;
  });

  const linePath = xy.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`).join(" ");
  const areaPath = xy.length ? `${linePath} L${xy[xy.length - 1][0]},${height - padY} L${xy[0][0]},${height - padY} Z` : "";

  const yTicks = [0, 0.33, 0.66, 1].map((f) => ({ y: padY + usableH * (1 - f), value: min + span * f }));
  const xTickCount = Math.min(5, points.length);
  const xTicks =
    xTickCount > 1
      ? Array.from({ length: xTickCount }, (_, i) => {
          const idx = Math.round((i / (xTickCount - 1)) * (points.length - 1));
          return { x: xy[idx]?.[0] ?? 0, label: formatAxisDate(points[idx].t, rangeKey) };
        })
      : [];

  function handleMove(e: React.PointerEvent<SVGSVGElement>) {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect || data.length === 0) return;
    const relX = ((e.clientX - rect.left) / rect.width) * width;
    const idx = Math.round(((relX - axisW - padX) / usableW) * (data.length - 1));
    setHoverIdx(Math.max(0, Math.min(data.length - 1, idx)));
  }

  const hover = hoverIdx !== null ? xy[hoverIdx] : null;
  const hoverPct = hover ? (hover[0] / width) * 100 : 0;

  return (
    <div>
      <div className="relative">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${width} ${height}`}
          width="100%"
          height={height}
          className="touch-none overflow-visible"
          onPointerDown={handleMove}
          onPointerMove={handleMove}
          onPointerLeave={() => setHoverIdx(null)}
          role="img"
          aria-label={`${RANGE_LABELS[rangeKey]} price history with hover detail`}
        >
          <defs>
            <linearGradient id={`price-fill-${id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.16} />
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

          {!loading && xy.length > 0 && (
            <>
              <path d={areaPath} fill={`url(#price-fill-${id})`} stroke="none" />
              <path d={linePath} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            </>
          )}

          {xTicks.map((t, i) => (
            <text key={i} x={t.x} y={height - 2} textAnchor="middle" fontSize="10" fill="#5b6580">
              {t.label}
            </text>
          ))}

          {hover && (
            <>
              <line x1={hover[0]} x2={hover[0]} y1={padY} y2={height - padY} stroke="rgba(255,255,255,0.25)" strokeWidth={1} />
              <circle cx={hover[0]} cy={hover[1]} r={4} fill={color} stroke="#10141f" strokeWidth={2} />
            </>
          )}
        </svg>

        {loading && (
          <div className="absolute inset-0 flex items-center justify-center text-xs text-ink-muted">
            <span className="h-2 w-2 animate-pulse-soft rounded-full bg-accent-cyan" />
            <span className="ml-2">Loading {RANGE_LABELS[rangeKey].toLowerCase()}…</span>
          </div>
        )}

        {hover && hoverIdx !== null && !loading && (
          <div
            className={`pointer-events-none absolute top-0 rounded-lg border border-white/10 bg-surface-raised px-2.5 py-1.5 text-xs shadow-lg ${
              hoverPct < 12 ? "translate-x-0" : hoverPct > 88 ? "-translate-x-full" : "-translate-x-1/2"
            }`}
            style={{ left: `${hoverPct}%` }}
          >
            <div className="font-semibold text-ink-primary">{formatPrice(data[hoverIdx])}</div>
            <div className="text-[10px] text-ink-muted">{formatAxisDate(points[hoverIdx].t, rangeKey)}</div>
          </div>
        )}
      </div>

      <div className="mt-3 flex flex-wrap justify-center gap-1.5">
        {CHART_RANGES.map((r) => (
          <button
            key={r}
            onClick={() => setRangeKey(r)}
            className={`whitespace-nowrap rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
              rangeKey === r ? "bg-white/[0.08] text-ink-primary" : "text-ink-muted hover:bg-white/[0.04] hover:text-ink-secondary"
            }`}
          >
            {RANGE_LABELS[r]}
          </button>
        ))}
      </div>
    </div>
  );
}
