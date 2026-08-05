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

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  let prevRow = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const row = [i];
    for (let j = 1; j <= b.length; j++) {
      row[j] =
        a[i - 1] === b[j - 1]
          ? prevRow[j - 1]
          : 1 + Math.min(prevRow[j - 1], prevRow[j], row[j - 1]);
    }
    prevRow = row;
  }
  return prevRow[b.length];
}

/** 1 = identical, 0 = completely different. */
function similarity(a: string, b: string): number {
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  return 1 - levenshtein(a, b) / maxLen;
}

/**
 * Ranks a candidate against the query so the stock someone's actually
 * looking for — an exact ticker, or a company whose name starts with what
 * they typed — always outranks an unrelated ticker that merely starts with
 * the same letters, or a company that just mentions the query mid-name.
 *
 * Below all of that sits a fuzzy tier: even a typo'd or misremembered name
 * (transposed/missing/extra letters) still surfaces its closest real match
 * as the top result, rather than coming back empty or with the wrong stock
 * first, as long as it's a genuinely close resemblance to the ticker or one
 * word of the company name.
 */
function matchScore(s: FinnhubSymbol, q: string): number {
  const sym = s.symbol.toUpperCase();
  const desc = s.description.toUpperCase();

  if (sym === q) return 100;
  if (desc === q) return 95;
  if (sym.startsWith(q)) return 90 - Math.min(20, sym.length - q.length);
  if (desc.startsWith(q)) return 70;
  if (new RegExp(`\\b${escapeRegex(q)}`).test(desc)) return 60; // query starts a word within the name
  if (sym.includes(q)) return 40;
  if (desc.includes(q)) return 20;

  const symSim = q.length >= 2 ? similarity(sym, q) : 0;
  const wordSim = Math.max(0, ...desc.split(/\s+/).map((w) => (q.length >= 2 ? similarity(w, q) : 0)));
  const bestSim = Math.max(symSim, wordSim);
  if (bestSim >= 0.55) return Math.round(55 * bestSim);

  return 0;
}

export async function searchUSSymbols(query: string, limit = 20): Promise<FinnhubSymbol[]> {
  const all = await getAllUSSymbols();
  const q = query.trim().toUpperCase();
  if (!q) return [];

  const scored = all
    .map((s) => ({ s, score: matchScore(s, q) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || a.s.symbol.length - b.s.symbol.length || a.s.symbol.localeCompare(b.s.symbol));

  return scored.slice(0, limit).map((x) => x.s);
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

export type FinnhubNewsItem = {
  headline: string;
  source: string;
  url: string;
  datetime: number; // unix seconds
  summary: string;
  image?: string;
  related?: string; // comma-separated tickers the story is about, if any
};

function toDateStr(d: Date) {
  return d.toISOString().slice(0, 10);
}

export async function getCompanyNews(symbol: string, days = 21): Promise<FinnhubNewsItem[]> {
  const to = new Date();
  const from = new Date(to.getTime() - days * 86_400_000);
  const raw = await finnhubFetch<any[]>(
    "/company-news",
    { symbol: symbol.toUpperCase(), from: toDateStr(from), to: toDateStr(to) },
    300
  );
  return raw
    .filter((n) => n.headline && n.url)
    .sort((a, b) => b.datetime - a.datetime)
    .map((n) => ({ headline: n.headline, source: n.source ?? "Unknown source", url: n.url, datetime: n.datetime, summary: n.summary ?? "" }));
}

/**
 * Broad market-moving news (not tied to one ticker) — Finnhub's general news
 * feed, the free-tier equivalent of a market-wide "top stories" list.
 */
export async function getMarketNews(): Promise<FinnhubNewsItem[]> {
  const raw = await finnhubFetch<any[]>("/news", { category: "general" }, 300);
  return raw
    .filter((n) => n.headline && n.url)
    .sort((a, b) => b.datetime - a.datetime)
    .map((n) => ({
      headline: n.headline,
      source: n.source ?? "Unknown source",
      url: n.url,
      datetime: n.datetime,
      summary: n.summary ?? "",
      image: n.image || undefined,
      related: n.related || undefined,
    }));
}

export type FinnhubEarning = {
  period: string; // YYYY-MM-DD
  quarter: number;
  year: number;
  actual: number | null;
  estimate: number | null;
  surprisePercent: number | null;
};

export async function getEarnings(symbol: string): Promise<FinnhubEarning[]> {
  const raw = await finnhubFetch<{ earningsCalendar?: any[] }>("/stock/earnings", { symbol: symbol.toUpperCase() }, 3600).catch(
    () => ({ earningsCalendar: [] })
  );
  // Finnhub's /stock/earnings actually returns a bare array, not {earningsCalendar}; handle both shapes defensively.
  const list = Array.isArray(raw) ? raw : raw.earningsCalendar ?? [];
  return list
    .map((e: any) => ({
      period: e.period,
      quarter: e.quarter,
      year: e.year,
      actual: e.actual ?? null,
      estimate: e.estimate ?? null,
      surprisePercent: e.surprisePercent ?? null,
    }))
    .sort((a, b) => (a.period < b.period ? 1 : -1));
}
