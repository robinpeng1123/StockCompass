import { notFound } from "next/navigation";
import Link from "next/link";
import { getLiveStock } from "@/lib/liveStock";
import { predictScenarios, getDailyVolatilityPct } from "@/lib/ml/scenarioModel";
import { getCompanyNews, getEarnings, FinnhubError } from "@/lib/finnhub";
import { formatMarketCap } from "@/lib/utils";
import { PriceChart } from "@/components/ui/PriceChart";
import { LiveStockHeaderPrice } from "@/components/ui/LiveStockHeaderPrice";
import { AICoachPanel } from "@/components/AICoachPanel";
import { StockNews } from "@/components/StockNews";
import { StockEarnings } from "@/components/StockEarnings";
import { CoachSection } from "@/components/CoachSection";
import { AddToPortfolioButton } from "@/components/AddToPortfolioButton";
import { Card } from "@/components/ui/Card";

export const dynamic = "force-dynamic";

export default async function StockDetailPage({ params }: { params: Promise<{ ticker: string }> }) {
  const { ticker } = await params;

  let stock;
  try {
    stock = await getLiveStock(ticker);
  } catch (err) {
    if (err instanceof FinnhubError && (err.status === 404 || err.status === 400)) notFound();
    throw err;
  }

  const [news, earnings] = await Promise.all([
    getCompanyNews(stock.ticker).catch(() => []),
    getEarnings(stock.ticker).catch(() => []),
  ]);

  // Pure price-action model, no network call — same as crypto's coach panel.
  const scenarios = predictScenarios(stock.history);
  const dailyVolPct = getDailyVolatilityPct(stock.history);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <CoachSection>
        <AICoachPanel stock={stock} scenarios={scenarios} dailyVolPct={dailyVolPct} />
      </CoachSection>

      <Link href="/screener" className="inline-block text-xs text-ink-muted hover:text-ink-primary">
        ← Back to search
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight text-ink-primary">{stock.ticker}</h1>
            <span className="text-sm text-ink-muted">{stock.name}</span>
            {!stock.curated && (
              <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] font-medium text-ink-muted">
                Full-market listing
              </span>
            )}
          </div>
          <p className="mt-1 max-w-xl text-sm text-ink-secondary">{stock.blurb}</p>
          <div className="mt-3">
            <AddToPortfolioButton ticker={stock.ticker} price={stock.price} />
          </div>
        </div>
        <LiveStockHeaderPrice ticker={stock.ticker} price={stock.price} prevClose={stock.prevClose} changePct={stock.changePct} />
      </div>

      <Card>
        <PriceChart ticker={stock.ticker} />
        <div className="mt-4 grid grid-cols-2 gap-4 border-t border-white/[0.06] pt-4 sm:grid-cols-4">
          <Fact label="Sector" value={stock.sector} />
          <Fact label="Market cap" value={stock.marketCapB ? formatMarketCap(stock.marketCapB) : "N/A"} />
          <Fact label="P/E ratio" value={stock.peRatio ? stock.peRatio.toFixed(1) : "N/A"} />
          <Fact label="Dividend yield" value={`${stock.dividendYieldPct.toFixed(2)}%`} />
        </div>
      </Card>

      <div id="news" className="grid scroll-mt-24 gap-6 lg:grid-cols-2">
        <StockNews ticker={stock.ticker} news={news} />
        <StockEarnings ticker={stock.ticker} earnings={earnings} />
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
