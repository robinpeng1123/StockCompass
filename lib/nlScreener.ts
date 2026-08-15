import { Stock } from "./types";

export type ScreenResult = {
  criteria: string[];
  results: Stock[];
};

/**
 * A small, deterministic rule-based stand-in for an LLM query→screen
 * translation. It reads like natural-language understanding to the user
 * ("cheap AI companies" -> a P/E + sector filter) without calling any model.
 * Operates over whatever live universe snapshot the caller passes in.
 */
export function runScreen(rawQuery: string, universe: Stock[]): ScreenResult {
  const q = rawQuery.trim().toLowerCase();
  const criteria: string[] = [];
  let pool = [...universe];

  if (!q) {
    return { criteria: ["Top AI-rated stocks"], results: pool.sort((a, b) => b.aiScore - a.aiScore).slice(0, 6) };
  }

  // "similar to X" — match by shared sector + overlapping tags
  const similarMatch = q.match(/similar to ([a-z0-9. ]+)/);
  if (similarMatch) {
    const needle = similarMatch[1].trim();
    const target = universe.find(
      (s) => s.name.toLowerCase().includes(needle) || s.ticker.toLowerCase() === needle || needle.includes(s.ticker.toLowerCase())
    );
    if (target) {
      criteria.push(`Similar profile to ${target.name} (${target.ticker})`);
      pool = pool
        .filter((s) => s.ticker !== target.ticker)
        .map((s) => ({
          stock: s,
          score:
            (s.sector === target.sector ? 2 : 0) +
            s.tags.filter((t) => target.tags.includes(t)).length,
        }))
        .filter((x) => x.score > 0)
        .sort((a, b) => b.score - a.score)
        .map((x) => x.stock);
      return { criteria, results: pool.slice(0, 6) };
    }
  }

  if (/\bcheap|affordable|value\b/.test(q)) {
    criteria.push("Value-priced (low P/E)");
    pool = pool.filter((s) => s.peRatio !== null && s.peRatio < 30);
  }

  if (/\bai\b|artificial intelligence/.test(q)) {
    criteria.push("AI-related business");
    pool = pool.filter((s) => s.tags.includes("ai"));
  }

  if (/new high|breaking out|making highs/.test(q)) {
    criteria.push("Near recent highs");
    pool = pool.filter((s) => s.tags.includes("new-high") || s.momentum >= 70);
  }

  if (/momentum|trending up|strong trend/.test(q)) {
    criteria.push("Strong momentum score");
    pool = pool.filter((s) => s.momentum >= 65);
  }

  if (/dividend|income|yield/.test(q)) {
    criteria.push("Pays a dividend");
    pool = pool.filter((s) => s.dividendYieldPct > 0);
    pool.sort((a, b) => b.dividendYieldPct - a.dividendYieldPct);
  }

  if (/\blow.?vol|stable|safe|defensive\b/.test(q)) {
    criteria.push("Low volatility");
    pool = pool.filter((s) => s.volatility <= 35);
  }

  if (/high risk|risky|speculative|aggressive/.test(q)) {
    criteria.push("Higher risk profile");
    pool = pool.filter((s) => s.risk >= 65);
  }

  if (/large.?cap|mega.?cap|blue.?chip/.test(q)) {
    criteria.push("Large-cap");
    pool = pool.filter((s) => s.marketCapB >= 200);
  }

  if (/small.?cap/.test(q)) {
    criteria.push("Small-cap");
    pool = pool.filter((s) => s.marketCapB < 50);
  }

  const under = q.match(/under \$?(\d+)/);
  if (under) {
    const n = Number(under[1]);
    criteria.push(`Priced under $${n}`);
    pool = pool.filter((s) => s.price < n);
  }

  const sectorKeywords: Record<string, string> = {
    semiconductor: "Semiconductors",
    chip: "Semiconductors",
    ev: "Automotive",
    "electric vehicle": "Automotive",
    auto: "Automotive",
    software: "Software",
    healthcare: "Healthcare",
    pharma: "Healthcare",
    energy: "Energy",
    oil: "Energy",
    "real estate": "Real Estate",
    reit: "Real Estate",
    staples: "Consumer Staples",
    consumer: "Consumer Technology",
    bank: "Financials",
    financ: "Financials",
    media: "Media & Entertainment",
    streaming: "Media & Entertainment",
    defense: "Industrials",
    industrial: "Industrials",
  };
  for (const [kw, sector] of Object.entries(sectorKeywords)) {
    if (q.includes(kw)) {
      criteria.push(`Sector: ${sector}`);
      pool = pool.filter((s) => s.sector === sector);
      break;
    }
  }

  if (criteria.length === 0) {
    criteria.push("No strong filters detected — showing top AI-rated matches");
    pool = [...universe];
  }

  pool = [...pool].sort((a, b) => b.aiScore - a.aiScore);
  return { criteria, results: pool.slice(0, 8) };
}
