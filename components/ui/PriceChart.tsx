"use client";

import { useId, useRef, useState } from "react";
import { formatPrice } from "@/lib/utils";

/**
 * Single-series price chart with a crosshair + tooltip hover layer (per the
 * dataviz interaction spec — a line/area chart ships hover by default).
 * One series → no legend box; the panel title already names what's plotted.
 */
export function PriceChart({
  data,
  color = "#3987e5",
  height = 220,
}: {
  data: number[];
  color?: string;
  height?: number;
}) {
  const id = useId();
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const width = 640;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const padY = 16;
  const padX = 4;
  const usableH = height - padY * 2;
  const usableW = width - padX * 2;

  const points = data.map((v, i) => {
    const x = padX + (i / (data.length - 1)) * usableW;
    const y = padY + usableH - ((v - min) / span) * usableH;
    return [x, y] as const;
  });

  const linePath = points.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`).join(" ");
  const areaPath = `${linePath} L${points[points.length - 1][0]},${height} L${points[0][0]},${height} Z`;

  const gridLines = [0.25, 0.5, 0.75].map((f) => padY + usableH * f);

  function handleMove(e: React.PointerEvent<SVGSVGElement>) {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const relX = ((e.clientX - rect.left) / rect.width) * width;
    const idx = Math.round(((relX - padX) / usableW) * (data.length - 1));
    setHoverIdx(Math.max(0, Math.min(data.length - 1, idx)));
  }

  const hover = hoverIdx !== null ? points[hoverIdx] : null;

  return (
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
        aria-label="Price history with hover detail"
      >
        <defs>
          <linearGradient id={`price-fill-${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.16} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>

        {gridLines.map((y, i) => (
          <line key={i} x1={0} x2={width} y1={y} y2={y} stroke="#2c2c2a" strokeWidth={1} />
        ))}

        <path d={areaPath} fill={`url(#price-fill-${id})`} stroke="none" />
        <path d={linePath} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />

        {hover && (
          <>
            <line x1={hover[0]} x2={hover[0]} y1={padY} y2={height - padY} stroke="rgba(255,255,255,0.25)" strokeWidth={1} />
            <circle cx={hover[0]} cy={hover[1]} r={4} fill={color} stroke="#10141f" strokeWidth={2} />
          </>
        )}
      </svg>

      {hover && hoverIdx !== null && (
        <div
          className="pointer-events-none absolute top-0 -translate-x-1/2 rounded-lg border border-white/10 bg-surface-raised px-2.5 py-1.5 text-xs shadow-lg"
          style={{ left: `${(hover[0] / width) * 100}%` }}
        >
          <div className="font-semibold text-ink-primary">{formatPrice(data[hoverIdx])}</div>
          <div className="text-[10px] text-ink-muted">Session {hoverIdx + 1} of {data.length}</div>
        </div>
      )}
    </div>
  );
}
