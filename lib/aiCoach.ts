import "server-only";
import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import { z } from "zod";
import { Pattern, Scenario, Stock } from "./types";
import { getCompanyNews, getEarnings } from "./finnhub";
import { getPattern as getHeuristicPattern } from "./mockData";
import { predictScenarios } from "./ml/scenarioModel";

const PatternSchema = z.object({
  name: z.string().describe("Short name for the chart/technical setup, e.g. 'Bull Flag', 'Ascending Triangle', 'Range-bound Consolidation'."),
  direction: z.enum(["bullish", "bearish", "neutral"]),
  confidencePct: z.number().describe("Whole-number confidence (0-100) in this read of the setup."),
  explanation: z.string().describe("2-3 sentences on why this pattern matters, grounded in the actual price action and data given — not generic."),
  historicalStat: z.string().describe("One sentence citing a plausible historical base rate for how this kind of setup has resolved."),
});

const RiskSchema = z.object({
  riskScore: z.number().describe("0-100, higher = riskier (valuation, sector, drawdown potential)."),
  momentumScore: z.number().describe("0-100, higher = stronger recent trend."),
  volatilityScore: z.number().describe("0-100, higher = choppier day-to-day moves."),
  overallScore: z.number().describe("0-100 composite AI score blending the above with fundamentals."),
  riskExplain: z.string().describe("1-2 sentences grounding the risk score in this stock's specific fundamentals/sector."),
  momentumExplain: z.string().describe("1-2 sentences grounding the momentum score in the recent price action given."),
  volatilityExplain: z.string().describe("1-2 sentences grounding the volatility score in the data given."),
  overallExplain: z.string().describe("1-2 sentences summarizing why the composite score is what it is."),
});

const PatternRiskSchema = z.object({
  pattern: PatternSchema,
  risk: RiskSchema,
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

function fallbackPatternAndRisk(ticker: string, stock: Stock): Pick<AICoachResult, "pattern" | "risk"> {
  return {
    pattern: getHeuristicPattern(ticker),
    risk: {
      risk: stock.risk,
      momentum: stock.momentum,
      volatility: stock.volatility,
      overallScore: stock.aiScore,
      riskExplain: "",
      momentumExplain: "",
      volatilityExplain: "",
      overallExplain: "",
    },
  };
}

// Scenario predictions come from the trained ML model (lib/ml/scenarioModel.ts)
// — deterministic, local, and independent of the OpenAI call below, so a rate
// limit or outage on either data source can't take the other one down with it.
// Pattern Detection and the Risk Meter still come from one OpenAI call
// grounded in the stock's live news/earnings/fundamentals, falling back to
// static heuristics on any failure (missing key, refusal, parse error, rate
// limit, timeout). Cached once per ticker per day so repeated "Coach Me!"
// clicks don't re-spend tokens or re-run the model unnecessarily.
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

  try {
    const { pattern, risk } = await callOpenAIForPatternAndRisk(stock);
    return { scenarios, pattern, risk, source: "ai" };
  } catch (err) {
    console.error(`[aiCoach] pattern/risk falling back for ${stock.ticker}:`, err);
    return { scenarios, ...fallbackPatternAndRisk(stock.ticker, stock), source: "fallback" };
  }
}

async function callOpenAIForPatternAndRisk(stock: Stock): Promise<Pick<AICoachResult, "pattern" | "risk">> {
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

  const prompt = `You are a financial-education assistant generating illustrative, transparent AI analysis (not investment advice) for a stock coaching app. You produce two things from the same data: pattern detection, and a risk/momentum/volatility read.

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

Produce both of the following, grounded in the specific data above wherever possible — avoid generic language:

1. Pattern: identify the chart/technical setup the recent closes suggest (e.g. a flag, triangle, channel, range-bound consolidation), its direction, a confidence percentage, why it matters, and a plausible historical base rate for that kind of setup.

2. Risk: score risk, momentum, and volatility each 0-100 (higher = more of that quality), plus a 0-100 overall composite score, each with a short grounded explanation.

Answer directly with the structured result — no exploratory reasoning needed, this is a quick synthesis of the data already given to you.`;

  const client = new OpenAI({ apiKey, timeout: 25_000, maxRetries: 1 });

  // Reasoning is on by default for GPT-5.6, but this is a bounded synthesis
  // of data already handed to the model, not a task that needs deep
  // reasoning — effort "none" keeps latency well inside the client timeout
  // above and the API route's function duration limit.
  const completion = await client.chat.completions.parse({
    model: "gpt-5.6-luna",
    reasoning_effort: "none",
    max_completion_tokens: 1000,
    response_format: zodResponseFormat(PatternRiskSchema, "pattern_risk_analysis"),
    messages: [{ role: "user", content: prompt }],
  });

  const message = completion.choices[0]?.message;
  if (!message || message.refusal || !message.parsed) {
    throw new Error("AI coach analysis was refused or returned no parsed output.");
  }

  const { pattern, risk } = message.parsed;

  return {
    pattern: {
      name: pattern.name,
      confidencePct: Math.round(Math.min(100, Math.max(0, pattern.confidencePct))),
      detectedOn: todayLabel(),
      direction: pattern.direction,
      explanation: pattern.explanation,
      historicalStat: pattern.historicalStat,
    },
    risk: {
      risk: Math.round(Math.min(100, Math.max(0, risk.riskScore))),
      momentum: Math.round(Math.min(100, Math.max(0, risk.momentumScore))),
      volatility: Math.round(Math.min(100, Math.max(0, risk.volatilityScore))),
      overallScore: Math.round(Math.min(100, Math.max(0, risk.overallScore))),
      riskExplain: risk.riskExplain,
      momentumExplain: risk.momentumExplain,
      volatilityExplain: risk.volatilityExplain,
      overallExplain: risk.overallExplain,
    },
  };
}
