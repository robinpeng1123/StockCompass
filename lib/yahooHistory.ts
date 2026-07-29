import "server-only";

export type HistoryPoint = { t: number; close: number };

/**
 * Yahoo Finance's public (unauthenticated, no-key) chart endpoint. Used only
 * for historical daily closes — Finnhub's free tier doesn't include candles.
 */
export async function getHistory(symbol: string, range: "1mo" | "3mo" | "1y" = "1mo"): Promise<HistoryPoint[]> {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
    symbol.toUpperCase()
  )}?range=${range}&interval=1d`;

  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; StockCompassBot/1.0)" },
    next: { revalidate: 300 },
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
