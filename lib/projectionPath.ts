import { mulberry32, seedFromString } from "./seededRandom";

/**
 * A Brownian-bridge-style price path: pinned exactly at `startPrice` (today)
 * and `endPrice` (the probability-weighted target), with realistic-looking
 * random ups and downs in between rather than a straight line. Seeded by
 * ticker + a date key, so it's stable all day and only changes the next day
 * — "the forecast updates once daily," not on every page load.
 */
export function generateProjectionPath({
  ticker,
  dateKey,
  startPrice,
  endPrice,
  days,
  dailyVolatilityPct,
}: {
  ticker: string;
  dateKey: string;
  startPrice: number;
  endPrice: number;
  days: number;
  dailyVolatilityPct: number;
}): number[] {
  const n = Math.max(1, Math.round(days));
  const rand = mulberry32(seedFromString(`${ticker}:${dateKey}`));

  // Two noise components — a slow-ish wander plus a sharper per-step jitter —
  // read as a genuinely jagged path rather than one smooth wave.
  const walk = [0];
  for (let i = 1; i <= n; i++) walk.push(walk[i - 1] + (rand() - 0.5) * 3 + (rand() - 0.5) * 1.8);
  const wEnd = walk[n];
  const bridge = walk.map((w, i) => w - (i / n) * wEnd);

  const JAGGEDNESS = 1.8;
  const stdevDecimal = Math.max(0.008, dailyVolatilityPct / 100);
  const scale = startPrice * stdevDecimal * JAGGEDNESS;
  // Hard safety cap — a 3-sigma-equivalent bound so no seed, however
  // unlucky, can make an intermediate point wander wildly past what the
  // input volatility actually justifies.
  const maxNoise = scale * 3;

  const path = bridge.map((b, i) => {
    const straight = startPrice + (i / n) * (endPrice - startPrice);
    const noise = Math.max(-maxNoise, Math.min(maxNoise, b * scale));
    return straight + noise;
  });
  path[0] = startPrice;
  path[n] = endPrice;
  return path;
}
