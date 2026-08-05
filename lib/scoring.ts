import { Stock } from "./types";

export function explainRisk(s: Stock) {
  // marketCapB is 0 for assets with no market-cap concept in our data (crypto,
  // some ETFs) — treat that as "unknown", not "small", so a size-based claim
  // is never made about an asset we simply have no cap figure for.
  const hasCap = s.marketCapB > 0;
  if (s.risk >= 70)
    return `${s.ticker} carries elevated risk: ${hasCap ? `a ${s.marketCapB < 50 ? "smaller market cap" : "richer valuation"} and ` : ""}${s.volatility}/100 volatility mean price swings can be sharp in either direction.`;
  if (s.risk >= 40)
    return `${s.ticker} sits at moderate risk — ${hasCap ? "a reasonably sized business, but with enough valuation or sector sensitivity to expect real drawdowns." : "enough volatility to expect real drawdowns along the way."}`;
  return `${s.ticker} screens as lower risk: ${hasCap ? "an established, diversified business with a valuation that isn't pricing in aggressive growth assumptions." : "price action here has been comparatively calm and steady recently."}`;
}

export function explainMomentum(s: Stock) {
  if (s.momentum >= 70)
    return `Momentum is strong — price has been making higher highs recently and is trending well above its own recent average.`;
  if (s.momentum >= 45)
    return `Momentum is mixed — the trend isn't clearly up or down over the recent window.`;
  return `Momentum is weak — price has been trending below its recent average, suggesting sellers have had the upper hand.`;
}

export function explainVolatility(s: Stock) {
  if (s.volatility >= 65)
    return `Daily moves have been large relative to the sector — expect a bumpier ride, in both directions.`;
  if (s.volatility >= 35)
    return `Daily moves are moderate — larger than a mega-cap staple, but not in speculative territory.`;
  return `Daily moves have been small and steady — this has traded like a lower-drama, defensive holding recently.`;
}

export function explainOverall(s: Stock) {
  const parts: string[] = [];
  if (s.momentum >= 65) parts.push("strong momentum");
  if (s.risk <= 35) parts.push("a contained risk profile");
  if (s.volatility <= 30) parts.push("low volatility");
  if (s.risk >= 65) parts.push("elevated risk");
  if (s.volatility >= 65) parts.push("high volatility");
  if (s.momentum < 45) parts.push("soft momentum");
  const joined = parts.length ? parts.join(", ") : "a mixed technical and fundamental picture";
  return `The AI score blends momentum, risk and volatility with valuation context. ${s.ticker}'s ${s.aiScore}/100 reflects ${joined}.`;
}
