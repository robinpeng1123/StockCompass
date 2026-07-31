import { GlossaryTerm, NewsItem, Pattern, Scenario } from "./types";

// ---------------- Patterns (AI pattern-detection explanations) ----------------

export const PATTERNS: Record<string, Pattern> = {
  NVDA: {
    name: "Bull Flag",
    confidencePct: 91,
    detectedOn: "Jul 26",
    direction: "bullish",
    explanation:
      "Buyers paused after a strong rally while volume declined — a sign sellers didn't show up, they just went quiet. That kind of low-volume drift is usually rest, not reversal.",
    historicalStat: "This setup has produced upward breakouts 68% of the time over the past decade.",
  },
  TSLA: {
    name: "Ascending Triangle",
    confidencePct: 74,
    detectedOn: "Jul 25",
    direction: "bullish",
    explanation:
      "Price is making higher lows against a flat resistance ceiling — buyers are getting more aggressive while sellers hold the same line. Compression like this often resolves in the direction of the higher lows.",
    historicalStat: "Ascending triangles in high-momentum names have resolved upward 61% of the time historically.",
  },
  PLTR: {
    name: "Cup and Handle",
    confidencePct: 66,
    detectedOn: "Jul 24",
    direction: "bullish",
    explanation:
      "A rounded pullback-and-recovery (the \"cup\") is followed by a shallow, low-volume dip (the \"handle\") — a pattern that typically shakes out short-term holders right before a continuation.",
    historicalStat: "This formation has preceded further gains 58% of the time in growth-stage tech names.",
  },
  SMCI: {
    name: "Descending Channel",
    confidencePct: 79,
    detectedOn: "Jul 27",
    direction: "bearish",
    explanation:
      "Each rally is getting sold into at a lower high, while volume picks up on the down days — a sign distribution (holders exiting) is outweighing new demand.",
    historicalStat: "Descending channels with rising down-volume have continued lower 63% of the time.",
  },
  SOUN: {
    name: "Parabolic Exhaustion",
    confidencePct: 70,
    detectedOn: "Jul 22",
    direction: "bearish",
    explanation:
      "A near-vertical run followed by a sharp reversal candle on heavy volume — often a sign that late buyers chasing the move have run out, and profit-taking is starting to dominate.",
    historicalStat: "Parabolic moves that reverse on 3x average volume have pulled back further 71% of the time.",
  },
  AMD: {
    name: "Bull Flag",
    confidencePct: 68,
    detectedOn: "Jul 23",
    direction: "bullish",
    explanation:
      "A tight, low-volume consolidation is forming just under a recent high — the pause looks like digestion of gains rather than new sellers stepping in.",
    historicalStat: "This setup has produced upward breakouts 68% of the time over the past decade.",
  },
};

export function getPattern(ticker: string): Pattern {
  return (
    PATTERNS[ticker.toUpperCase()] ?? {
      name: "Range-bound Consolidation",
      confidencePct: 55,
      detectedOn: "Jul 27",
      direction: "neutral",
      explanation:
        "Price is chopping between a well-defined support and resistance band with no clear volume trend — the market is waiting on a catalyst before picking a direction.",
      historicalStat: "Range-bound setups without a volume signal resolve roughly at a coin-flip rate historically.",
    }
  );
}

// ---------------- Scenarios (prediction simulator) ----------------

export const SCENARIOS: Record<string, Scenario[]> = {
  NVDA: [
    { label: "Bullish", trigger: "If earnings beat estimates and data-center guidance rises", probabilityPct: 30, rangeLowPct: 8, rangeHighPct: 15 },
    { label: "Neutral", trigger: "If results land in line with consensus", probabilityPct: 50, rangeLowPct: -2, rangeHighPct: 4 },
    { label: "Bearish", trigger: "If gross margin guidance disappoints", probabilityPct: 20, rangeLowPct: -10, rangeHighPct: -4 },
  ],
  TSLA: [
    { label: "Bullish", trigger: "If FSD/robotaxi milestones are hit on schedule", probabilityPct: 28, rangeLowPct: 10, rangeHighPct: 22 },
    { label: "Neutral", trigger: "If delivery numbers roughly match estimates", probabilityPct: 44, rangeLowPct: -4, rangeHighPct: 5 },
    { label: "Bearish", trigger: "If margins compress further on price cuts", probabilityPct: 28, rangeLowPct: -16, rangeHighPct: -6 },
  ],
  AAPL: [
    { label: "Bullish", trigger: "If iPhone upgrade cycle accelerates", probabilityPct: 25, rangeLowPct: 5, rangeHighPct: 9 },
    { label: "Neutral", trigger: "If services growth offsets flat hardware", probabilityPct: 55, rangeLowPct: -2, rangeHighPct: 3 },
    { label: "Bearish", trigger: "If China demand disappoints again", probabilityPct: 20, rangeLowPct: -7, rangeHighPct: -3 },
  ],
};

const DEFAULT_SCENARIOS: Scenario[] = [
  { label: "Bullish", trigger: "If earnings beat estimates", probabilityPct: 30, rangeLowPct: 8, rangeHighPct: 15 },
  { label: "Neutral", trigger: "If inflation data comes in as expected", probabilityPct: 50, rangeLowPct: -3, rangeHighPct: 2 },
  { label: "Bearish", trigger: "If sector-wide multiples compress", probabilityPct: 20, rangeLowPct: -10, rangeHighPct: -4 },
];

export function getScenarios(ticker: string): Scenario[] {
  return SCENARIOS[ticker.toUpperCase()] ?? DEFAULT_SCENARIOS;
}

// ---------------- News ----------------

export const NEWS: NewsItem[] = [
  { id: "n1", ticker: "NVDA", headline: "Nvidia extends rally as AI capex commentary stays upbeat", category: "analyst", minutesAgo: 22, sentiment: "positive" },
  { id: "n2", ticker: "TSLA", headline: "Tesla deliveries top estimates despite price cuts", category: "earnings", minutesAgo: 41, sentiment: "positive" },
  { id: "n3", ticker: "SMCI", headline: "Super Micro slides on renewed supply-chain concerns", category: "product", minutesAgo: 58, sentiment: "negative" },
  { id: "n4", ticker: "PLTR", headline: "Palantir wins expanded government contract", category: "product", minutesAgo: 75, sentiment: "positive" },
  { id: "n5", ticker: "AAPL", headline: "Apple supplier checks point to steady iPhone demand", category: "analyst", minutesAgo: 96, sentiment: "neutral" },
  { id: "n6", ticker: "MSFT", headline: "Microsoft Copilot seat growth accelerates, analysts say", category: "analyst", minutesAgo: 110, sentiment: "positive" },
  { id: "n7", ticker: "SOUN", headline: "SoundHound AI drops as early investor trims stake", category: "regulatory", minutesAgo: 130, sentiment: "negative" },
  { id: "n8", ticker: "XOM", headline: "Exxon steady as crude holds range ahead of inventory data", category: "macro", minutesAgo: 150, sentiment: "neutral" },
  { id: "n9", ticker: "AMD", headline: "AMD's next-gen accelerator sampling ahead of schedule", category: "product", minutesAgo: 172, sentiment: "positive" },
  { id: "n10", ticker: "RIVN", headline: "Rivian cuts production guidance on demand softness", category: "earnings", minutesAgo: 205, sentiment: "negative" },
];

// ---------------- Learning glossary ----------------

export const GLOSSARY: GlossaryTerm[] = [
  {
    term: "Bull Flag",
    short: "A brief, low-volume pause after a sharp rally.",
    detail:
      "Named for its shape on a chart — a sharp rally (the pole) followed by a tight, slightly downward-drifting consolidation (the flag). Declining volume during the flag suggests sellers aren't stepping in, just that buyers are catching their breath.",
    example: "NVDA formed one on Jul 26 after its recent run — see the live example on its detail page.",
    relatedTicker: "NVDA",
  },
  {
    term: "P/E Ratio",
    short: "Price divided by earnings per share — a rough measure of how expensive a stock is.",
    detail:
      "A P/E of 30 means investors are paying $30 for every $1 of annual earnings. High-growth companies often trade at higher P/Es because investors expect earnings to grow into the price; the ratio alone can't tell you if that's justified.",
    example: "AAPL trades near 34x earnings; JNJ trades near 16x — reflecting very different growth expectations.",
    relatedTicker: "AAPL",
  },
  {
    term: "Volatility",
    short: "How much a stock's price swings, in either direction, over time.",
    detail:
      "High volatility means bigger, faster moves — more upside potential, but also bigger drawdowns and a rougher ride. It's not inherently \"bad,\" but it should match your time horizon and risk tolerance.",
    example: "SOUN swings far more per day than KO — both can be reasonable holdings for very different investors.",
    relatedTicker: "SOUN",
  },
  {
    term: "Sector Concentration",
    short: "How much of a portfolio sits in one industry.",
    detail:
      "Even great individual picks can add up to a fragile portfolio if too many of them move together. A semiconductor downturn doesn't just hit one stock — it can hit every chip-related name in a portfolio at once.",
    example: "A portfolio 42% weighted to semiconductors will feel any chip-sector news far more than a diversified one.",
    relatedTicker: "SMCI",
  },
  {
    term: "Moving Average",
    short: "The average price over a recent window (e.g. 50 days), smoothing out noise.",
    detail:
      "Moving averages help separate short-term noise from the underlying trend. Price crossing above a moving average is often read as a shift toward bullish momentum; crossing below, the opposite.",
    example: "NVDA reclaiming its 50-day average on Jul 22 was an early signal in its recent story timeline.",
    relatedTicker: "NVDA",
  },
  {
    term: "Dividend Yield",
    short: "Annual dividend payments as a percentage of share price.",
    detail:
      "A higher yield can mean more income, but an unusually high yield can also be a warning sign — the market pricing in a dividend cut. Yield should be read alongside payout ratio and business stability, not alone.",
    example: "O yields over 5% and pays monthly; JNJ yields around 3.3% with decades of consistent increases.",
    relatedTicker: "O",
  },
  {
    term: "Market Capitalization",
    short: "The total value of a company's shares — share price times shares outstanding.",
    detail:
      "Market cap tells you the size of a company, not whether it's a good deal — a $3T company and a $3B one can both be over- or under-valued. It's most useful for comparing risk profile: mega-caps tend to be steadier, small-caps more volatile.",
    example: "AAPL and MSFT both sit above $3T; RIVN is a small-cap by comparison, at a fraction of that size.",
    relatedTicker: "AAPL",
  },
  {
    term: "Diversification",
    short: "Spreading money across different companies, sectors, and asset types.",
    detail:
      "The idea is simple: if your holdings don't all move for the same reason, one bad event can't sink the whole portfolio. Diversification doesn't guarantee gains — it manages how badly any single mistake can hurt.",
    example: "A portfolio split across semiconductors, staples, and real estate feels one sector's bad news far less than an all-in-one-sector portfolio.",
    relatedTicker: "KO",
  },
  {
    term: "Earnings Per Share (EPS)",
    short: "A company's profit divided by its number of shares outstanding.",
    detail:
      "EPS is the raw profit-per-share number that P/E ratios are built from. \"Beating\" or \"missing\" earnings usually means actual EPS came in above or below what analysts expected — not whether the company was profitable at all.",
    example: "A stock can miss its EPS estimate and still be profitable — the market often reacts to the miss anyway.",
    relatedTicker: "MSFT",
  },
  {
    term: "Beta",
    short: "How much a stock tends to move relative to the overall market.",
    detail:
      "A beta of 1 means a stock roughly tracks the market; above 1 means bigger swings than the market in both directions, below 1 means smaller ones. It's a rough historical tendency, not a guarantee of future behavior.",
    example: "High-beta growth names tend to fall harder in market-wide selloffs than low-beta staples do.",
    relatedTicker: "PLTR",
  },
  {
    term: "Dollar-Cost Averaging",
    short: "Investing a fixed amount on a regular schedule, regardless of price.",
    detail:
      "Instead of trying to time the perfect entry, you buy on a set schedule — some purchases land at high prices, some at low ones, averaging out over time. It won't beat a perfectly-timed lump sum, but it removes the pressure of guessing the bottom.",
    example: "Buying $200 of a stock every month means you naturally buy more shares when it dips and fewer when it's expensive.",
    relatedTicker: "COST",
  },
];

// ---------------- Video lessons ----------------
// Real videos from established educational sources — verified to exist, not
// generated. Picked to match concepts already covered in the glossary above.

export type VideoLesson = {
  title: string;
  channel: string;
  videoId: string;
  topic: string;
};

export const VIDEOS: VideoLesson[] = [
  {
    title: "What it Means to Buy a Company's Stock",
    channel: "Khan Academy",
    videoId: "98qfFzqDKR8",
    topic: "The basics of stock ownership",
  },
  {
    title: "Introduction to the Price-to-Earnings (P/E) Ratio",
    channel: "Khan Academy",
    videoId: "bv2fn7oLR-g",
    topic: "P/E Ratio",
  },
  {
    title: "How Risky Is The Stock Market?",
    channel: "Two Cents (PBS)",
    videoId: "249Gc7FDWRI",
    topic: "Volatility & risk",
  },
  {
    title: "What Is Diversification?",
    channel: "Fidelity Investments",
    videoId: "MZchH0Ddzn8",
    topic: "Diversification",
  },
];
