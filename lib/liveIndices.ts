import "server-only";
import { getQuote } from "./finnhub";
import { getHistory } from "./yahooHistory";

/**
 * Raw index tickers (^GSPC etc.) aren't reliably quotable on Finnhub's free
 * tier, so we track the three most liquid tracking ETFs instead — same
 * signal, and they trade as ordinary US common stocks the API fully supports.
 */
const INDEX_PROXIES = [
  { label: "S&P 500 (SPY)", symbol: "SPY" },
  { label: "Nasdaq 100 (QQQ)", symbol: "QQQ" },
  { label: "Dow Jones (DIA)", symbol: "DIA" },
] as const;

export type LiveIndex = {
  label: string;
  symbol: string;
  value: number;
  prevClose: number;
  changePct: number;
  history: number[];
};

export async function getLiveIndices(): Promise<LiveIndex[]> {
  const results = await Promise.all(
    INDEX_PROXIES.map(async ({ label, symbol }) => {
      const [quote, history] = await Promise.all([getQuote(symbol), getHistory(symbol, "1mo").catch(() => [])]);
      const prevClose = quote.pc || quote.c;
      return {
        label,
        symbol,
        value: quote.c,
        prevClose,
        changePct: prevClose ? ((quote.c - prevClose) / prevClose) * 100 : 0,
        history: history.length ? history.map((h) => h.close) : [quote.c],
      };
    })
  );
  return results;
}
