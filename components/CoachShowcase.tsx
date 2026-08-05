"use client";

import { useState } from "react";
import Link from "next/link";
import { Pattern, Scenario, Stock } from "@/lib/types";
import { useAICoach } from "@/lib/useAICoach";
import { ScenarioSimulator } from "@/components/ScenarioSimulator";
import { DayTradingSim } from "@/components/DayTradingSim";
import { PatternCard } from "@/components/PatternCard";
import { RiskMeter } from "@/components/RiskMeter";

// Same fixed palette as everywhere else in the app: status.good (green),
// seq.400 (blue), accent.violet (purple) — see tailwind.config.ts.
const SLIDES = [
  { key: "prediction", label: "Stock Prediction", desc: "Bull/Neutral/Bear odds from the ML model", color: "#0ca30c", emoji: "📈" },
  { key: "coach", label: "AI Coach", desc: "Pattern detection + risk score", color: "#3987e5", emoji: "🧑‍🏫" },
  { key: "daysim", label: "Day Sim", desc: "A simulated trading day, tick by tick", color: "#8b6bf2", emoji: "🕹️" },
] as const;

export function CoachShowcase({
  stock,
  fallbackScenarios,
  fallbackPattern,
}: {
  stock: Stock;
  fallbackScenarios: Scenario[];
  fallbackPattern: Pattern;
}) {
  const [active, setActive] = useState(0);
  const { data, loading } = useAICoach(stock.ticker, fallbackScenarios, fallbackPattern);

  return (
    <div>
      <div className="grid grid-cols-3 gap-3">
        {SLIDES.map((s, i) => {
          const isActive = active === i;
          return (
            <button
              key={s.key}
              onClick={() => setActive(i)}
              className="glass-panel p-3.5 text-left transition-colors hover:bg-white/[0.04]"
              style={isActive ? { borderColor: `${s.color}80`, backgroundColor: `${s.color}14` } : undefined}
            >
              <div className="text-lg">{s.emoji}</div>
              <div className="mt-1 text-xs font-semibold" style={{ color: isActive ? s.color : undefined }}>
                {s.label}
              </div>
              <p className="mt-0.5 text-[11px] leading-snug text-ink-muted">{s.desc}</p>
            </button>
          );
        })}
      </div>

      <div className="mt-4 overflow-hidden">
        <div
          className="flex w-[300%] transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${active * (100 / 3)}%)` }}
        >
          <div className="w-1/3 px-0.5">
            {loading ? (
              <SkeletonCard />
            ) : (
              <ScenarioSimulator ticker={stock.ticker} scenarios={data.scenarios} price={stock.price} volatility={stock.volatility} />
            )}
          </div>
          <div className="w-1/3 px-0.5">
            {loading ? (
              <SkeletonCard />
            ) : (
              <div className="space-y-4">
                <PatternCard pattern={data.pattern} ticker={stock.ticker} />
                <RiskMeter stock={stock} ai={data.risk} />
              </div>
            )}
          </div>
          <div className="w-1/3 px-0.5">
            {loading ? (
              <SkeletonCard />
            ) : (
              <DayTradingSim ticker={stock.ticker} price={stock.price} volatility={stock.volatility} scenarios={data.scenarios} />
            )}
          </div>
        </div>
      </div>

      <div className="mt-2 text-right">
        <Link href={`/stock/${stock.ticker}`} className="text-xs font-medium text-accent-cyan hover:underline">
          Full analysis on {stock.ticker} →
        </Link>
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="glass-panel flex h-40 animate-pulse items-center justify-center text-sm text-ink-muted">Loading…</div>
  );
}
