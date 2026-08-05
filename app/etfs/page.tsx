import { getLiveCuratedETFs } from "@/lib/liveStock";
import { StockCard } from "@/components/StockCard";
import { Card } from "@/components/ui/Card";

export const dynamic = "force-dynamic";

export default async function ETFsPage() {
  const etfs = await getLiveCuratedETFs().catch(() => []);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink-primary">ETFs</h1>
        <p className="mt-1 text-sm text-ink-secondary">
          Exchange-traded funds — one ticker, a whole basket of holdings. Broad-market, sector, bond, and commodity
          funds with live prices, same as any stock here.
        </p>
      </div>

      {etfs.length === 0 ? (
        <Card>
          <p className="text-sm text-ink-secondary">Live market data is temporarily unavailable — try refreshing in a moment.</p>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {etfs.map((etf) => (
            <StockCard key={etf.ticker} stock={etf} />
          ))}
        </div>
      )}
    </div>
  );
}
