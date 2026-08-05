import { notFound } from "next/navigation";
import Link from "next/link";
import { getLiveCrypto } from "@/lib/liveCrypto";
import { predictScenarios } from "@/lib/ml/scenarioModel";
import { PriceChart } from "@/components/ui/PriceChart";
import { LiveStockHeaderPrice } from "@/components/ui/LiveStockHeaderPrice";
import { CryptoCoachPanel } from "@/components/CryptoCoachPanel";
import { CoachSection } from "@/components/CoachSection";
import { Card } from "@/components/ui/Card";

export const dynamic = "force-dynamic";

export default async function CryptoDetailPage({ params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await params;

  let crypto;
  try {
    crypto = await getLiveCrypto(symbol);
  } catch {
    notFound();
  }

  // Pure price-action model, no network call — the same ML model trained
  // for stocks (lib/ml/scenarioModel.ts), run on this coin's own closes.
  const scenarios = predictScenarios(crypto.history);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <CoachSection>
        <CryptoCoachPanel crypto={crypto} scenarios={scenarios} />
      </CoachSection>

      <Link href="/crypto" className="inline-block text-xs text-ink-muted hover:text-ink-primary">
        ← Back to crypto
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight text-ink-primary">{crypto.ticker}</h1>
            <span className="text-sm text-ink-muted">{crypto.name}</span>
          </div>
          <p className="mt-1 max-w-xl text-sm text-ink-secondary">{crypto.blurb}</p>
        </div>
        <LiveStockHeaderPrice ticker={crypto.ticker} price={crypto.price} prevClose={crypto.prevClose} changePct={crypto.changePct} />
      </div>

      <Card>
        <PriceChart ticker={crypto.ticker} />
        <div className="mt-4 border-t border-white/[0.06] pt-4">
          <div className="text-[11px] font-medium uppercase tracking-wide text-ink-muted">Category</div>
          <div className="mt-0.5 text-sm font-semibold text-ink-primary">{crypto.sector}</div>
        </div>
      </Card>
    </div>
  );
}
