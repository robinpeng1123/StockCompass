"use client";

import { Scenario, Stock } from "@/lib/types";
import { ScenarioSimulator } from "@/components/ScenarioSimulator";
import { DayTradingSim } from "@/components/DayTradingSim";
import { TabCarousel } from "@/components/ui/TabCarousel";

/**
 * Both tabs run entirely on the trained ML model (lib/ml/scenarioModel.ts)
 * against this stock's own price history — computed server-side, no client
 * fetch or AI call involved, so there's nothing here that can rate-limit,
 * time out, or need a loading state.
 */
export function AICoachPanel({ stock, scenarios }: { stock: Stock; scenarios: Scenario[] }) {
  return (
    <div className="space-y-4">
      <TabCarousel
        // Same fixed palette as everywhere else in the app: status.good
        // (green), accent.violet (purple) — see tailwind.config.ts.
        tabs={[
          {
            key: "prediction",
            label: "Stock Prediction",
            desc: "Bull/Neutral/Bear odds from the ML model",
            color: "#0ca30c",
            emoji: "📈",
            content: <ScenarioSimulator ticker={stock.ticker} scenarios={scenarios} price={stock.price} volatility={stock.volatility} />,
          },
          {
            key: "daysim",
            label: "Day Sim",
            desc: "A simulated trading day, tick by tick",
            color: "#8b6bf2",
            emoji: "🕹️",
            content: <DayTradingSim ticker={stock.ticker} price={stock.price} volatility={stock.volatility} scenarios={scenarios} />,
          },
        ]}
      />

      <p className="text-[11px] text-ink-muted">
        Both come from the same trained ML model (see note above) — deterministic and local, no AI call involved.
      </p>
    </div>
  );
}
