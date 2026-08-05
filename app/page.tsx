import Link from "next/link";
import { getLiveStock } from "@/lib/liveStock";
import { getLiveIndices } from "@/lib/liveIndices";
import { getSpotlightTicker } from "@/lib/spotlight";
import { formatMarketCap } from "@/lib/utils";
import { StatTile } from "@/components/ui/StatTile";
import { NaturalLanguageSearch } from "@/components/NaturalLanguageSearch";
import { FeatureStrip } from "@/components/FeatureStrip";
import { PriceChart } from "@/components/ui/PriceChart";
import { LiveStockHeaderPrice } from "@/components/ui/LiveStockHeaderPrice";
import { PortfolioCopilot } from "@/components/PortfolioCopilot";
import { Card, CardHeader } from "@/components/ui/Card";
import { Greeting } from "@/components/Greeting";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const spotlightTicker = getSpotlightTicker();
  const [spotlightResult, indicesResult] = await Promise.allSettled([getLiveStock(spotlightTicker), getLiveIndices()]);

  const spotlight = spotlightResult.status === "fulfilled" ? spotlightResult.value : null;
  const indices = indicesResult.status === "fulfilled" ? indicesResult.value : [];

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

      {indices.length > 0 ? (
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
      ) : (
        <Card>
          <p className="text-sm text-ink-secondary">Market indices are temporarily unavailable — try refreshing in a moment.</p>
        </Card>
      )}

      <Card glow="cyan">
        <CardHeader eyebrow="Conversational Stock Search" title="Search the market in plain English" />
        <NaturalLanguageSearch compact />
      </Card>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-muted">
            Spotlight{spotlight ? ` · ${spotlight.ticker}` : ""}
          </h2>
          {spotlight && (
            <Link href={`/stock/${spotlight.ticker}`} className="text-xs font-medium text-accent-cyan hover:underline">
              View full deep-dive →
            </Link>
          )}
        </div>
        {spotlight ? (
          <Card>
            <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-semibold text-ink-primary">{spotlight.ticker}</span>
                  <span className="text-sm text-ink-muted">{spotlight.name}</span>
                </div>
                <p className="mt-1 max-w-xl text-xs text-ink-secondary">{spotlight.blurb}</p>
              </div>
              <LiveStockHeaderPrice
                ticker={spotlight.ticker}
                price={spotlight.price}
                prevClose={spotlight.prevClose}
                changePct={spotlight.changePct}
              />
            </div>
            <PriceChart ticker={spotlight.ticker} />
            <div className="mt-4 grid grid-cols-2 gap-4 border-t border-white/[0.06] pt-4 sm:grid-cols-4">
              <Fact label="Sector" value={spotlight.sector} />
              <Fact label="Market cap" value={spotlight.marketCapB ? formatMarketCap(spotlight.marketCapB) : "N/A"} />
              <Fact label="P/E ratio" value={spotlight.peRatio ? spotlight.peRatio.toFixed(1) : "N/A"} />
              <Fact label="Dividend yield" value={`${spotlight.dividendYieldPct.toFixed(2)}%`} />
            </div>
          </Card>
        ) : (
          <Card>
            <p className="text-sm text-ink-secondary">
              Live market data didn&apos;t respond — search for a stock above, or refresh in a moment.
            </p>
          </Card>
        )}
      </div>

      <PortfolioCopilot />
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[11px] font-medium uppercase tracking-wide text-ink-muted">{label}</div>
      <div className="mt-0.5 text-sm font-semibold text-ink-primary">{value}</div>
    </div>
  );
}
