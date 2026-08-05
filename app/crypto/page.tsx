import { getLiveCuratedCryptos } from "@/lib/liveCrypto";
import { CryptoSearch } from "@/components/CryptoSearch";
import { Card } from "@/components/ui/Card";

export const dynamic = "force-dynamic";

export default async function CryptoPage() {
  const cryptos = await getLiveCuratedCryptos().catch(() => []);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink-primary">Crypto</h1>
        <p className="mt-1 text-sm text-ink-secondary">
          Major cryptocurrencies with live prices — same Prediction Simulator model used for stocks, run on each
          coin&apos;s own price history.
        </p>
      </div>

      {cryptos.length === 0 ? (
        <Card>
          <p className="text-sm text-ink-secondary">Live market data is temporarily unavailable — try refreshing in a moment.</p>
        </Card>
      ) : (
        <CryptoSearch cryptos={cryptos} />
      )}
    </div>
  );
}
