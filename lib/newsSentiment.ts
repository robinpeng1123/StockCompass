/**
 * A transparent, keyword-based sentiment reader for news text a user pastes
 * in themselves — not a trained NLP model. Every phrase it matches and the
 * weight it contributes is exposed on the result, so "why did this score
 * +0.4" always has a plain-English answer instead of being a black box.
 */

export type SentimentMatch = { phrase: string; weight: number };
export type SentimentResult = { score: number; matches: SentimentMatch[] };

const POSITIVE_PHRASES: Array<[string, number]> = [
  ["beats earnings", 0.8],
  ["beat earnings", 0.8],
  ["beats estimates", 0.75],
  ["beat estimates", 0.75],
  ["tops estimates", 0.75],
  ["raises guidance", 0.85],
  ["raised guidance", 0.85],
  ["upgraded", 0.6],
  ["upgrade", 0.5],
  ["record revenue", 0.7],
  ["record profit", 0.7],
  ["record earnings", 0.7],
  ["strong demand", 0.5],
  ["surpasses expectations", 0.75],
  ["exceeds expectations", 0.7],
  ["partnership", 0.3],
  ["new contract", 0.35],
  ["share buyback", 0.4],
  ["stock buyback", 0.4],
  ["dividend increase", 0.5],
  ["raises dividend", 0.5],
  ["strong growth", 0.6],
  ["revenue growth", 0.4],
  ["all-time high", 0.5],
  ["bullish", 0.4],
  ["outperform", 0.5],
  ["price target raised", 0.6],
  ["expands into", 0.3],
  ["approval", 0.35],
  ["approved", 0.3],
];

const NEGATIVE_PHRASES: Array<[string, number]> = [
  ["misses earnings", -0.8],
  ["missed earnings", -0.8],
  ["misses estimates", -0.75],
  ["missed estimates", -0.75],
  ["falls short", -0.6],
  ["cuts guidance", -0.85],
  ["cut guidance", -0.85],
  ["lowered guidance", -0.85],
  ["downgraded", -0.6],
  ["downgrade", -0.5],
  ["lawsuit", -0.5],
  ["sued", -0.5],
  ["investigation", -0.55],
  ["investigated", -0.55],
  ["recall", -0.5],
  ["layoffs", -0.5],
  ["job cuts", -0.5],
  ["bankruptcy", -0.9],
  ["fraud", -0.85],
  ["data breach", -0.5],
  ["security breach", -0.5],
  ["weak demand", -0.5],
  ["profit warning", -0.75],
  ["guidance cut", -0.8],
  ["bearish", -0.4],
  ["underperform", -0.5],
  ["sell-off", -0.4],
  ["plunge", -0.5],
  ["plunges", -0.5],
  ["scandal", -0.6],
  ["price target cut", -0.6],
  ["delisted", -0.7],
  ["resigns", -0.35],
  ["ceo resigns", -0.5],
];

const ALL_PHRASES = [...POSITIVE_PHRASES, ...NEGATIVE_PHRASES];

export function scoreNewsSentiment(text: string): SentimentResult {
  const t = text.toLowerCase();
  const matches: SentimentMatch[] = [];
  let total = 0;
  for (const [phrase, weight] of ALL_PHRASES) {
    if (t.includes(phrase)) {
      matches.push({ phrase, weight });
      total += weight;
    }
  }
  if (matches.length === 0) return { score: 0, matches };
  // tanh keeps the combined score bounded to (-1, 1) with diminishing
  // returns as more phrases pile up, rather than growing unbounded.
  return { score: Math.tanh(total), matches };
}
