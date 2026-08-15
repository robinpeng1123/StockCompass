export type Stock = {
  ticker: string;
  name: string;
  sector: string;
  price: number;
  prevClose: number;
  changePct: number;
  marketCapB: number;
  peRatio: number | null;
  dividendYieldPct: number;
  history: number[]; // ~30 sessions, oldest first
  aiScore: number; // 0-100 overall
  risk: number; // 0-100, higher = riskier
  momentum: number; // 0-100, higher = stronger
  volatility: number; // 0-100, higher = choppier
  tags: string[]; // used by the NL screener ("ai", "dividend", "new-high", ...)
  blurb: string;
  asOf?: number; // unix ms of the underlying quote, when sourced live
  curated?: boolean; // false when the ticker has no hand-curated tags/blurb (full-universe fallback)
};

export type Scenario = {
  label: "Bullish" | "Neutral" | "Bearish";
  trigger: string;
  probabilityPct: number;
  rangeLowPct: number;
  rangeHighPct: number;
};
