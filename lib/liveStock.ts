import "server-only";
import { getQuote, getProfile, getBasicFinancials, FinnhubError } from "./finnhub";
import { getHistory } from "./yahooHistory";
import { getCuratedEntry, CURATED_TICKERS } from "./curatedUniverse";
import { mapWithConcurrency } from "./concurrency";
import { Stock } from "./types";

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

/**
 * Risk/momentum/volatility/AI score are simple, transparent heuristics
 * computed from real recent price history + fundamentals — not a trained
 * model. They exist to teach the underlying concepts, not to predict returns.
 */
function computeScores(closes: number[], beta: number | undefined, marketCapB: number) {
  if (closes.length < 5) return { risk: 50, momentum: 50, volatility: 50, aiScore: 50 };

  const returns: number[] = [];
  for (let i = 1; i < closes.length; i++) returns.push((closes[i] - closes[i - 1]) / closes[i - 1]);
  const mean = returns.reduce((s, r) => s + r, 0) / returns.length;
  const variance = returns.reduce((s, r) => s + (r - mean) ** 2, 0) / returns.length;
  const stdevPct = Math.sqrt(variance) * 100; // daily stdev, in percent

  const volatility = clamp(Math.round(stdevPct * 20), 0, 100);

  const trendPct = (closes[closes.length - 1] - closes[0]) / closes[0];
  const momentum = clamp(Math.round(50 + trendPct * 250), 0, 100);

  const betaRisk = beta !== undefined && Number.isFinite(beta) ? clamp(50 + (beta - 1) * 40, 0, 100) : 50;
  const sizeRisk = marketCapB > 0 ? (marketCapB < 10 ? 85 : marketCapB < 50 ? 65 : marketCapB < 300 ? 45 : marketCapB < 1000 ? 30 : 15) : 50;
  const risk = clamp(Math.round(0.5 * volatility + 0.3 * betaRisk + 0.2 * sizeRisk), 0, 100);

  const aiScore = clamp(Math.round(0.4 * momentum + 0.3 * (100 - risk) + 0.3 * (100 - volatility)), 0, 100);

  return { risk, momentum, volatility, aiScore };
}

/**
 * `skipFinancials` drops the `getBasicFinancials` call (P/E, dividend yield,
 * beta) for callers that don't render those fields — search results and the
 * watchlist only ever show price/name/sector/history. That's a real third of
 * the Finnhub calls this function makes, and cutting it for the two highest-
 * volume, many-tickers-at-once callers meaningfully lowers how fast a
 * multi-candidate search or a big watchlist can trip the free-tier rate limit.
 * The full stock detail page (which does display P/E and dividend yield)
 * calls this with the default, so it always gets the real numbers.
 */
export async function getLiveStock(tickerRaw: string, opts: { skipFinancials?: boolean } = {}): Promise<Stock> {
  const ticker = tickerRaw.toUpperCase();
  const curated = getCuratedEntry(ticker);

  const [quote, profile, financials, history] = await Promise.all([
    getQuote(ticker),
    getProfile(ticker).catch(() => ({} as Awaited<ReturnType<typeof getProfile>>)),
    opts.skipFinancials
      ? Promise.resolve({} as Awaited<ReturnType<typeof getBasicFinancials>>)
      : getBasicFinancials(ticker).catch(() => ({} as Awaited<ReturnType<typeof getBasicFinancials>>)),
    getHistory(ticker, "1mo").catch(() => []),
  ]);

  if (!quote || quote.c === 0) {
    throw new FinnhubError(`No quote data available for ${ticker}`, 404);
  }

  const name = profile.name || ticker;
  const sector = curated?.sector || profile.finnhubIndustry || "Other";
  const marketCapB = profile.marketCapitalization ? profile.marketCapitalization / 1000 : 0;
  const price = quote.c;
  const prevClose = quote.pc || price;
  const changePct = prevClose ? ((price - prevClose) / prevClose) * 100 : 0;
  const closes = history.length ? history.map((h) => h.close) : [price];

  const scores = computeScores(closes, financials.metric?.beta, marketCapB);

  return {
    ticker,
    name,
    sector,
    price,
    prevClose,
    changePct,
    marketCapB,
    peRatio: financials.metric?.peBasicExclExtraTTM ?? null,
    dividendYieldPct: financials.metric?.dividendYieldIndicatedAnnual ?? 0,
    history: closes,
    ...scores,
    tags: curated?.tags ?? [],
    blurb: curated?.blurb ?? `${name} trades on the US markets in the ${sector} sector.`,
    asOf: quote.t ? quote.t * 1000 : Date.now(),
    curated: !!curated,
  };
}

let universeCache: { at: number; data: Stock[] } | null = null;
const UNIVERSE_CACHE_TTL_MS = 60 * 1000;

/**
 * The curated universe, assembled with live data and cached for a minute so
 * the natural-language screener stays instant and doesn't re-hit Finnhub on
 * every keystroke/click — concurrency is capped to stay under the free-tier
 * rate limit while warming a cold cache.
 */
export async function getLiveCuratedUniverse(): Promise<Stock[]> {
  if (universeCache && Date.now() - universeCache.at < UNIVERSE_CACHE_TTL_MS) return universeCache.data;

  const results = await mapWithConcurrency(CURATED_TICKERS, 5, async (ticker) => {
    try {
      return await getLiveStock(ticker);
    } catch {
      return null;
    }
  });
  const data = results.filter((s): s is Stock => s !== null);
  universeCache = { at: Date.now(), data };
  return data;
}
