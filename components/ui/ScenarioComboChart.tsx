"use client";

import { useId, useRef, useState } from "react";
import { Scenario } from "@/lib/types";
import { formatPrice } from "@/lib/utils";
import { generateProjectionPath } from "@/lib/projectionPath";

const SCENARIO_COLOR: Record<Scenario["label"], string> = {
  Bullish: "#0ca30c",
  Neutral: "#5b6580",
  Bearish: "#d03b3b",
};

/**
 * All three scenario paths on one chart instead of three side-by-side mini
 * charts — same today's-price anchor on the left, diverging out to each
 * scenario's own probability-weighted target ~30 days out. Same
 * generateProjectionPath seeding as before (ticker + scenario label + date),
 * so each line's shape is unchanged from the old per-scenario mini charts.
 * Date x-axis and price y-axis, matching the convention used by the main
 * PriceChart.
 */
export function ScenarioComboChart({
  ticker,
  scenarios,
  price,
  volatilityScore,
}: {
  ticker: string;
  scenarios: Scenario[];
  price: number;
  volatilityScore: number;
}) {
  const id = useId();
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const width = 640;
  const height = 240;
  const axisW = 56;
  const padTop = 16;
  const padBottom = 22;
  const padRight = 14;
  const usableH = height - padTop - padBottom;
  const usableW = width - axisW - padRight;

  const now = new Date();
  const dateKey = now.toISOString().slice(0, 10);
  const horizonDays = 30;
  const endDate = new Date(now.getTime() + horizonDays * 86_400_000);
  const fmtDate = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const weeks = Math.max(3, Math.round(horizonDays / 7));
  const n = weeks;

  const paths = scenarios.map((s) => {
    const midpointPct = (s.rangeLowPct + s.rangeHighPct) / 2;
    const targetPrice = price * (1 + midpointPct / 100);
    const dailyVolPct = Math.min(5, Math.max(0.3, volatilityScore / 20));
    const weeklyVolPct = dailyVolPct * Math.sqrt(7);
    const path = generateProjectionPath({
      ticker: `${ticker}:${s.label}`,
      dateKey,
      startPrice: price,
      endPrice: targetPrice,
      days: weeks,
      dailyVolatilityPct: weeklyVolPct,
    });
    return { scenario: s, path };
  });

  const allValues = paths.flatMap((p) => p.path);
  const min = Math.min(...allValues);
  const max = Math.max(...allValues);
  const span = max - min || 1;

  const xAt = (i: number) => axisW + (i / n) * usableW;
  const yAt = (v: number) => padTop + usableH - ((v - min) / span) * usableH;

  const baseline = height - padBottom;
  const linesWithPoints = paths.map(({ scenario, path }) => {
    const points = path.map((v, i) => [xAt(i), yAt(v)] as const);
    const linePath = points.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`).join(" ");
    const areaPath = `${linePath} L${points[n][0]},${baseline} L${points[0][0]},${baseline} Z`;
    return { scenario, path, points, linePath, areaPath };
  });

  const yTicks = [0, 0.33, 0.66, 1].map((f) => ({ y: padTop + usableH * (1 - f), value: min + span * f }));
  const xTicks = Array.from({ length: n + 1 }, (_, i) => ({
    x: xAt(i),
    label: i === 0 ? "Today" : fmtDate(new Date(now.getTime() + (i / n) * horizonDays * 86_400_000)),
  }));

  function handleMove(e: React.PointerEvent<SVGSVGElement>) {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const relX = ((e.clientX - rect.left) / rect.width) * width;
    const idx = Math.round(((relX - axisW) / usableW) * n);
    setHoverIdx(Math.max(0, Math.min(n, idx)));
  }

  const hoverX = hoverIdx !== null ? xAt(hoverIdx) : null;
  const hoverPct = hoverX !== null ? (hoverX / width) * 100 : 0;
  const hoverDate =
    hoverIdx === null || hoverIdx === 0
      ? "Today"
      : fmtDate(new Date(now.getTime() + (hoverIdx / n) * horizonDays * 86_400_000));

  return (
    <div className="relative">
      <div className="mb-2 flex flex-wrap items-center gap-4 text-[11px] text-ink-secondary">
        {scenarios.map((s) => (
          <span key={s.label} className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: SCENARIO_COLOR[s.label] }} />
            {s.label}
          </span>
        ))}
      </div>

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
        aria-label={`${ticker} simulated Bullish, Neutral, and Bearish price paths from today to a ${fmtDate(endDate)} estimate`}
      >
        <defs>
          {linesWithPoints.map(({ scenario }) => (
            <linearGradient key={scenario.label} id={`combo-fill-${id}-${scenario.label}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={SCENARIO_COLOR[scenario.label]} stopOpacity={0.12} />
              <stop offset="100%" stopColor={SCENARIO_COLOR[scenario.label]} stopOpacity={0} />
            </linearGradient>
          ))}
        </defs>

        {/* Y-axis: gridlines + price labels */}
        {yTicks.map((t, i) => (
          <g key={i}>
            <line x1={axisW} x2={width} y1={t.y} y2={t.y} stroke="#2c2c2a" strokeWidth={1} />
            <text x={axisW - 8} y={t.y + 3} textAnchor="end" fontSize="10" fill="#5b6580">
              {formatPrice(t.value)}
            </text>
          </g>
        ))}

        {linesWithPoints.map(({ scenario, areaPath }) => (
          <path key={scenario.label} d={areaPath} fill={`url(#combo-fill-${id}-${scenario.label})`} stroke="none" />
        ))}

        {linesWithPoints.map(({ scenario, linePath }) => (
          <path
            key={scenario.label}
            d={linePath}
            fill="none"
            stroke={SCENARIO_COLOR[scenario.label]}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}

        {/* One shared dot for today's price — every line starts here. */}
        <circle cx={xAt(0)} cy={yAt(price)} r={4} fill="#eef1fb" stroke="#10141f" strokeWidth={1.5} />

        {linesWithPoints.map(({ scenario, points }) => (
          <circle
            key={scenario.label}
            cx={points[n][0]}
            cy={points[n][1]}
            r={3.5}
            fill={SCENARIO_COLOR[scenario.label]}
            stroke="#10141f"
            strokeWidth={1.5}
          />
        ))}

        {hoverX !== null && (
          <>
            <line x1={hoverX} x2={hoverX} y1={padTop} y2={height - padBottom} stroke="rgba(255,255,255,0.2)" strokeWidth={1} />
            {linesWithPoints.map(({ scenario, points }) => (
              <circle
                key={scenario.label}
                cx={hoverX}
                cy={points[hoverIdx!][1]}
                r={4}
                fill={SCENARIO_COLOR[scenario.label]}
                stroke="#10141f"
                strokeWidth={2}
              />
            ))}
          </>
        )}

        {/* End-of-path price labels, one per scenario, at their own y-position. */}
        {linesWithPoints.map(({ scenario, points }) => (
          <text
            key={scenario.label}
            x={points[n][0] + 6}
            y={points[n][1]}
            dominantBaseline="middle"
            fontSize="11"
            fontWeight={600}
            fill={SCENARIO_COLOR[scenario.label]}
          >
            {formatPrice(paths.find((p) => p.scenario.label === scenario.label)!.path[n])}
          </text>
        ))}

        {/* X-axis: date labels */}
        {xTicks.map((t, i) => (
          <text key={i} x={t.x} y={height - 4} textAnchor={i === 0 ? "start" : i === xTicks.length - 1 ? "end" : "middle"} fontSize="10" fill="#5b6580">
            {t.label}
          </text>
        ))}
      </svg>

      {hoverX !== null && hoverIdx !== null && (
        <div
          className={`pointer-events-none absolute top-0 rounded-lg border border-white/10 bg-surface-raised px-2.5 py-1.5 text-xs shadow-lg ${
            hoverPct < 20 ? "translate-x-0" : hoverPct > 78 ? "-translate-x-full" : "-translate-x-1/2"
          }`}
          style={{ left: `${hoverPct}%` }}
        >
          <div className="mb-1 font-semibold text-ink-primary">{hoverDate}</div>
          {linesWithPoints.map(({ scenario, path }) => (
            <div key={scenario.label} className="flex items-center gap-1.5 text-[11px]">
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: SCENARIO_COLOR[scenario.label] }} />
              <span className="text-ink-secondary">{scenario.label}</span>
              <span className="ml-auto font-medium tabular-nums text-ink-primary">{formatPrice(path[hoverIdx])}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
