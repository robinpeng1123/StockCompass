"use client";

import { useId } from "react";

/**
 * Compact trend line for a stat tile / stock row. Single series, so no legend
 * is needed — the line's color already reads via the adjacent delta text.
 * Per the stat-tile contract: whole trend in a de-emphasis hue, final segment
 * in the accent (series) color, 2px line, ~10% area wash, 8px end marker with
 * a 2px surface ring.
 */
export function Sparkline({
  data,
  width = 120,
  height = 36,
  color = "#3987e5",
  className,
}: {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  className?: string;
}) {
  const id = useId();
  if (data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const padY = height * 0.12;
  const usableH = height - padY * 2;

  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = padY + usableH - ((v - min) / span) * usableH;
    return [x, y] as const;
  });

  const linePath = points.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`).join(" ");
  const areaPath = `${linePath} L${width},${height} L0,${height} Z`;
  const [lastX, lastY] = points[points.length - 1];
  const deemphasis = "rgba(151,163,196,0.55)"; // ink-secondary, de-emphasis hue

  // Highlight roughly the last 20% of the series in the accent color.
  const splitIdx = Math.max(1, Math.floor(points.length * 0.8));
  const emphasisPath = points
    .slice(splitIdx - 1)
    .map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`)
    .join(" ");

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className={className} role="img" aria-label="Price trend, recent sessions">
      <defs>
        <linearGradient id={`spark-fill-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.12} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#spark-fill-${id})`} stroke="none" />
      <path d={linePath} fill="none" stroke={deemphasis} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <path d={emphasisPath} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={lastX} cy={lastY} r={4} fill={color} stroke="#10141f" strokeWidth={2} />
    </svg>
  );
}
