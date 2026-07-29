import { CURATED_TICKERS } from "./curatedUniverse";

/**
 * Rotates the dashboard's spotlight ticker once every 24 hours (UTC), the
 * same pick for everyone that day — deterministic from the date, no storage
 * needed, and it flips automatically going forward with no upkeep.
 */
export function getSpotlightTicker(): string {
  const daysSinceEpoch = Math.floor(Date.now() / 86_400_000);
  const index = daysSinceEpoch % CURATED_TICKERS.length;
  return CURATED_TICKERS[index];
}
