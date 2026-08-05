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

/**
 * Given a stock's recent daily closes (oldest -> newest — exactly what
 * lib/liveStock.ts already fetches via getHistory(ticker, "1mo")), predicts
 * the three Scenario objects the Prediction Simulator UI expects. Falls back
 * to a neutral, low-confidence read if there isn't enough price history yet
 * (e.g. a very recent IPO) rather than guessing off a too-short window.
 */
export function predictScenarios(closes: number[]): Scenario[] {
  const window = closes.slice(-W.windowDays);
  if (window.length < Math.max(11, W.windowDays - 5)) {
    return [
      { label: "Bullish", trigger: "Not enough price history yet for a model read.", probabilityPct: 33, rangeLowPct: 2, rangeHighPct: 8 },
      { label: "Neutral", trigger: "Not enough price history yet for a model read.", probabilityPct: 34, rangeLowPct: -2, rangeHighPct: 2 },
      { label: "Bearish", trigger: "Not enough price history yet for a model read.", probabilityPct: 33, rangeLowPct: -8, rangeHighPct: -2 },
    ];
  }

  const features = computeFeatures(window);
  const x = W.featureNames.map((name, i) => (features[name] - W.featureMean[i]) / (W.featureStd[i] || 1));
  const logits = W.bias.map((b, c) => b + x.reduce((s, xf, f) => s + xf * W.weights[f][c], 0));
  const probs = softmax(logits);
  const probPct = roundToSum100(probs);

  const volScale = Math.min(RANGE_SCALE_MAX, Math.max(RANGE_SCALE_MIN, features.vol_20d / (W.avgVol20d || 1)));

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
