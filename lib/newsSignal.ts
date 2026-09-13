import { Scenario } from "./types";

/** An admin-curated news signal for a ticker, as returned by /api/news-signal/[ticker]. */
export type NewsEntry = { id: string; text: string; score: number; createdAt: string };

export function averageSentiment(entries: NewsEntry[]): number {
  if (entries.length === 0) return 0;
  return entries.reduce((sum, e) => sum + e.score, 0) / entries.length;
}

const MAX_PROB_TILT_PCT = 22; // percentage points, at sentiment = +/-1
const MAX_RANGE_SHIFT_PCT = 2.5; // percentage points added to each scenario's rangeLow/rangeHigh, at sentiment = +/-1

/**
 * Blends a manual news-sentiment signal into the model's own scenarios.
 * This is deliberately NOT retraining the model — it's a transparent
 * overlay: the news tilts probability mass toward/away from Bullish and
 * Bearish (borrowing from/adding to Neutral) and nudges each scenario's
 * price range a little, proportional to how strong the sentiment reads.
 * At sentiment = 0 this returns the base scenarios completely unchanged.
 */
export function applyNewsSignal(base: Scenario[], sentiment: number): Scenario[] {
  if (!sentiment) return base;

  const byLabel = Object.fromEntries(base.map((s) => [s.label, s])) as Record<Scenario["label"], Scenario>;
  const tilt = sentiment * MAX_PROB_TILT_PCT;
  const rangeShift = sentiment * MAX_RANGE_SHIFT_PCT;

  const raw: Record<Scenario["label"], number> = {
    Bullish: Math.max(0.5, byLabel.Bullish.probabilityPct + tilt),
    Neutral: Math.max(0.5, byLabel.Neutral.probabilityPct),
    Bearish: Math.max(0.5, byLabel.Bearish.probabilityPct - tilt),
  };
  const sum = raw.Bullish + raw.Neutral + raw.Bearish;
  const scaled: Record<Scenario["label"], number> = {
    Bullish: (raw.Bullish / sum) * 100,
    Neutral: (raw.Neutral / sum) * 100,
    Bearish: (raw.Bearish / sum) * 100,
  };

  // Round to whole percents that still sum to exactly 100.
  const floored = Object.fromEntries(Object.entries(scaled).map(([k, v]) => [k, Math.floor(v)])) as Record<
    Scenario["label"],
    number
  >;
  let remainder = 100 - (floored.Bullish + floored.Neutral + floored.Bearish);
  const order = (Object.entries(scaled) as Array<[Scenario["label"], number]>)
    .map(([label, v]) => ({ label, frac: v - floored[label] }))
    .sort((a, b) => b.frac - a.frac);
  for (let i = 0; i < remainder; i++) floored[order[i].label] += 1;

  return base.map((s) => ({
    ...s,
    probabilityPct: floored[s.label],
    rangeLowPct: s.rangeLowPct + rangeShift,
    rangeHighPct: s.rangeHighPct + rangeShift,
  }));
}
