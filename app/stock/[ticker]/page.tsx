import { notFound } from "next/navigation";
import Link from "next/link";
import { getPattern, getScenarios, getStock, getStory, STOCKS } from "@/lib/mockData";
import { formatMarketCap, formatPrice, signed } from "@/lib/utils";
import { PriceChart } from "@/components/ui/PriceChart";
import { PatternCard } from "@/components/PatternCard";
import { RiskMeter } from "@/components/RiskMeter";
import { ScenarioSimulator } from "@/components/ScenarioSimulator";
import { MarketStory } from "@/components/MarketStory";
import { Card } from "@/components/ui/Card";

export function generateStaticParams() {
  return STOCKS.map((s) => ({ ticker: s.ticker }));
}

export default async function StockDetailPage({ params }: { params: Promise<{ ticker: string }> }) {
  const { ticker } = await params;
  const stock = getStock(ticker);
  if (!stock) notFound();

  const up = stock.changePct >= 0;
  const pattern = getPattern(stock.ticker);
  const scenarios = getScenarios(stock.ticker);
  const story = getStory(stock.ticker);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <Link href="/screener" className="text-xs text-ink-muted hover:text-ink-primary">
        ← Back to search
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight text-ink-primary">{stock.ticker}</h1>
            <span className="text-sm text-ink-muted">{stock.name}</span>
          </div>
          <p className="mt-1 max-w-xl text-sm text-ink-secondary">{stock.blurb}</p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-semibold tabular-nums text-ink-primary">{formatPrice(stock.price)}</div>
          <div className={`text-sm font-medium ${up ? "text-status-good" : "text-status-critical"}`}>
            {signed(stock.changePct)}% today
          </div>
        </div>
      </div>

      <Card>
        <PriceChart data={stock.history} color={up ? "#0ca30c" : "#d03b3b"} />
        <div className="mt-4 grid grid-cols-2 gap-4 border-t border-white/[0.06] pt-4 sm:grid-cols-4">
          <Fact label="Sector" value={stock.sector} />
          <Fact label="Market cap" value={formatMarketCap(stock.marketCapB)} />
          <Fact label="P/E ratio" value={stock.peRatio ? stock.peRatio.toFixed(1) : "N/A"} />
          <Fact label="Dividend yield" value={`${stock.dividendYieldPct.toFixed(2)}%`} />
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <PatternCard pattern={pattern} ticker={stock.ticker} />
        <RiskMeter stock={stock} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <ScenarioSimulator ticker={stock.ticker} scenarios={scenarios} />
        <MarketStory ticker={stock.ticker} events={story} />
      </div>
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
