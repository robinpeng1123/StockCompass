import Link from "next/link";
import { getPattern, getScenarios } from "@/lib/mockData";
import { getLiveStock } from "@/lib/liveStock";
import { getLiveIndices } from "@/lib/liveIndices";
import { getSpotlightTicker } from "@/lib/spotlight";
import { StatTile } from "@/components/ui/StatTile";
import { NaturalLanguageSearch } from "@/components/NaturalLanguageSearch";
import { FeatureStrip } from "@/components/FeatureStrip";
import { PatternCard } from "@/components/PatternCard";
import { RiskMeter } from "@/components/RiskMeter";
import { ScenarioSimulator } from "@/components/ScenarioSimulator";
import { TrendingNews } from "@/components/TrendingNews";
import { PortfolioCopilot } from "@/components/PortfolioCopilot";
import { Card, CardHeader } from "@/components/ui/Card";
import { Greeting } from "@/components/Greeting";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const spotlightTicker = getSpotlightTicker();
  const [spotlight, indices] = await Promise.all([getLiveStock(spotlightTicker), getLiveIndices()]);
  const pattern = getPattern(spotlightTicker);
  const scenarios = getScenarios(spotlightTicker);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink-primary">
          <Greeting /> — here&apos;s your <span className="text-gradient">command center</span>
        </h1>
        <p className="mt-1 text-sm text-ink-secondary">
          Patterns explained, risk scored, scenarios simulated. No hype, just what the data actually says.
        </p>
      </div>

      <FeatureStrip />

      <div className="grid gap-4 sm:grid-cols-3">
        {indices.map((idx) => (
          <StatTile
            key={idx.symbol}
            label={idx.label}
            ticker={idx.symbol}
            value={idx.value}
            prevClose={idx.prevClose}
            deltaPct={idx.changePct}
            trend={idx.history}
          />
        ))}
      </div>

      <Card glow="cyan">
        <CardHeader eyebrow="Conversational Stock Search" title="Search the market in plain English" />
        <NaturalLanguageSearch compact />
      </Card>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-muted">Spotlight · {spotlight.ticker}</h2>
          <Link href={`/stock/${spotlight.ticker}`} className="text-xs font-medium text-accent-cyan hover:underline">
            View full deep-dive →
          </Link>
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <PatternCard pattern={pattern} ticker={spotlight.ticker} />
          <RiskMeter stock={spotlight} />
        </div>
      </div>

      <ScenarioSimulator ticker={spotlight.ticker} scenarios={scenarios} price={spotlight.price} volatility={spotlight.volatility} />

      <div className="grid gap-6 lg:grid-cols-2">
        <PortfolioCopilot />
        <TrendingNews />
      </div>
    </div>
  );
}
