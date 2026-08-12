"use client";

import { Scenario, Stock } from "@/lib/types";
import { ScenarioSimulator } from "@/components/ScenarioSimulator";
import { RiskMeter, AIRiskOverride } from "@/components/RiskMeter";
import { DayTradingSim } from "@/components/DayTradingSim";
import { TabCarousel } from "@/components/ui/TabCarousel";

/**
 * Crypto's coach experience is scoped to what's actually price-based: the
 * same trained ML model used for stocks (lib/ml/scenarioModel.ts) drives
 * both the Prediction Simulator and the Risk Meter here, run on this coin's
 * own closes, plus the Day Trading Sim. No Pattern Detection — that panel's
 * OpenAI prompt is built around company news/earnings/fundamentals, none of
 * which exist for a cryptocurrency in this app's data layer.
 */
export function CryptoCoachPanel({ crypto, scenarios, risk }: { crypto: Stock; scenarios: Scenario[]; risk: AIRiskOverride }) {
  return (
    <div className="space-y-4">
      <TabCarousel
        tabs={[
          {
            key: "prediction",
            label: "Prediction Simulator",
            desc: "Bull/Neutral/Bear odds from the ML model",
            color: "#0ca30c",
            emoji: "📈",
            content: <ScenarioSimulator ticker={crypto.ticker} scenarios={scenarios} price={crypto.price} volatility={crypto.volatility} />,
          },
          {
            key: "risk",
            label: "Risk Score",
            desc: "Momentum, risk and volatility, from the same ML model",
            color: "#3987e5",
            emoji: "🧭",
            content: <RiskMeter stock={crypto} ai={risk} />,
          },
          {
            key: "daysim",
            label: "Day Sim",
            desc: "A simulated trading day, tick by tick",
            color: "#8b6bf2",
            emoji: "🕹️",
            content: <DayTradingSim ticker={crypto.ticker} price={crypto.price} volatility={crypto.volatility} scenarios={scenarios} />,
          },
        ]}
      />

      <p className="text-[11px] text-ink-muted">
        The Prediction Simulator and Risk Score both run the exact same model trained for stocks (5 years of price
        action across 500+ S&amp;P stocks) — on {crypto.ticker}&apos;s own recent price history instead. There&apos;s
        no Pattern Detection for crypto yet since that relies on company news and earnings data that doesn&apos;t
        exist for a coin.
      </p>
    </div>
  );
}
