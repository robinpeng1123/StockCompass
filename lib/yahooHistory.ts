import "server-only";
import { ChartRangeKey } from "./chartRanges";

export type HistoryPoint = { t: number; close: number };

// Yahoo rejects some interval/range combinations (e.g. minute bars over "max"),
// so each range gets the finest interval Yahoo actually allows for it.
const YAHOO_INTERVAL: Record<ChartRangeKey, string> = {
  "1d": "5m",
  "5d": "15m",
  "1mo": "1d",
  "1y": "1wk",
  max: "1mo",
};

/**
 * Yahoo Finance's public (unauthenticated, no-key) chart endpoint. Used only
 * for historical candles — Finnhub's free tier doesn't include those.
 */
export async function getHistory(symbol: string, rangeKey: ChartRangeKey = "1mo"): Promise<HistoryPoint[]> {
  const interval = YAHOO_INTERVAL[rangeKey];
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
    symbol.toUpperCase()
  )}?range=${rangeKey}&interval=${interval}`;

  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; StockCompassBot/1.0)" },
    // Intraday ranges move fast; longer ranges barely change within a day.
    next: { revalidate: rangeKey === "1d" || rangeKey === "5d" ? 60 : 900 },
  });
  if (!res.ok) throw new Error(`Yahoo Finance history request failed (${res.status})`);

  const json = await res.json();
  const result = json?.chart?.result?.[0];
  if (!result) return [];

  const timestamps: number[] = result.timestamp ?? [];
  const closes: (number | null)[] = result.indicators?.quote?.[0]?.close ?? [];

  const points: HistoryPoint[] = [];
  for (let i = 0; i < timestamps.length; i++) {
    const c = closes[i];
    if (typeof c === "number") points.push({ t: timestamps[i], close: Math.round(c * 100) / 100 });
  }
  return points;
}
