import "server-only";

const BASE = "https://finnhub.io/api/v1";

export class FinnhubError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = "FinnhubError";
  }
}

function apiKey() {
  const key = process.env.FINNHUB_API_KEY;
  if (!key) throw new FinnhubError("FINNHUB_API_KEY is not set", 500);
  return key;
}

async function finnhubFetch<T>(path: string, params: Record<string, string> = {}, revalidate = 60): Promise<T> {
  const url = new URL(BASE + path);
  url.searchParams.set("token", apiKey());
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

  const res = await fetch(url.toString(), { next: { revalidate } });
  if (res.status === 429) throw new FinnhubError("Finnhub rate limit exceeded — try again shortly.", 429);
  if (!res.ok) throw new FinnhubError(`Finnhub request failed (${res.status})`, res.status);
  return res.json() as Promise<T>;
}

export type FinnhubSymbol = {
  symbol: string;
  description: string;
  type: string;
  currency: string;
};

let symbolCache: { at: number; data: FinnhubSymbol[] } | null = null;
const SYMBOL_CACHE_TTL_MS = 24 * 60 * 60 * 1000; // the US ticker directory barely changes day to day

export async function getAllUSSymbols(): Promise<FinnhubSymbol[]> {
  if (symbolCache && Date.now() - symbolCache.at < SYMBOL_CACHE_TTL_MS) return symbolCache.data;
  const raw = await finnhubFetch<any[]>("/stock/symbol", { exchange: "US" }, 60 * 60 * 24);
  const data: FinnhubSymbol[] = raw
    .filter((r) => r.type === "Common Stock" && r.symbol && !r.symbol.includes("."))
    .map((r) => ({ symbol: r.symbol, description: r.description, type: r.type, currency: r.currency }));
  symbolCache = { at: Date.now(), data };
  return data;
}

export async function searchUSSymbols(query: string, limit = 20): Promise<FinnhubSymbol[]> {
  const all = await getAllUSSymbols();
  const q = query.trim().toUpperCase();
  if (!q) return [];
  const starts: FinnhubSymbol[] = [];
  const contains: FinnhubSymbol[] = [];
  for (const s of all) {
    if (s.symbol.toUpperCase().startsWith(q)) starts.push(s);
    else if (s.symbol.toUpperCase().includes(q) || s.description.toUpperCase().includes(q)) contains.push(s);
    if (starts.length >= limit) break;
  }
  return [...starts, ...contains].slice(0, limit);
}

export type FinnhubQuote = {
  c: number; // current price
  d: number | null; // change
  dp: number | null; // percent change
  h: number; // high
  l: number; // low
  o: number; // open
  pc: number; // previous close
  t: number; // timestamp (unix seconds)
};

export async function getQuote(symbol: string): Promise<FinnhubQuote> {
  return finnhubFetch<FinnhubQuote>("/quote", { symbol: symbol.toUpperCase() }, 10);
}

export type FinnhubProfile = {
  name?: string;
  ticker?: string;
  finnhubIndustry?: string;
  marketCapitalization?: number; // in millions USD
  weburl?: string;
};

export async function getProfile(symbol: string): Promise<FinnhubProfile> {
  return finnhubFetch<FinnhubProfile>("/stock/profile2", { symbol: symbol.toUpperCase() }, 60 * 60);
}

export type FinnhubMetrics = {
  metric?: {
    peBasicExclExtraTTM?: number;
    dividendYieldIndicatedAnnual?: number;
    beta?: number;
    "10DayAverageTradingVolume"?: number;
    "52WeekHigh"?: number;
    "52WeekLow"?: number;
  };
};

export async function getBasicFinancials(symbol: string): Promise<FinnhubMetrics> {
  return finnhubFetch<FinnhubMetrics>("/stock/metric", { symbol: symbol.toUpperCase(), metric: "all" }, 60 * 60);
}
