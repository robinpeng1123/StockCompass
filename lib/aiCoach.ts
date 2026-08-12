import "server-only";
import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { z } from "zod";
import { Pattern, Scenario, Stock } from "./types";
import { getCompanyNews, getEarnings } from "./finnhub";
import { getPattern as getHeuristicPattern } from "./mockData";
import { predictScenarios, computeMLRiskScores } from "./ml/scenarioModel";

const PatternSchema = z.object({
  name: z.string().describe("Short name for the chart/technical setup, e.g. 'Bull Flag', 'Ascending Triangle', 'Range-bound Consolidation'."),
  direction: z.enum(["bullish", "bearish", "neutral"]),
  confidencePct: z.number().describe("Whole-number confidence (0-100) in this read of the setup."),
  explanation: z.string().describe("2-3 sentences on why this pattern matters, grounded in the actual price action and data given — not generic."),
  historicalStat: z.string().describe("One sentence citing a plausible historical base rate for how this kind of setup has resolved."),
});

const PatternOnlySchema = z.object({
  pattern: PatternSchema,
});

export type AICoachResult = {
  scenarios: Scenario[];
  pattern: Pattern;
  risk: {
    risk: number;
    momentum: number;
    volatility: number;
    overallScore: number;
    riskExplain: string;
    momentumExplain: string;
    volatilityExplain: string;
    overallExplain: string;
  };
  source: "ai" | "fallback";
};

type CacheEntry = { promise: Promise<AICoachResult>; dateKey: string };
const cache = new Map<string, CacheEntry>();

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function todayLabel() {
  return new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// Scenario predictions AND the Risk Meter both come from the trained ML
// model (lib/ml/scenarioModel.ts) — deterministic, local, and independent
// of the OpenAI call below, so a rate limit or outage on either data source
// can't take the other one down with it. Only Pattern Detection still comes
// from OpenAI grounded in the stock's live news/earnings/fundamentals,
// falling back to a static heuristic on any failure (missing key, refusal,
// parse error, rate limit, timeout). Cached once per ticker per day so
// repeated "Coach Me!" clicks don't re-spend tokens or re-run anything
// unnecessarily.
export async function getAICoachAnalysis(stock: Stock): Promise<AICoachResult> {
  const dateKey = todayKey();
  const cacheKey = stock.ticker.toUpperCase();
  const existing = cache.get(cacheKey);
  if (existing && existing.dateKey === dateKey) return existing.promise;

  const promise = computeAICoach(stock);
  cache.set(cacheKey, { promise, dateKey });
  return promise;
}

async function computeAICoach(stock: Stock): Promise<AICoachResult> {
  const scenarios = predictScenarios(stock.history);
  const risk = computeMLRiskScores(stock.history, stock.ticker);

  try {
    const pattern = await callOpenAIForPattern(stock);
    return { scenarios, pattern, risk, source: "ai" };
  } catch (err) {
    console.error(`[aiCoach] pattern falling back for ${stock.ticker}:`, err);
    return { scenarios, pattern: getHeuristicPattern(stock.ticker), risk, source: "fallback" };
  }
}

async function callOpenAIForPattern(stock: Stock): Promise<Pattern> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not set.");

  const [news, earnings] = await Promise.all([
    getCompanyNews(stock.ticker).catch(() => []),
    getEarnings(stock.ticker).catch(() => []),
  ]);

  const newsSummary =
    news
      .slice(0, 6)
      .map((n) => `- ${n.headline} (${n.source}, ${new Date(n.datetime * 1000).toDateString()})`)
      .join("\n") || "No recent news available.";

  const earningsSummary =
    earnings
      .slice(0, 3)
      .map((e) => `- ${e.period}: actual ${e.actual ?? "N/A"} vs estimate ${e.estimate ?? "N/A"}`)
      .join("\n") || "No recent earnings data available.";

  const prompt = `You are a financial-education assistant generating illustrative, transparent AI analysis (not investment advice) for a stock coaching app. You produce pattern detection from the data below.

Ticker: ${stock.ticker} (${stock.name})
Sector: ${stock.sector}
Current price: $${stock.price.toFixed(2)}
Change today: ${stock.changePct.toFixed(2)}%
P/E ratio: ${stock.peRatio ?? "N/A"}
Dividend yield: ${stock.dividendYieldPct.toFixed(2)}%
Market cap: $${stock.marketCapB.toFixed(1)}B
Recent daily closes (oldest to newest): ${stock.history.slice(-15).map((h) => h.toFixed(2)).join(", ")}

Recent news:
${newsSummary}

Recent earnings:
${earningsSummary}

Identify the chart/technical setup the recent closes suggest (e.g. a flag, triangle, channel, range-bound consolidation), its direction, a confidence percentage, why it matters, and a plausible historical base rate for that kind of setup — grounded in the specific data above wherever possible, avoid generic language.

Answer directly with the structured result — no exploratory reasoning needed, this is a quick synthesis of the data already given to you.`;

  const client = new OpenAI({ apiKey, timeout: 25_000, maxRetries: 1 });

  // Reasoning is on by default for GPT-5.6, but this is a bounded synthesis
  // of data already handed to the model, not a task that needs deep
  // reasoning — effort "none" keeps latency well inside the client timeout
  // above and the API route's function duration limit.
  const completion = await client.chat.completions.parse({
    model: "gpt-5.6-luna",
    reasoning_effort: "none",
    max_completion_tokens: 700,
    response_format: zodResponseFormat(PatternOnlySchema, "pattern_analysis"),
    messages: [{ role: "user", content: prompt }],
  });

  const message = completion.choices[0]?.message;
  if (!message || message.refusal || !message.parsed) {
    throw new Error("AI coach analysis was refused or returned no parsed output.");
  }

  const { pattern } = message.parsed;

  return {
    name: pattern.name,
    confidencePct: Math.round(Math.min(100, Math.max(0, pattern.confidencePct))),
    detectedOn: todayLabel(),
    direction: pattern.direction,
    explanation: pattern.explanation,
    historicalStat: pattern.historicalStat,
  };
}
