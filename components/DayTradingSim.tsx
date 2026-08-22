"use client";

import { useId, useMemo, useRef, useState } from "react";
import { Scenario } from "@/lib/types";
import { Card, CardHeader } from "@/components/ui/Card";
import { formatPrice, signed } from "@/lib/utils";
import { buildDayTradingSim } from "@/lib/dayTradingSim";

export function DayTradingSim({
  ticker,
  price,
  dailyVolPct,
  scenarios,
}: {
  ticker: string;
  price: number;
  /** The model's own measured daily volatility (real %) — see getDailyVolatilityPct. */
  dailyVolPct: number;
  scenarios: Scenario[];
}) {
  const id = useId();
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoverFrac, setHoverFrac] = useState<number | null>(null);

  const sim = useMemo(() => {
    const neutral = scenarios.find((s) => s.label === "Neutral");
    const neutralMidpointPct = neutral ? (neutral.rangeLowPct + neutral.rangeHighPct) / 2 : 0;
    return buildDayTradingSim({ ticker, currentPrice: price, dailyVolPct, neutralMidpointPct });
  }, [ticker, price, dailyVolPct, scenarios]);

  const { checkpoints, sessionLabel } = sim;
  const prices = checkpoints.map((c) => c.price);
  const up = prices.length > 1 ? prices[prices.length - 1] >= prices[0] : true;
  const color = up ? "#0ca30c" : "#d03b3b";

  const width = 640;
  const height = 200;
  const axisW = 56;
  const padTop = 14;
  const padBottom = 22;
  const padRight = 8;
  const usableH = height - padTop - padBottom;
  const usableW = width - axisW - padRight;

  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const span = max - min || 1;
  const n = prices.length - 1;

  const points = prices.map(
    (p, i) => [axisW + (n > 0 ? (i / n) * usableW : usableW / 2), padTop + usableH - ((p - min) / span) * usableH] as const
  );
  const linePath = points.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`).join(" ");
  const baseline = height - padBottom;
  const areaPath = points.length ? `${linePath} L${points[points.length - 1][0]},${baseline} L${points[0][0]},${baseline} Z` : "";

  const yTicks = [0, 0.33, 0.66, 1].map((f) => ({ y: padTop + usableH * (1 - f), value: min + span * f }));

  function handleMove(e: React.PointerEvent<SVGSVGElement>) {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect || n <= 0) return;
    const relX = ((e.clientX - rect.left) / rect.width) * width;
    const frac = ((relX - axisW) / usableW) * n;
    setHoverFrac(Math.max(0, Math.min(n, frac)));
  }

  // Interpolated continuously between the two nearest hourly checkpoints,
  // rather than snapping to one, so the crosshair glides smoothly with the
  // pointer. The displayed time still names the nearer checkpoint — the
  // simulation itself only has hourly resolution, so an interpolated
  // "10:14 AM" would imply more precision than the data actually has.
  let hover: readonly [number, number] | null = null;
  let hoverPrice = 0;
  let hoverCheckpointIdx = 0;
  if (hoverFrac !== null && n > 0) {
    const i0 = Math.floor(hoverFrac);
    const i1 = Math.min(n, i0 + 1);
    const t = hoverFrac - i0;
    hover = [points[i0][0] + (points[i1][0] - points[i0][0]) * t, points[i0][1] + (points[i1][1] - points[i0][1]) * t];
    hoverPrice = prices[i0] + (prices[i1] - prices[i0]) * t;
    hoverCheckpointIdx = t < 0.5 ? i0 : i1;
  }
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
          className="touch-none overflow-visible"
          onPointerDown={handleMove}
          onPointerMove={handleMove}
          onPointerLeave={() => setHoverFrac(null)}
          role="img"
          aria-label={`Simulated hour-by-hour price path for ${ticker} through market close`}
        >
          <defs>
            <linearGradient id={`daysim-fill-${id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.18} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
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

          <path d={areaPath} fill={`url(#daysim-fill-${id})`} stroke="none" />
          <path d={linePath} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          {points.map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r={i === 0 || i === n ? 3.5 : 2} fill={color} stroke="#10141f" strokeWidth={1.5} />
          ))}
          {hover && (
            <>
              <line x1={hover[0]} x2={hover[0]} y1={padTop} y2={baseline} stroke="rgba(255,255,255,0.25)" strokeWidth={1} />
              <circle cx={hover[0]} cy={hover[1]} r={4} fill={color} stroke="#10141f" strokeWidth={2} />
            </>
          )}

          {/* X-axis: time labels */}
          {points.map(([x], i) => (
            <text
              key={i}
              x={x}
              y={height - 4}
              textAnchor={i === 0 ? "start" : i === n ? "end" : "middle"}
              fontSize="10"
              fill="#5b6580"
            >
              {checkpoints[i].isNow ? "Now" : checkpoints[i].label}
            </text>
          ))}
        </svg>

        {hover && (
          <div
            className={`pointer-events-none absolute top-0 rounded-lg border border-white/10 bg-surface-raised px-2.5 py-1.5 text-xs shadow-lg ${
              hoverPct < 12 ? "translate-x-0" : hoverPct > 88 ? "-translate-x-full" : "-translate-x-1/2"
            }`}
            style={{ left: `${hoverPct}%` }}
          >
            <div className="font-semibold text-ink-primary">{formatPrice(hoverPrice)}</div>
            <div className="text-[10px] text-ink-muted">{checkpoints[hoverCheckpointIdx].label}</div>
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
