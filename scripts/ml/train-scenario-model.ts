#!/usr/bin/env -S npx tsx
/**
 * Trains the Scenario Simulator's supervised model — a softmax (multinomial
 * logistic) regression over price-action features, predicting whether a
 * stock is headed Bullish / Neutral / Bearish ~21 trading days out.
 *
 * Data: 5 years (2013-2018) of daily OHLCV for all ~500 S&P 500 constituents
 * (619k rows), a well-known public dataset mirrored at:
 *   https://raw.githubusercontent.com/plotly/datasets/master/all_stocks_5yr.csv
 * (originally compiled from Yahoo Finance; commonly used for ML tutorials —
 * see e.g. the Kaggle dataset "S&P 500 stock data" by camnugent).
 *
 * Only close-price-derived features are used, and only a 21-trading-day
 * trailing window — matching exactly what the live app has available via
 * getHistory(ticker, "1mo") in lib/liveStock.ts, so train/inference features
 * are computed identically. No volume/fundamentals features, even though
 * the dataset has volume, because the production Stock object doesn't carry
 * per-day volume.
 *
 * Run: npx tsx scripts/ml/train-scenario-model.ts
 * Output: lib/ml/scenarioModel.weights.json (committed — the live app loads
 * this directly; nothing at request-time depends on this script).
 */

import fs from "fs";
import path from "path";

const DATA_URL = "https://raw.githubusercontent.com/plotly/datasets/master/all_stocks_5yr.csv";
const CACHE_PATH = path.join(__dirname, ".cache-all_stocks_5yr.csv");
const OUT_PATH = path.join(__dirname, "..", "..", "lib", "ml", "scenarioModel.weights.json");

const WINDOW = 21; // trailing daily closes used for features (~1 trading month)
const HORIZON = 21; // trading days ahead for the label (~1 trading month)
const FEATURE_NAMES = [
  "ret_5d",
  "ret_10d",
  "ret_20d",
  "vol_20d",
  "ma5_ratio",
  "ma10_ratio",
  "ma20_ratio",
  "dist_from_high20",
  "dist_from_low20",
  "momentum_accel",
] as const;
type FeatureVec = number[]; // length FEATURE_NAMES.length, in the order above

const LABELS = ["Bearish", "Neutral", "Bullish"] as const;
type Label = (typeof LABELS)[number];

async function loadCsv(): Promise<string> {
  if (fs.existsSync(CACHE_PATH)) {
    console.log(`[data] using cached ${CACHE_PATH}`);
    return fs.readFileSync(CACHE_PATH, "utf8");
  }
  console.log(`[data] fetching ${DATA_URL}`);
  const res = await fetch(DATA_URL);
  if (!res.ok) throw new Error(`Failed to fetch dataset: HTTP ${res.status}`);
  const text = await res.text();
  fs.writeFileSync(CACHE_PATH, text);
  return text;
}

type Row = { date: string; close: number; ticker: string };

function parseCsv(text: string): Row[] {
  const lines = text.split("\n");
  const header = lines[0].split(",");
  const dateIdx = header.indexOf("date");
  const closeIdx = header.indexOf("close");
  const nameIdx = header.indexOf("Name");
  const rows: Row[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;
    const cols = line.split(",");
    const close = Number(cols[closeIdx]);
    const ticker = cols[nameIdx];
    if (!ticker || !Number.isFinite(close) || close <= 0) continue;
    rows.push({ date: cols[dateIdx], close, ticker });
  }
  return rows;
}

function mean(xs: number[]): number {
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}
function stdev(xs: number[]): number {
  const m = mean(xs);
  return Math.sqrt(mean(xs.map((x) => (x - m) ** 2)));
}
function quantile(sorted: number[], q: number): number {
  const idx = (sorted.length - 1) * q;
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sorted[lo];
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
}

function computeFeatures(window: number[]): FeatureVec {
  // window has exactly WINDOW closes, oldest -> newest; last element is "today"
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

  return [ret_5d, ret_10d, ret_20d, vol_20d, ma5_ratio, ma10_ratio, ma20_ratio, dist_from_high20, dist_from_low20, momentum_accel];
}

type Sample = { ticker: string; features: FeatureVec; forwardReturnPct: number };

function buildSamples(rows: Row[]): Sample[] {
  const byTicker = new Map<string, Row[]>();
  for (const r of rows) {
    if (!byTicker.has(r.ticker)) byTicker.set(r.ticker, []);
    byTicker.get(r.ticker)!.push(r);
  }

  const samples: Sample[] = [];
  for (const [ticker, series] of byTicker) {
    series.sort((a, b) => (a.date < b.date ? -1 : 1));
    const closes = series.map((s) => s.close);
    for (let i = WINDOW - 1; i + HORIZON < closes.length; i++) {
      const window = closes.slice(i - WINDOW + 1, i + 1);
      const today = closes[i];
      const future = closes[i + HORIZON];
      const forwardReturnPct = ((future - today) / today) * 100;
      samples.push({ ticker, features: computeFeatures(window), forwardReturnPct });
    }
  }
  return samples;
}

function splitByTicker(samples: Sample[], valFraction: number): { train: Sample[]; val: Sample[] } {
  const tickers = Array.from(new Set(samples.map((s) => s.ticker))).sort();
  // Deterministic pseudo-shuffle (no Math.random dependency) via a simple hash.
  const hash = (s: string) => {
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    return h;
  };
  const ranked = tickers.map((t) => ({ t, h: hash(t) })).sort((a, b) => a.h - b.h);
  const valCount = Math.round(ranked.length * valFraction);
  const valTickers = new Set(ranked.slice(0, valCount).map((r) => r.t));

  const train: Sample[] = [];
  const val: Sample[] = [];
  for (const s of samples) (valTickers.has(s.ticker) ? val : train).push(s);
  return { train, val };
}

function standardize(samples: Sample[], meanArr: number[], stdArr: number[]): number[][] {
  return samples.map((s) => s.features.map((f, i) => (f - meanArr[i]) / (stdArr[i] || 1)));
}

function softmax(logits: number[]): number[] {
  const max = Math.max(...logits);
  const exps = logits.map((l) => Math.exp(l - max));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map((e) => e / sum);
}

function labelFromReturn(r: number, lowT: number, highT: number): Label {
  if (r <= lowT) return "Bearish";
  if (r >= highT) return "Bullish";
  return "Neutral";
}

async function main() {
  const csv = await loadCsv();
  console.log("[data] parsing CSV...");
  const rows = parseCsv(csv);
  console.log(`[data] ${rows.length} rows across ${new Set(rows.map((r) => r.ticker)).size} tickers`);

  console.log("[features] building samples (21-day window, 21-day-ahead label)...");
  const allSamples = buildSamples(rows);
  console.log(`[features] ${allSamples.length} samples`);

  const { train, val } = splitByTicker(allSamples, 0.15);
  console.log(`[split] train=${train.length} samples (${new Set(train.map((s) => s.ticker)).size} tickers), ` +
    `val=${val.length} samples (${new Set(val.map((s) => s.ticker)).size} tickers) — split by ticker, not by date`);

  // Balanced tercile thresholds computed on TRAIN forward returns only.
  const trainReturns = train.map((s) => s.forwardReturnPct).sort((a, b) => a - b);
  const lowT = quantile(trainReturns, 1 / 3);
  const highT = quantile(trainReturns, 2 / 3);
  console.log(`[labels] tercile thresholds from train set: Bearish <= ${lowT.toFixed(2)}%, Bullish >= ${highT.toFixed(2)}%`);

  const trainLabels = train.map((s) => labelFromReturn(s.forwardReturnPct, lowT, highT));
  const valLabels = val.map((s) => labelFromReturn(s.forwardReturnPct, lowT, highT));

  // Feature standardization from train set only.
  const nFeat = FEATURE_NAMES.length;
  const featMean = Array.from({ length: nFeat }, (_, i) => mean(train.map((s) => s.features[i])));
  const featStd = Array.from({ length: nFeat }, (_, i) => stdev(train.map((s) => s.features[i])) || 1);

  const Xtrain = standardize(train, featMean, featStd);
  const Xval = standardize(val, featMean, featStd);
  const Ytrain = trainLabels.map((l) => LABELS.indexOf(l));
  const Yval = valLabels.map((l) => LABELS.indexOf(l));

  // --- Train softmax regression via mini-batch gradient descent ---
  const nClass = LABELS.length;
  let W: number[][] = Array.from({ length: nFeat }, () => Array.from({ length: nClass }, () => 0));
  let b: number[] = Array.from({ length: nClass }, () => 0);

  const LR = 0.1;
  const L2 = 1e-4;
  const EPOCHS = 30;
  const BATCH = 4096;

  console.log("[train] starting gradient descent...");
  const n = Xtrain.length;
  const indices = Array.from({ length: n }, (_, i) => i);

  function evalAccuracy(X: number[][], Y: number[]): number {
    let correct = 0;
    for (let i = 0; i < X.length; i++) {
      const logits = W[0].map((_, c) => b[c] + X[i].reduce((s, x, f) => s + x * W[f][c], 0));
      const pred = logits.indexOf(Math.max(...logits));
      if (pred === Y[i]) correct++;
    }
    return correct / X.length;
  }

  for (let epoch = 0; epoch < EPOCHS; epoch++) {
    // Deterministic epoch-dependent shuffle (Fisher-Yates with a seeded LCG).
    let seed = epoch * 2654435761 + 1;
    const rand = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 4294967296;
    };
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }

    for (let start = 0; start < n; start += BATCH) {
      const batchIdx = indices.slice(start, start + BATCH);
      const gradW: number[][] = Array.from({ length: nFeat }, () => Array.from({ length: nClass }, () => 0));
      const gradB: number[] = Array.from({ length: nClass }, () => 0);

      for (const i of batchIdx) {
        const x = Xtrain[i];
        const logits = Array.from({ length: nClass }, (_, c) => b[c] + x.reduce((s, xf, f) => s + xf * W[f][c], 0));
        const probs = softmax(logits);
        probs[Ytrain[i]] -= 1; // dL/dlogit for cross-entropy + softmax
        for (let c = 0; c < nClass; c++) {
          gradB[c] += probs[c];
          for (let f = 0; f < nFeat; f++) gradW[f][c] += probs[c] * x[f];
        }
      }

      const m = batchIdx.length;
      for (let c = 0; c < nClass; c++) {
        b[c] -= (LR * gradB[c]) / m;
        for (let f = 0; f < nFeat; f++) {
          W[f][c] -= LR * (gradW[f][c] / m + L2 * W[f][c]);
        }
      }
    }

    if (epoch % 5 === 0 || epoch === EPOCHS - 1) {
      const trainAcc = evalAccuracy(Xtrain, Ytrain);
      const valAcc = evalAccuracy(Xval, Yval);
      console.log(`[train] epoch ${epoch}: train acc=${(trainAcc * 100).toFixed(1)}%  val acc=${(valAcc * 100).toFixed(1)}%`);
    }
  }

  const finalValAcc = evalAccuracy(Xval, Yval);
  const majorityBaseline = Math.max(...LABELS.map((_, c) => Yval.filter((y) => y === c).length)) / Yval.length;

  // Confusion matrix on val set.
  const confusion: number[][] = Array.from({ length: nClass }, () => Array.from({ length: nClass }, () => 0));
  for (let i = 0; i < Xval.length; i++) {
    const logits = Array.from({ length: nClass }, (_, c) => b[c] + Xval[i].reduce((s, xf, f) => s + xf * W[f][c], 0));
    const pred = logits.indexOf(Math.max(...logits));
    confusion[Yval[i]][pred]++;
  }

  console.log(`\n[eval] final val accuracy: ${(finalValAcc * 100).toFixed(2)}%`);
  console.log(`[eval] majority-class baseline: ${(majorityBaseline * 100).toFixed(2)}%  (random 3-class baseline: 33.33%)`);
  console.log("[eval] confusion matrix (rows=actual, cols=predicted), order Bearish/Neutral/Bullish:");
  confusion.forEach((row) => console.log("  " + row.join("\t")));

  // Class-conditional forward-return quantiles (train set) — used to size
  // each scenario's displayed price range, scaled per-stock by volatility.
  const trainVol20 = train.map((s) => s.features[FEATURE_NAMES.indexOf("vol_20d")]);
  const avgVol20 = mean(trainVol20);

  const rangeByClass: Record<Label, { p25: number; p50: number; p75: number }> = {} as any;
  for (const label of LABELS) {
    const returns = train
      .filter((_, i) => trainLabels[i] === label)
      .map((s) => s.forwardReturnPct)
      .sort((a, b) => a - b);
    rangeByClass[label] = { p25: quantile(returns, 0.25), p50: quantile(returns, 0.5), p75: quantile(returns, 0.75) };
  }
  console.log("[ranges] class-conditional forward-return quantiles (train set):", rangeByClass);

  const output = {
    version: 1,
    trainedAt: new Date().toISOString(),
    dataSource: DATA_URL,
    windowDays: WINDOW,
    horizonDays: HORIZON,
    featureNames: FEATURE_NAMES,
    labels: LABELS,
    featureMean: featMean,
    featureStd: featStd,
    weights: W,
    bias: b,
    labelThresholds: { lowT, highT },
    rangeByClass,
    avgVol20d: avgVol20,
    eval: {
      valAccuracy: finalValAcc,
      majorityBaseline,
      randomBaseline: 1 / nClass,
      confusionMatrix: confusion,
      trainSamples: train.length,
      valSamples: val.length,
      trainTickers: new Set(train.map((s) => s.ticker)).size,
      valTickers: new Set(val.map((s) => s.ticker)).size,
    },
  };

  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  fs.writeFileSync(OUT_PATH, JSON.stringify(output, null, 2));
  console.log(`\n[done] wrote ${OUT_PATH}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
