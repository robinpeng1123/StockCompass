import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import { Scenario, Stock } from "./types";
import { getCompanyNews, getEarnings } from "./finnhub";
import { getScenarios as getHeuristicScenarios } from "./mockData";

const ScenarioSchema = z.object({
  label: z.enum(["Bullish", "Neutral", "Bearish"]),
  trigger: z
    .string()
    .describe(
      "One concise sentence: the specific condition that would produce this outcome, grounded in the news/earnings/fundamentals provided — not generic language."
    ),
  probabilityPct: z.number().describe("Whole-number percent chance of this scenario (0-100)."),
  rangeLowPct: z.number().describe("Low end of the expected one-month price change, as a percent (can be negative)."),
  rangeHighPct: z.number().describe("High end of the expected one-month price change, as a percent (can be negative)."),
});

const ScenariosResponseSchema = z.object({
  scenarios: z
    .array(ScenarioSchema)
    .length(3)
    .describe("Exactly one Bullish, one Neutral, and one Bearish scenario, in that order. Probabilities should sum to about 100."),
});

export type AIScenarioResult = { scenarios: Scenario[]; source: "ai" | "fallback" };

type CacheEntry = { promise: Promise<AIScenarioResult>; dateKey: string };
const cache = new Map<string, CacheEntry>();

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

// Generates scenario analysis grounded in a stock's live news/earnings/fundamentals
// via Claude, falling back to the static heuristic scenarios on any failure (missing
// key, refusal, parse error, rate limit). Cached once per ticker per day so repeated
// "Coach Me!" clicks don't re-spend tokens.
export async function getAIScenarios(stock: Stock): Promise<AIScenarioResult> {
  const dateKey = todayKey();
  const cacheKey = stock.ticker.toUpperCase();
  const existing = cache.get(cacheKey);
  if (existing && existing.dateKey === dateKey) return existing.promise;

  const promise = computeAIScenarios(stock).catch(
    (err): AIScenarioResult => {
      console.error(`[aiScenarios] falling back for ${stock.ticker}:`, err);
      return {
        scenarios: getHeuristicScenarios(stock.ticker),
        source: "fallback",
      };
    }
  );
  cache.set(cacheKey, { promise, dateKey });
  return promise;
}

async function computeAIScenarios(stock: Stock): Promise<AIScenarioResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set.");

  const [news, earnings] = await Promise.all([
    getCompanyNews(stock.ticker).catch(() => []),
    getEarnings(stock.ticker).catch(() => []),
  ]);

  const newsSummary =
    news
      .slice(0, 8)
      .map((n) => `- ${n.headline} (${n.source}, ${new Date(n.datetime * 1000).toDateString()})`)
      .join("\n") || "No recent news available.";

  const earningsSummary =
    earnings
      .slice(0, 4)
      .map((e) => `- ${e.period}: actual ${e.actual ?? "N/A"} vs estimate ${e.estimate ?? "N/A"}`)
      .join("\n") || "No recent earnings data available.";

  const prompt = `You are a financial-education assistant generating illustrative scenario analysis (not investment advice) for a stock prediction simulator.

Ticker: ${stock.ticker} (${stock.name})
Sector: ${stock.sector}
Current price: $${stock.price.toFixed(2)}
Change today: ${stock.changePct.toFixed(2)}%
P/E ratio: ${stock.peRatio ?? "N/A"}
Dividend yield: ${stock.dividendYieldPct.toFixed(2)}%
Market cap: $${stock.marketCapB.toFixed(1)}B
Momentum score (0-100, higher = stronger): ${stock.momentum}
Volatility score (0-100, higher = choppier): ${stock.volatility}
Risk score (0-100, higher = riskier): ${stock.risk}

Recent news:
${newsSummary}

Recent earnings:
${earningsSummary}

Based on this real, current data, produce three one-month-ahead price scenarios — Bullish, Neutral, and Bearish. Ground each trigger condition in the specific news/earnings/fundamentals above wherever possible. Probabilities should sum to about 100. Ranges are percent price changes from today's price over the next month.`;

  const client = new Anthropic({ apiKey });

  const response = await client.messages.parse({
    model: "claude-opus-5",
    max_tokens: 1024,
    output_config: {
      effort: "medium",
      format: zodOutputFormat(ScenariosResponseSchema),
    },
    messages: [{ role: "user", content: prompt }],
  });

  if (response.stop_reason === "refusal" || !response.parsed_output) {
    throw new Error("AI scenario generation was refused or returned no parsed output.");
  }

  const scenarios: Scenario[] = response.parsed_output.scenarios.map((s) => ({
    label: s.label,
    trigger: s.trigger,
    probabilityPct: Math.round(Math.min(100, Math.max(0, s.probabilityPct))),
    rangeLowPct: s.rangeLowPct,
    rangeHighPct: s.rangeHighPct,
  }));

  return { scenarios, source: "ai" };
}
