import "server-only";
import { getHistory } from "./yahooHistory";
import { computeScores } from "./liveStock";
import { getCuratedCryptoEntry, CURATED_CRYPTO_TICKERS } from "./curatedCrypto";
import { mapWithConcurrency } from "./concurrency";
import { Stock } from "./types";

/**
 * Crypto has no Finnhub /quote or /stock/profile2 equivalent in this app's
 * data layer, so price and history both come straight from Yahoo's public
 * chart endpoint (lib/yahooHistory.ts), which already recognizes tickers
 * in the "BTC-USD" convention — the same function stocks use for their
 * chart, unchanged. "Price" and "change%" are simply the last two daily
 * closes; there's no separate real-time trade feed the way stocks have via
 * Finnhub's websocket, so this reads a bit less "live-tick" than a stock
 * quote, but it's real, current market data, not synthetic.
 */
export async function getLiveCrypto(symbolRaw: string): Promise<Stock> {
  const ticker = symbolRaw.toUpperCase();
  const curated = getCuratedCryptoEntry(ticker);

  const history = await getHistory(ticker, "1mo");
  if (history.length < 2) throw new Error(`No price data available for ${ticker}`);

  const closes = history.map((h) => h.close);
  const price = closes[closes.length - 1];
  const prevClose = closes[closes.length - 2];
  const changePct = prevClose ? ((price - prevClose) / prevClose) * 100 : 0;

  const scores = computeScores(closes, undefined, 0);
  const name = curated?.name ?? ticker.replace(/-USD$/, "");

  return {
    ticker,
    name,
    sector: curated?.category ?? "Cryptocurrency",
    price,
    prevClose,
    changePct,
    marketCapB: 0,
    peRatio: null,
    dividendYieldPct: 0,
    history: closes,
    ...scores,
    tags: curated?.tags ?? ["crypto"],
    blurb: curated?.blurb ?? `${name} cryptocurrency price and simulated analysis.`,
    asOf: Date.now(),
    curated: true,
  };
}

let cryptoCache: { at: number; data: Stock[] } | null = null;
const CRYPTO_CACHE_TTL_MS = 60 * 1000;

/** The curated crypto list, assembled with live prices and cached for a minute, mirroring getLiveCuratedUniverse/getLiveCuratedETFs. */
export async function getLiveCuratedCryptos(): Promise<Stock[]> {
  if (cryptoCache && Date.now() - cryptoCache.at < CRYPTO_CACHE_TTL_MS) return cryptoCache.data;

  const results = await mapWithConcurrency(CURATED_CRYPTO_TICKERS, 5, async (ticker) => {
    try {
      return await getLiveCrypto(ticker);
    } catch {
      return null;
    }
  });
  const data = results.filter((s): s is Stock => s !== null);
  cryptoCache = { at: Date.now(), data };
  return data;
}
