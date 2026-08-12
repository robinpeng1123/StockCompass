import { Scenario } from "@/lib/types";
import weightsJson from "./scenarioModel.weights.json";

/**
 * A real supervised model — softmax (multinomial logistic) regression over
 * 10 price-action features, trained offline via gradient descent on 5 years
 * of daily closes for ~500 S&P 500 stocks (see scripts/ml/train-scenario-model.ts
 * for the full training pipeline and lib/ml/scenarioModel.weights.json for
 * the learned weights + evaluation numbers). This file only does inference:
 * compute the same 10 features from a stock's own recent closes, run them
 * through the trained weights, and turn the resulting class probabilities
 * into the three Scenario objects the UI already expects.
 *
 * Honesty check, in code where it can't be missed: on held-out stocks the
 * trained model gets ~39% 3-class accuracy versus a ~36% majority-class
 * baseline and a 33% random baseline (see weights.json's `eval` block). That
 * is a real, if modest, edge — not a reliable forecast. One month of stock
 * direction is close to an efficient-market problem; nothing bigger fed by
 * only price action should be expected to do dramatically better than this.
 */

type FeatureName =
  | "ret_5d"
  | "ret_10d"
  | "ret_20d"
  | "vol_20d"
  | "ma5_ratio"
  | "ma10_ratio"
  | "ma20_ratio"
  | "dist_from_high20"
  | "dist_from_low20"
  | "momentum_accel";

type Label = "Bearish" | "Neutral" | "Bullish";

type Weights = {
  windowDays: number;
  featureNames: FeatureName[];
  labels: Label[];
  featureMean: number[];
  featureStd: number[];
  weights: number[][]; // [feature][class]
  bias: number[]; // [class]
  rangeByClass: Record<Label, { p25: number; p50: number; p75: number }>;
  avgVol20d: number;
  eval: { valAccuracy: number; majorityBaseline: number; randomBaseline: number };
};

const W = weightsJson as unknown as Weights;

function mean(xs: number[]): number {
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}
function stdev(xs: number[]): number {
  const m = mean(xs);
  return Math.sqrt(mean(xs.map((x) => (x - m) ** 2)));
}

function computeFeatures(window: number[]): Record<FeatureName, number> {
  const price = window[window.length - 1];
  const at = (fromEnd: number) => window[window.length - 1 - fromEnd];

  const ret_5d = ((price - at(5)) / at(5)) * 100;
  const ret_10d = ((price - at(10)) / at(10)) * 100;
  const ret_20d = ((price - window[0]) / window[0]) * 100;

  const dailyReturns: number[] = [];
  for (let i = 1; i < window.length; i++) dailyReturns.push((window[i] - window[i - 1]) / window[i - 1]);
  const vol_20d = stdev(dailyReturns) * 100;

  const ma = (n: number) => mean(window.slice(window.length - n));
  const ma5_ratio = (price / ma(5) - 1) * 100;
  const ma10_ratio = (price / ma(10) - 1) * 100;
  const ma20_ratio = (price / mean(window) - 1) * 100;

  const hi20 = Math.max(...window);
  const lo20 = Math.min(...window);
  const dist_from_high20 = (price / hi20 - 1) * 100;
  const dist_from_low20 = (price / lo20 - 1) * 100;

  const momentum_accel = ret_5d - ret_10d;

  return { ret_5d, ret_10d, ret_20d, vol_20d, ma5_ratio, ma10_ratio, ma20_ratio, dist_from_high20, dist_from_low20, momentum_accel };
}

function softmax(logits: number[]): number[] {
  const max = Math.max(...logits);
  const exps = logits.map((l) => Math.exp(l - max));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map((e) => e / sum);
}

/** Rounds probabilities to whole percents that sum to exactly 100. */
function roundToSum100(probs: number[]): number[] {
  const raw = probs.map((p) => p * 100);
  const floored = raw.map(Math.floor);
  let remainder = 100 - floored.reduce((a, b) => a + b, 0);
  const order = raw
    .map((r, i) => ({ i, frac: r - floored[i] }))
    .sort((a, b) => b.frac - a.frac);
  const result = [...floored];
  for (let k = 0; k < remainder; k++) result[order[k].i] += 1;
  return result;
}

function buildTrigger(label: Label, f: Record<FeatureName, number>): string {
  const trendDesc = f.ret_20d >= 0 ? `up ${f.ret_20d.toFixed(1)}%` : `down ${Math.abs(f.ret_20d).toFixed(1)}%`;
  const maDesc =
    f.ma20_ratio >= 0 ? `${f.ma20_ratio.toFixed(1)}% above its 20-day average` : `${Math.abs(f.ma20_ratio).toFixed(1)}% below its 20-day average`;
  const base = `Last ~21 trading days: ${trendDesc}, trading ${maDesc}, ${f.vol_20d.toFixed(1)}% daily volatility.`;

  if (label === "Bullish") return `${base} The model weighs this mix of momentum and trend features toward a bullish continuation.`;
  if (label === "Bearish") return `${base} The model weighs this mix of momentum and trend features toward further downside.`;
  return `${base} The model doesn't read a strong directional edge either way from this mix of features.`;
}

const RANGE_SCALE_MIN = 0.4;
const RANGE_SCALE_MAX = 2.5;
const MIN_WINDOW = Math.max(11, W.windowDays - 5);

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

/** Standardized features + class probabilities for one window of closes — the one place the trained weights actually run. */
function runModel(window: number[]): { features: Record<FeatureName, number>; probs: number[] } {
  const features = computeFeatures(window);
  const x = W.featureNames.map((name, i) => (features[name] - W.featureMean[i]) / (W.featureStd[i] || 1));
  const logits = W.bias.map((b, c) => b + x.reduce((s, xf, f) => s + xf * W.weights[f][c], 0));
  return { features, probs: softmax(logits) };
}

/**
 * Given a stock's recent daily closes (oldest -> newest — exactly what
 * lib/liveStock.ts already fetches via getHistory(ticker, "1mo")), predicts
 * the three Scenario objects the Prediction Simulator UI expects. Falls back
 * to a neutral, low-confidence read if there isn't enough price history yet
 * (e.g. a very recent IPO) rather than guessing off a too-short window.
 */
export function predictScenarios(closes: number[]): Scenario[] {
  const window = closes.slice(-W.windowDays);
  if (window.length < MIN_WINDOW) {
    return [
      { label: "Bullish", trigger: "Not enough price history yet for a model read.", probabilityPct: 33, rangeLowPct: 2, rangeHighPct: 8 },
      { label: "Neutral", trigger: "Not enough price history yet for a model read.", probabilityPct: 34, rangeLowPct: -2, rangeHighPct: 2 },
      { label: "Bearish", trigger: "Not enough price history yet for a model read.", probabilityPct: 33, rangeLowPct: -8, rangeHighPct: -2 },
    ];
  }

  const { features, probs } = runModel(window);
  const probPct = roundToSum100(probs);

  const volScale = clamp(features.vol_20d / (W.avgVol20d || 1), RANGE_SCALE_MIN, RANGE_SCALE_MAX);

  // Output in the UI's conventional Bullish/Neutral/Bearish order regardless
  // of the training label order (Bearish/Neutral/Bullish, alphabetical-ish).
  const DISPLAY_ORDER: Label[] = ["Bullish", "Neutral", "Bearish"];
  return DISPLAY_ORDER.map((label) => {
    const i = W.labels.indexOf(label);
    const range = W.rangeByClass[label];
    return {
      label,
      trigger: buildTrigger(label, features),
      probabilityPct: probPct[i],
      rangeLowPct: range.p25 * volScale,
      rangeHighPct: range.p75 * volScale,
    };
  }) as Scenario[];
}

export type MLRiskScores = {
  risk: number;
  momentum: number;
  volatility: number;
  overallScore: number;
  riskExplain: string;
  momentumExplain: string;
  volatilityExplain: string;
  overallExplain: string;
};

/** Maps a z-score to 0-100 via a logistic squash: 0 -> 50, +2 -> ~88, -2 -> ~12. */
function zTo100(z: number): number {
  return Math.round(100 / (1 + Math.exp(-z)));
}

function zScore(value: number, featureName: FeatureName): number {
  const i = W.featureNames.indexOf(featureName);
  return (value - W.featureMean[i]) / (W.featureStd[i] || 1);
}

/**
 * Risk/Momentum/Volatility/Overall scores derived from the SAME trained
 * model as predictScenarios — not a separate heuristic. Volatility and
 * momentum are the model's own vol_20d/ret_20d features, expressed as a
 * z-score against the training distribution (500+ stocks, 5 years) rather
 * than an arbitrary multiplier. Risk is majority-weighted by the model's
 * own predicted P(Bearish); Overall by P(Bullish) net of volatility.
 */
export function computeMLRiskScores(closes: number[], ticker: string): MLRiskScores {
  const window = closes.slice(-W.windowDays);
  if (window.length < MIN_WINDOW) {
    return {
      risk: 50,
      momentum: 50,
      volatility: 50,
      overallScore: 50,
      riskExplain: `Not enough price history yet for a model read on ${ticker}.`,
      momentumExplain: `Not enough price history yet for a model read on ${ticker}.`,
      volatilityExplain: `Not enough price history yet for a model read on ${ticker}.`,
      overallExplain: `Not enough price history yet for a model read on ${ticker}.`,
    };
  }

  const { features, probs } = runModel(window);
  const bearishProb = probs[W.labels.indexOf("Bearish")];
  const bullishProb = probs[W.labels.indexOf("Bullish")];

  const volatility = clamp(zTo100(zScore(features.vol_20d, "vol_20d")), 0, 100);
  const momentum = clamp(zTo100(zScore(features.ret_20d, "ret_20d")), 0, 100);
  const risk = clamp(Math.round(bearishProb * 100 * 0.6 + volatility * 0.4), 0, 100);
  const overallScore = clamp(Math.round(bullishProb * 100 * 0.5 + momentum * 0.3 + (100 - volatility) * 0.2), 0, 100);

  const trendDesc = features.ret_20d >= 0 ? `up ${features.ret_20d.toFixed(1)}%` : `down ${Math.abs(features.ret_20d).toFixed(1)}%`;

  return {
    risk,
    momentum,
    volatility,
    overallScore,
    riskExplain: `The model puts a ${Math.round(bearishProb * 100)}% probability on a bearish outcome for ${ticker} over the next month, and recent volatility (${features.vol_20d.toFixed(1)}% daily) is ${volatility >= 60 ? "elevated" : volatility <= 40 ? "contained" : "moderate"} relative to the 500+ stocks the model trained on — together that's what sets this risk score.`,
    momentumExplain: `${ticker} is ${trendDesc} over the last ~21 trading days, which is ${momentum >= 60 ? "stronger than" : momentum <= 40 ? "weaker than" : "in line with"} the typical stock in the model's training set over the same window.`,
    volatilityExplain: `Daily price swings have averaged ${features.vol_20d.toFixed(1)}% recently, which reads as ${volatility >= 60 ? "choppier than most" : volatility <= 40 ? "calmer than most" : "fairly typical"} against the model's training distribution.`,
    overallExplain: `The model gives ${ticker} a ${Math.round(bullishProb * 100)}% probability of a bullish outcome — blended with the momentum and volatility reads above, that nets out to ${overallScore}/100.`,
  };
}
