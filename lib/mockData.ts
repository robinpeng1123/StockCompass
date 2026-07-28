import { CoachTip, GlossaryTerm, Holding, NewsItem, Pattern, Scenario, Stock, StoryEvent } from "./types";

// Deterministic PRNG (mulberry32) so server/client renders match exactly — no Math.random.
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seedFromTicker(ticker: string) {
  let h = 0;
  for (let i = 0; i < ticker.length; i++) h = (h * 31 + ticker.charCodeAt(i)) | 0;
  return h;
}

function genHistory(ticker: string, start: number, driftPct: number, points = 30) {
  const rand = mulberry32(seedFromTicker(ticker));
  const out: number[] = [];
  let v = start;
  for (let i = 0; i < points; i++) {
    const noise = (rand() - 0.5) * 2; // -1..1
    const drift = driftPct / points / 100;
    v = v * (1 + drift + noise * 0.018);
    out.push(Math.round(v * 100) / 100);
  }
  return out;
}

export const STOCKS: Stock[] = [
  {
    ticker: "NVDA",
    name: "NVIDIA Corporation",
    sector: "Semiconductors",
    price: 178.32,
    changePct: 2.14,
    marketCapB: 4380,
    peRatio: 62.4,
    dividendYieldPct: 0.03,
    history: genHistory("NVDA", 150, 22),
    aiScore: 88,
    risk: 72,
    momentum: 91,
    volatility: 43,
    tags: ["ai", "semiconductors", "new-high", "large-cap", "momentum"],
    blurb: "The AI-accelerator bellwether — GPUs for training and inference at hyperscale.",
  },
  {
    ticker: "SMCI",
    name: "Super Micro Computer",
    sector: "Semiconductors",
    price: 41.6,
    changePct: -3.28,
    marketCapB: 24.6,
    peRatio: 17.1,
    dividendYieldPct: 0,
    history: genHistory("SMCI", 55, -12),
    aiScore: 54,
    risk: 86,
    momentum: 38,
    volatility: 81,
    tags: ["ai", "semiconductors", "high-volatility", "small-cap"],
    blurb: "AI server builder whose stock swings hard on supply-chain and accounting headlines.",
  },
  {
    ticker: "AAPL",
    name: "Apple Inc.",
    sector: "Consumer Technology",
    price: 231.8,
    changePct: 0.42,
    marketCapB: 3540,
    peRatio: 34.2,
    dividendYieldPct: 0.44,
    history: genHistory("AAPL", 210, 6),
    aiScore: 79,
    risk: 34,
    momentum: 58,
    volatility: 24,
    tags: ["large-cap", "dividend", "consumer", "low-volatility"],
    blurb: "Devices-and-services giant leaning on an installed base of 2.2B active units.",
  },
  {
    ticker: "TSLA",
    name: "Tesla, Inc.",
    sector: "Automotive",
    price: 268.4,
    changePct: 4.87,
    marketCapB: 855,
    peRatio: 118.6,
    dividendYieldPct: 0,
    history: genHistory("TSLA", 220, 18),
    aiScore: 70,
    risk: 83,
    momentum: 77,
    volatility: 74,
    tags: ["ev", "automotive", "ai", "high-volatility", "momentum"],
    blurb: "EV maker whose story now leans on autonomy and robotics as much as car sales.",
  },
  {
    ticker: "RIVN",
    name: "Rivian Automotive",
    sector: "Automotive",
    price: 13.9,
    changePct: -1.6,
    marketCapB: 13.2,
    peRatio: null,
    dividendYieldPct: 0,
    history: genHistory("RIVN", 16, -8),
    aiScore: 42,
    risk: 88,
    momentum: 33,
    volatility: 79,
    tags: ["ev", "automotive", "small-cap", "high-volatility"],
    blurb: "Early-stage EV maker similar in ambition to Tesla, years behind on scale and margin.",
  },
  {
    ticker: "MSFT",
    name: "Microsoft Corporation",
    sector: "Software",
    price: 468.1,
    changePct: 0.88,
    marketCapB: 3480,
    peRatio: 36.9,
    dividendYieldPct: 0.68,
    history: genHistory("MSFT", 430, 9),
    aiScore: 85,
    risk: 28,
    momentum: 66,
    volatility: 21,
    tags: ["ai", "software", "large-cap", "dividend", "low-volatility"],
    blurb: "Cloud + Copilot compounder — one of the biggest owners of AI infrastructure demand.",
  },
  {
    ticker: "PLTR",
    name: "Palantir Technologies",
    sector: "Software",
    price: 158.75,
    changePct: 3.42,
    marketCapB: 372,
    peRatio: 198.3,
    dividendYieldPct: 0,
    history: genHistory("PLTR", 95, 41),
    aiScore: 76,
    risk: 80,
    momentum: 89,
    volatility: 68,
    tags: ["ai", "software", "new-high", "momentum", "high-volatility"],
    blurb: "Government + enterprise AI analytics platform, priced for a lot of future growth.",
  },
  {
    ticker: "JNJ",
    name: "Johnson & Johnson",
    sector: "Healthcare",
    price: 162.4,
    changePct: -0.21,
    marketCapB: 391,
    peRatio: 15.8,
    dividendYieldPct: 3.31,
    history: genHistory("JNJ", 158, 2),
    aiScore: 61,
    risk: 18,
    momentum: 41,
    volatility: 13,
    tags: ["dividend", "healthcare", "low-volatility", "value"],
    blurb: "Diversified pharma/medtech dividend aristocrat — the definition of a low-drama holding.",
  },
  {
    ticker: "KO",
    name: "Coca-Cola Company",
    sector: "Consumer Staples",
    price: 71.2,
    changePct: 0.15,
    marketCapB: 307,
    peRatio: 24.6,
    dividendYieldPct: 2.89,
    history: genHistory("KO", 69, 3),
    aiScore: 58,
    risk: 15,
    momentum: 36,
    volatility: 11,
    tags: ["dividend", "consumer-staples", "low-volatility", "value", "under-100"],
    blurb: "Global beverage compounder that raises its dividend almost every year, for decades.",
  },
  {
    ticker: "O",
    name: "Realty Income Corp.",
    sector: "Real Estate",
    price: 56.3,
    changePct: 0.62,
    marketCapB: 49.8,
    peRatio: 41.2,
    dividendYieldPct: 5.62,
    history: genHistory("O", 54, 4),
    aiScore: 55,
    risk: 30,
    momentum: 44,
    volatility: 18,
    tags: ["dividend", "real-estate", "under-100", "value", "monthly-dividend"],
    blurb: "\"The Monthly Dividend Company\" — net-lease REIT that pays out every single month.",
  },
  {
    ticker: "AMD",
    name: "Advanced Micro Devices",
    sector: "Semiconductors",
    price: 168.9,
    changePct: 1.73,
    marketCapB: 273,
    peRatio: 108.4,
    dividendYieldPct: 0,
    history: genHistory("AMD", 140, 17),
    aiScore: 74,
    risk: 68,
    momentum: 71,
    volatility: 56,
    tags: ["ai", "semiconductors", "momentum", "under-200"],
    blurb: "Nvidia's closest GPU rival, also riding the AI datacenter buildout.",
  },
  {
    ticker: "XOM",
    name: "Exxon Mobil Corp.",
    sector: "Energy",
    price: 118.5,
    changePct: -0.94,
    marketCapB: 498,
    peRatio: 14.1,
    dividendYieldPct: 3.24,
    history: genHistory("XOM", 116, 1),
    aiScore: 52,
    risk: 42,
    momentum: 39,
    volatility: 34,
    tags: ["dividend", "energy", "value", "under-200"],
    blurb: "Integrated oil major — cash-flow machine that tracks the price of crude.",
  },
  {
    ticker: "SOUN",
    name: "SoundHound AI",
    sector: "Software",
    price: 12.4,
    changePct: -6.1,
    marketCapB: 5.9,
    peRatio: null,
    dividendYieldPct: 0,
    history: genHistory("SOUN", 9, 65),
    aiScore: 47,
    risk: 93,
    momentum: 58,
    volatility: 91,
    tags: ["ai", "software", "small-cap", "high-volatility", "under-100"],
    blurb: "Voice-AI micro-cap that moves double digits on retail sentiment and single headlines.",
  },
  {
    ticker: "COST",
    name: "Costco Wholesale",
    sector: "Consumer Staples",
    price: 972.4,
    changePct: 0.55,
    marketCapB: 431,
    peRatio: 52.1,
    dividendYieldPct: 0.51,
    history: genHistory("COST", 890, 11),
    aiScore: 73,
    risk: 22,
    momentum: 62,
    volatility: 16,
    tags: ["large-cap", "consumer-staples", "low-volatility", "quality"],
    blurb: "Membership warehouse retailer known for pricing discipline and steady comps.",
  },
];

export function getStock(ticker: string) {
  return STOCKS.find((s) => s.ticker.toUpperCase() === ticker.toUpperCase());
}

// ---------------- Market indices (dashboard hero row) ----------------

export const INDICES = [
  { label: "S&P 500", value: 6842.15, changePct: 0.64, history: genHistory("SPX-IDX", 6600, 5) },
  { label: "Nasdaq 100", value: 24680.9, changePct: 0.91, history: genHistory("NDX-IDX", 23400, 7) },
  { label: "VIX (fear index)", value: 14.2, changePct: -3.8, history: genHistory("VIX-IDX", 16, -6) },
];

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

// ---------------- Market storytelling timelines ----------------

export const STORY_EVENTS: Record<string, StoryEvent[]> = {
  NVDA: [
    { date: "Jul 12", kind: "news", title: "Export-rule clarity", detail: "Commerce Dept. clarified export terms for AI chips to select markets, easing a key overhang.", priceImpactPct: 3.1 },
    { date: "Jul 18", kind: "macro", title: "Rates hold steady", detail: "The Fed held rates unchanged; growth stocks broadly caught a bid as discount-rate fears eased.", priceImpactPct: 1.4 },
    { date: "Jul 22", kind: "technical", title: "Reclaimed the 50-day average", detail: "Price closed back above its 50-day moving average on rising volume, flipping short-term trend bullish.", priceImpactPct: 2.0 },
    { date: "Jul 26", kind: "technical", title: "Bull flag forms", detail: "A tight, low-volume pause after the rally — the AI model flagged it as continuation, not reversal.", priceImpactPct: 0.6 },
  ],
  TSLA: [
    { date: "Jul 10", kind: "product", title: "Robotaxi expansion", detail: "Company confirmed service-area expansion in a second metro market, ahead of some analyst timelines.", priceImpactPct: 4.2 },
    { date: "Jul 17", kind: "earnings", title: "Delivery numbers beat", detail: "Quarterly deliveries came in above the whisper number despite a tougher pricing environment.", priceImpactPct: 5.6 },
    { date: "Jul 21", kind: "analyst", title: "Price target raised", detail: "A major bank raised its target citing optionality in energy storage and autonomy.", priceImpactPct: 2.8 },
    { date: "Jul 25", kind: "technical", title: "Ascending triangle", detail: "Higher lows against flat resistance — compression the model flags as likely to resolve upward.", priceImpactPct: 1.1 },
  ],
};

const DEFAULT_STORY: StoryEvent[] = [
  { date: "Jul 14", kind: "macro", title: "Sector rotation", detail: "Capital rotated into this sector as investors repositioned ahead of upcoming data.", priceImpactPct: 1.8 },
  { date: "Jul 20", kind: "news", title: "Industry headline", detail: "A widely read industry report shifted sentiment modestly positive.", priceImpactPct: 0.9 },
  { date: "Jul 26", kind: "technical", title: "Technical setup forms", detail: "Price action produced a recognizable pattern that the AI model is now tracking.", priceImpactPct: 0.5 },
];

export function getStory(ticker: string): StoryEvent[] {
  return STORY_EVENTS[ticker.toUpperCase()] ?? DEFAULT_STORY;
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

// ---------------- Portfolio (for Portfolio Copilot) ----------------

export const HOLDINGS: Holding[] = [
  { ticker: "NVDA", name: "NVIDIA Corporation", sector: "Semiconductors", shares: 40, costBasis: 96.2, price: 178.32 },
  { ticker: "AMD", name: "Advanced Micro Devices", sector: "Semiconductors", shares: 60, costBasis: 121.4, price: 168.9 },
  { ticker: "SMCI", name: "Super Micro Computer", sector: "Semiconductors", shares: 80, costBasis: 52.7, price: 41.6 },
  { ticker: "AAPL", name: "Apple Inc.", sector: "Consumer Technology", shares: 30, costBasis: 189.5, price: 231.8 },
  { ticker: "MSFT", name: "Microsoft Corporation", sector: "Software", shares: 15, costBasis: 402.1, price: 468.1 },
  { ticker: "PLTR", name: "Palantir Technologies", sector: "Software", shares: 50, costBasis: 71.3, price: 158.75 },
  { ticker: "KO", name: "Coca-Cola Company", sector: "Consumer Staples", shares: 45, costBasis: 63.8, price: 71.2 },
  { ticker: "O", name: "Realty Income Corp.", sector: "Real Estate", shares: 70, costBasis: 58.9, price: 56.3 },
];

// ---------------- AI Trading Coach tips ----------------

export const COACH_TIPS: CoachTip[] = [
  {
    id: "c1",
    kind: "warning",
    title: "You tend to sell winners early",
    detail:
      "In your last 12 trades, you closed profitable positions after an average gain of 4.2% — but held losing positions for 3x longer before selling. This is a classic disposition-effect pattern.",
  },
  {
    id: "c2",
    kind: "lesson",
    title: "This week's concept: position sizing",
    detail:
      "Two trades of equal conviction shouldn't always get equal dollars. Sizing by volatility (smaller size in choppier names) keeps any single name from dominating your swings.",
  },
  {
    id: "c3",
    kind: "good",
    title: "You waited for confirmation on NVDA",
    detail:
      "Rather than buying the first green candle, you waited for the pattern to close above resistance on volume — exactly the kind of patience that reduces false-signal entries.",
  },
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
];
