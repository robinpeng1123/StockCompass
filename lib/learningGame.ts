import { Candle } from "@/components/ui/CandlestickChart";
import { mulberry32, seedFromString } from "./seededRandom";

export type QuizQuestion = {
  id: string;
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  candles?: Candle[];
};

export type TopicKey = "stocks" | "crypto" | "daytrading" | "candlesticks";

export type Topic = {
  key: TopicKey;
  title: string;
  emoji: string;
  description: string;
  totalLevels: number;
};

export const TOPICS: Topic[] = [
  { key: "stocks", title: "Stocks 101", emoji: "📈", description: "Ownership, valuation, and risk basics.", totalLevels: 100 },
  { key: "crypto", title: "Crypto Basics", emoji: "🪙", description: "What makes crypto different — and riskier.", totalLevels: 100 },
  { key: "daytrading", title: "Day Trading", emoji: "⚡", description: "Day-trade mechanics, risk sizing, and candles.", totalLevels: 100 },
  { key: "candlesticks", title: "Reading Candlesticks", emoji: "🕯️", description: "Read the shape of a candle like a chart pro.", totalLevels: 100 },
];

export type Animal = { key: string; label: string; emoji: string };
export const ANIMALS: Animal[] = [
  { key: "dog", label: "Dog", emoji: "🐶" },
  { key: "cow", label: "Cow", emoji: "🐮" },
  { key: "pig", label: "Pig", emoji: "🐷" },
  { key: "cat", label: "Cat", emoji: "🐱" },
];

const QUESTIONS_PER_LEVEL = 4;

// ---------------------------------------------------------------------------
// Curated, hand-written conceptual questions — the fixed core of each topic.
// A level mixes a couple of these with procedurally generated ones below, so
// 100 levels don't repeat the exact same 4 questions in the exact same order
// every time, while every question that appears is genuinely correct.
// ---------------------------------------------------------------------------

const STOCKS_CURATED: QuizQuestion[] = [
  {
    id: "stocks-c1",
    prompt: "When you buy one share of a company's stock, what do you actually own?",
    options: [
      "A tiny ownership stake in the company itself",
      "A loan you've made to the company, to be repaid with interest",
      "A guaranteed right to a share of next year's profits",
      "A coupon redeemable for company products",
    ],
    correctIndex: 0,
    explanation: "A share is a fractional ownership stake — a piece of the actual business, not a loan or a guarantee of anything.",
  },
  {
    id: "stocks-c2",
    prompt: "What does the P/E ratio measure?",
    options: [
      "Price divided by earnings per share",
      "How many years the company has been public",
      "The percentage of the company you'd own for $30",
      "The company's total debt load",
    ],
    correctIndex: 0,
    explanation: "P/E = price ÷ earnings per share — a rough gauge of how expensive a stock is relative to what it currently earns.",
  },
  {
    id: "stocks-c3",
    prompt: "What does \"market capitalization\" tell you about a company?",
    options: [
      "Its total value — share price times total shares outstanding",
      "Whether the stock is a good deal right now",
      "How much cash the company has in the bank",
      "The maximum legal price for the stock",
    ],
    correctIndex: 0,
    explanation: "Market cap is size, not value judgment — a $3T company and a $3B one can both be over- or under-valued.",
  },
  {
    id: "stocks-c4",
    prompt: "Why do investors often spread money across multiple sectors instead of one?",
    options: [
      "So one sector's bad news can't sink the entire portfolio at once",
      "Because it's required by law for retail investors",
      "Because diversified portfolios are guaranteed to outperform",
      "Because stocks in the same sector always move in opposite directions",
    ],
    correctIndex: 0,
    explanation: "Diversification manages concentration risk — it doesn't guarantee gains, but one correlated shock can't hit everything at once.",
  },
  {
    id: "stocks-c5",
    prompt: "A stock is described as \"high volatility.\" What does that mean?",
    options: [
      "Its price swings by larger amounts, in both directions, over a given period",
      "It only ever goes down",
      "It pays an unusually high dividend",
      "It's about to be delisted",
    ],
    correctIndex: 0,
    explanation: "Volatility measures the size of price swings, not their direction — it can rally hard or drop hard.",
  },
  {
    id: "stocks-c6",
    prompt: "What is a moving average typically used for?",
    options: [
      "Smoothing out day-to-day noise to reveal the underlying trend",
      "Predicting the exact price on a future date",
      "Calculating a company's tax liability",
      "Setting the stock's official closing price",
    ],
    correctIndex: 0,
    explanation: "A moving average filters short-term noise so the broader trend — up, down, or sideways — is easier to see.",
  },
  {
    id: "stocks-c7",
    prompt: "What does \"beta\" measure for a stock?",
    options: [
      "How much it tends to move relative to the overall market",
      "How many employees the company has",
      "The company's credit rating",
      "The number of times it's split",
    ],
    correctIndex: 0,
    explanation: "A beta above 1 means bigger swings than the market in both directions; below 1 means smaller swings.",
  },
  {
    id: "stocks-c8",
    prompt: "What does \"dollar-cost averaging\" mean?",
    options: [
      "Investing a fixed amount on a regular schedule, regardless of price",
      "Only buying when the price hits a new low",
      "Converting all holdings to cash once a year",
      "Borrowing money to buy more shares",
    ],
    correctIndex: 0,
    explanation: "Buying a fixed amount on a schedule naturally buys more shares when price dips and fewer when it's expensive, averaging the entry over time.",
  },
];

const CRYPTO_CURATED: QuizQuestion[] = [
  {
    id: "crypto-c1",
    prompt: "At its core, what is a blockchain?",
    options: [
      "A shared, public ledger of transactions maintained by a distributed network rather than one company",
      "A single company's private database of customer accounts",
      "A type of stock exchange only banks can access",
      "A physical coin stored in a vault",
    ],
    correctIndex: 0,
    explanation: "A blockchain is a distributed ledger — many independent nodes maintain and verify the same transaction history.",
  },
  {
    id: "crypto-c2",
    prompt: "Why does crypto often swing harder, day to day, than large-cap stocks?",
    options: [
      "Smaller, thinner markets that are more sensitive to sentiment and large trades",
      "Because it's illegal to trade crypto on weekdays",
      "Because crypto exchanges close every night",
      "Because all cryptocurrencies are required to move together",
    ],
    correctIndex: 0,
    explanation: "Less trading depth than mega-cap stocks means the same size trade moves the price more.",
  },
  {
    id: "crypto-c3",
    prompt: "What is a \"stablecoin\" designed to do?",
    options: [
      "Hold a steady value, usually pegged 1:1 to a currency like the US dollar",
      "Guarantee a fixed annual return to holders",
      "Automatically convert into stock shares",
      "Increase in value by exactly 1% every day",
    ],
    correctIndex: 0,
    explanation: "Stablecoins peg their value to something stable, most commonly the US dollar, to avoid crypto's typical volatility.",
  },
  {
    id: "crypto-c4",
    prompt: "What's the key difference between holding crypto on an exchange versus in your own private wallet?",
    options: [
      "On an exchange you're trusting a third party's custody; in a private wallet, you alone hold the keys",
      "There is no difference — both are equally insured",
      "Private wallets are run by the government",
      "Exchanges are only for buying stocks, not crypto",
    ],
    correctIndex: 0,
    explanation: "\"Not your keys, not your coins\" — an exchange could freeze, lose, or mismanage funds it custodies for you.",
  },
  {
    id: "crypto-c5",
    prompt: "Why do most major cryptocurrencies trade 24/7, unlike stocks?",
    options: [
      "There's no centralized exchange with fixed hours — it's a global, always-on network",
      "Regulators require crypto markets to never close",
      "Crypto only trades during stock market holidays",
      "It's a marketing gimmick with no technical basis",
    ],
    correctIndex: 0,
    explanation: "Stock exchanges are centralized institutions with set hours; crypto networks are decentralized and global.",
  },
  {
    id: "crypto-c6",
    prompt: "What's a risk with crypto that doesn't really apply to a stock at a regulated US broker?",
    options: [
      "Most crypto platforms don't carry FDIC/SIPC-style protection if the platform fails or is hacked",
      "Crypto can never lose value",
      "Crypto is exempt from all price swings",
      "Stocks are always riskier than crypto",
    ],
    correctIndex: 0,
    explanation: "US brokerages and banks carry specific institutional-failure protections most crypto platforms don't match.",
  },
];

const DAYTRADING_CURATED: QuizQuestion[] = [
  {
    id: "dt-c1",
    prompt: "What technically defines a \"day trade\"?",
    options: [
      "Buying and selling (or short-selling and covering) the same security within the same trading day",
      "Any trade placed using a mobile app",
      "Holding a stock for exactly 24 hours",
      "Buying a stock and never selling it",
    ],
    correctIndex: 0,
    explanation: "The defining feature of a day trade is that the position opens and closes within the same session.",
  },
  {
    id: "dt-c2",
    prompt: "What does the US Pattern Day Trader (PDT) rule generally require?",
    options: [
      "Accounts under $25,000 that make 4+ day trades in 5 business days at a margin broker face restrictions",
      "Every trader must have a license from the SEC",
      "Day trades can only be placed after 3 PM",
      "Day trading is banned for anyone under age 30",
    ],
    correctIndex: 0,
    explanation: "FINRA's PDT rule flags accounts under $25,000 equity making 4+ day trades within 5 business days.",
  },
  {
    id: "dt-c3",
    prompt: "Why is day trading generally considered much higher-risk than long-term investing?",
    options: [
      "Frequent trading racks up costs and amplifies mistakes, and most retail day traders underperform buy-and-hold over time",
      "Because the stock market is only open for day traders",
      "Because day trades are not allowed to lose money",
      "Because day traders pay no transaction costs",
    ],
    correctIndex: 0,
    explanation: "Studies of retail day-trading accounts consistently find most lose money over time once costs and mistakes are factored in.",
  },
  {
    id: "dt-c4",
    prompt: "What is a stop-loss order?",
    options: [
      "An order that automatically sells a position if the price falls to a set level, capping downside",
      "An order that guarantees you sell at the day's highest price",
      "A rule that stops the whole market from falling",
      "A type of dividend payment",
    ],
    correctIndex: 0,
    explanation: "A stop-loss triggers a sell once a price threshold is hit — it limits, but doesn't eliminate, further downside.",
  },
  {
    id: "dt-c5",
    prompt: "Why do many day traders focus on high-volume, heavily-traded stocks?",
    options: [
      "Tighter bid-ask spreads and easier order execution at the price you expect",
      "High-volume stocks never lose value",
      "It's required by federal regulation",
      "Low-volume stocks are illegal to day trade",
    ],
    correctIndex: 0,
    explanation: "High volume generally means a tighter spread and more liquidity — orders fill closer to the price you see.",
  },
];

// ---------------------------------------------------------------------------
// Generators — deterministic given a seeded RNG, so a level's questions are
// stable (same level always shows the same set) but vary across the 100
// levels, and every number in the question is real arithmetic, not filler.
// ---------------------------------------------------------------------------

function pick<T>(rand: () => number, arr: T[]): T {
  return arr[Math.floor(rand() * arr.length)];
}
function randInt(rand: () => number, min: number, max: number): number {
  return Math.floor(rand() * (max - min + 1)) + min;
}
function shuffledOptions(rand: () => number, correct: string, distractors: string[]): { options: string[]; correctIndex: number } {
  const options = [correct, ...distractors];
  for (let i = options.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [options[i], options[j]] = [options[j], options[i]];
  }
  return { options, correctIndex: options.indexOf(correct) };
}
function fmtMoney(n: number): string {
  return n >= 1000 ? `$${Math.round(n).toLocaleString("en-US")}` : `$${n.toFixed(2)}`;
}

function genPERatio(rand: () => number): QuizQuestion {
  const eps = randInt(rand, 1, 20);
  const pe = randInt(rand, 5, 40);
  const price = eps * pe;
  const { options, correctIndex } = shuffledOptions(rand, `${pe}`, [`${pe + eps}`, `${Math.max(1, pe - 3)}`, `${eps}`]);
  return {
    id: `stocks-pe-${price}-${eps}`,
    prompt: `A stock trades at $${price} with earnings per share of $${eps}. What is its P/E ratio?`,
    options,
    correctIndex,
    explanation: `P/E = price ÷ EPS = $${price} ÷ $${eps} = ${pe}.`,
  };
}

function genMarketCapTier(rand: () => number): QuizQuestion {
  const priceOptions = [randInt(rand, 5, 40), randInt(rand, 40, 200), randInt(rand, 200, 600)];
  const price = pick(rand, priceOptions);
  const sharesM = randInt(rand, 50, 8000); // millions
  const capB = (price * sharesM) / 1000; // billions
  let tier: string;
  if (capB >= 200) tier = "Mega-cap (≥$200B)";
  else if (capB >= 10) tier = "Large-cap ($10B–$200B)";
  else if (capB >= 2) tier = "Mid-cap ($2B–$10B)";
  else tier = "Small-cap (<$2B)";
  const allTiers = ["Mega-cap (≥$200B)", "Large-cap ($10B–$200B)", "Mid-cap ($2B–$10B)", "Small-cap (<$2B)"];
  const { options, correctIndex } = shuffledOptions(rand, tier, allTiers.filter((t) => t !== tier));
  return {
    id: `stocks-cap-${price}-${sharesM}`,
    prompt: `A company trades at $${price}/share with ${sharesM.toLocaleString("en-US")} million shares outstanding — a market cap of about ${fmtMoney(capB)}B. Which size tier does that fall into?`,
    options,
    correctIndex,
    explanation: `Market cap = price × shares = $${price} × ${sharesM}M ≈ $${capB.toFixed(1)}B, which falls in the ${tier} range.`,
  };
}

function genDividendYield(rand: () => number): QuizQuestion {
  const price = randInt(rand, 20, 200);
  const annualDiv = +(price * (randInt(rand, 1, 6) / 100)).toFixed(2);
  const yieldPct = +((annualDiv / price) * 100).toFixed(1);
  const { options, correctIndex } = shuffledOptions(rand, `${yieldPct}%`, [
    `${(yieldPct * 2).toFixed(1)}%`,
    `${Math.max(0.1, yieldPct - 1).toFixed(1)}%`,
    `${(yieldPct + 1.5).toFixed(1)}%`,
  ]);
  return {
    id: `stocks-div-${price}-${annualDiv}`,
    prompt: `A stock pays $${annualDiv} per share in annual dividends and trades at $${price}. What's its dividend yield?`,
    options,
    correctIndex,
    explanation: `Dividend yield = annual dividend ÷ price = $${annualDiv} ÷ $${price} ≈ ${yieldPct}%.`,
  };
}

function genCryptoMarketCap(rand: () => number): QuizQuestion {
  const supplyM = randInt(rand, 10, 900); // millions of coins
  const price = randInt(rand, 1, 300);
  const capB = (supplyM * price) / 1000;
  const wrongCapB = capB * pick(rand, [10, 0.1, 3]);
  const { options, correctIndex } = shuffledOptions(rand, `≈${fmtMoney(capB)}B`, [
    `≈${fmtMoney(wrongCapB)}B`,
    `≈${fmtMoney(capB * 1.5)}B`,
    `≈${fmtMoney(capB / 2)}B`,
  ]);
  return {
    id: `crypto-cap-${supplyM}-${price}`,
    prompt: `A cryptocurrency has ${supplyM} million coins in circulation, each worth $${price}. What's its approximate market cap?`,
    options,
    correctIndex,
    explanation: `Crypto market cap works the same as stocks: circulating supply × price = ${supplyM}M × $${price} ≈ $${capB.toFixed(1)}B.`,
  };
}

function genVolatilityCompare(rand: () => number): QuizQuestion {
  const a = randInt(rand, 1, 8);
  const b = randInt(rand, 1, 8) + (rand() > 0.5 ? 5 : -0) + 3;
  const [lo, hi] = a < b ? [a, b] : [b, a];
  const winner = hi === a ? "Coin A" : "Coin B";
  const { options, correctIndex } = shuffledOptions(rand, winner, [winner === "Coin A" ? "Coin B" : "Coin A", "They're equally volatile", "Neither moved at all"]);
  return {
    id: `crypto-vol-${a}-${b}`,
    prompt: `Yesterday, Coin A moved ${a}% and Coin B moved ${b}% (in either direction). Which one was more volatile that day?`,
    options,
    correctIndex,
    explanation: `Volatility is about the size of the move regardless of direction — ${hi}% is a bigger swing than ${lo}%, so ${winner} was more volatile.`,
  };
}

function genPositionSizing(rand: () => number): QuizQuestion {
  const account = pick(rand, [5000, 10000, 25000, 50000]);
  const riskPct = pick(rand, [1, 2]);
  const entry = randInt(rand, 20, 100);
  const stopDist = randInt(rand, 1, 5);
  const stop = entry - stopDist;
  const riskDollars = account * (riskPct / 100);
  const shares = Math.floor(riskDollars / stopDist);
  const { options, correctIndex } = shuffledOptions(rand, `${shares} shares`, [
    `${shares * 2} shares`,
    `${Math.max(1, Math.floor(shares / 2))} shares`,
    `${Math.floor(riskDollars / entry)} shares`,
  ]);
  return {
    id: `dt-size-${account}-${riskPct}-${entry}-${stopDist}`,
    prompt: `Account: $${account.toLocaleString("en-US")}. You'll risk ${riskPct}% of it on a trade entering at $${entry} with a stop-loss at $${stop}. How many shares keeps risk at that ${riskPct}%?`,
    options,
    correctIndex,
    explanation: `Risk in dollars = $${account.toLocaleString("en-US")} × ${riskPct}% = $${riskDollars}. Risk per share = $${entry} − $${stop} = $${stopDist}. Shares = $${riskDollars} ÷ $${stopDist} = ${shares}.`,
  };
}

function genRewardRisk(rand: () => number): QuizQuestion {
  const entry = randInt(rand, 20, 100);
  const stopDist = randInt(rand, 1, 5);
  const targetDist = stopDist * pick(rand, [1, 2, 3]);
  const ratio = targetDist / stopDist;
  const { options, correctIndex } = shuffledOptions(rand, `${ratio}:1`, [`1:${ratio}`, `${ratio + 1}:1`, `1:1`]);
  return {
    id: `dt-rr-${entry}-${stopDist}-${targetDist}`,
    prompt: `Entering at $${entry}, stop-loss $${stopDist} below entry, profit target $${targetDist} above entry. What's the reward-to-risk ratio?`,
    options,
    correctIndex,
    explanation: `Reward ÷ risk = $${targetDist} ÷ $${stopDist} = ${ratio}:1 — for every $1 risked, $${ratio} is the potential reward if the target is hit.`,
  };
}

type CandlePattern = "bullish" | "bearish" | "hammer" | "shootingStar" | "doji" | "bullishEngulfing";

function genCandle(rand: () => number, pattern: CandlePattern): { candles: Candle[]; prompt: string; correct: string; distractors: string[]; explanation: string } {
  const base = randInt(rand, 80, 200);
  switch (pattern) {
    case "bullish": {
      const open = base;
      const close = base + randInt(rand, 5, 12);
      return {
        candles: [{ open, high: close + 2, low: open - 2, close }],
        prompt: "What does this candle's shape indicate?",
        correct: "Buyers were in control — the price finished higher than it started",
        distractors: ["Sellers were in control the whole session", "No trades occurred that day", "The company issued new shares"],
        explanation: "Green (close ≥ open) means buying pressure won out over the session.",
      };
    }
    case "bearish": {
      const open = base + randInt(rand, 5, 12);
      const close = base;
      return {
        candles: [{ open, high: open + 2, low: close - 2, close }],
        prompt: "What does this candle's shape indicate?",
        correct: "Sellers were in control — the price finished lower than it started",
        distractors: ["Buyers pushed the price up all session", "The stock hit a new all-time high", "Trading was halted"],
        explanation: "Red (close < open) means the session ended lower than it began — sellers had the upper hand.",
      };
    }
    case "hammer": {
      const close = base + randInt(rand, 2, 5);
      const open = base;
      const low = base - randInt(rand, 8, 14);
      return {
        candles: [{ open, high: close + 1, low, close }],
        prompt: "Small body near the top, long lower wick. What does this shape suggest?",
        correct: "Sellers pushed the price sharply lower during the session, but buyers stepped in and pushed it back up before the close",
        distractors: ["The price never moved the entire day", "The stock split during the session", "There was no trading below the opening price"],
        explanation: "A long lower wick means price dropped hard intraday, but buyers absorbed the selling and drove it back up — a \"hammer,\" often read as a bullish reversal signal.",
      };
    }
    case "shootingStar": {
      const open = base;
      const close = base - randInt(rand, 2, 5);
      const high = base + randInt(rand, 8, 14);
      return {
        candles: [{ open, high, low: close - 1, close }],
        prompt: "Small body near the bottom, long upper wick. What does this shape suggest?",
        correct: "Buyers pushed the price sharply higher intraday, but sellers took control and pushed it back down before the close",
        distractors: ["The stock reached a new 52-week low with no recovery", "The company announced a dividend increase", "The candle represents a full month of trading"],
        explanation: "A long upper wick with a small body near the low means buyers drove price up, but sellers overwhelmed that move — a \"shooting star,\" often read bearishly.",
      };
    }
    case "doji": {
      const open = base;
      const close = base + (rand() > 0.5 ? 0.3 : -0.3);
      return {
        candles: [{ open, high: base + randInt(rand, 6, 10), low: base - randInt(rand, 6, 10), close }],
        prompt: "Open and close are nearly identical, with wicks on both sides. What does this typically signal?",
        correct: "Indecision — buyers and sellers fought to a standstill over the session",
        distractors: ["A guaranteed reversal the next day", "The strongest possible bullish signal", "A halted trading session"],
        explanation: "This is a \"doji\" — open ≈ close despite movement both ways during the session reflects a tug-of-war with no clear winner.",
      };
    }
    case "bullishEngulfing": {
      const c1open = base + randInt(rand, 5, 8);
      const c1close = base;
      const c2open = base - randInt(rand, 1, 3);
      const c2close = c1open + randInt(rand, 2, 6);
      return {
        candles: [
          { open: c1open, high: c1open + 1, low: c1close - 1, close: c1close },
          { open: c2open, high: c2close + 1, low: c2open - 1, close: c2close },
        ],
        prompt: "In this two-candle pattern, the second (green) candle's body fully covers the first (red) candle's body. What is this called?",
        correct: "A bullish engulfing pattern — often read as buyers overwhelming the prior selling",
        distractors: ["A bearish engulfing pattern", "Two unrelated, random candles with no pattern", "A stock split event"],
        explanation: "A down candle followed by a larger up candle whose body fully covers it is a bullish engulfing pattern — often watched as a potential reversal signal.",
      };
    }
  }
}

const CANDLE_PATTERNS: CandlePattern[] = ["bullish", "bearish", "hammer", "shootingStar", "doji", "bullishEngulfing"];

function genCandlestickQuestion(rand: () => number): QuizQuestion {
  const pattern = pick(rand, CANDLE_PATTERNS);
  const { candles, prompt, correct, distractors, explanation } = genCandle(rand, pattern);
  const { options, correctIndex } = shuffledOptions(rand, correct, distractors);
  return { id: `candle-${pattern}-${Math.round(rand() * 1e6)}`, prompt, options, correctIndex, explanation, candles };
}

const STOCK_GENERATORS = [genPERatio, genMarketCapTier, genDividendYield];
const CRYPTO_GENERATORS = [genCryptoMarketCap, genVolatilityCompare];
const DAYTRADING_GENERATORS = [genPositionSizing, genRewardRisk, genCandlestickQuestion];
const CANDLESTICK_GENERATORS = [genCandlestickQuestion];

function curatedFor(topic: TopicKey): QuizQuestion[] {
  if (topic === "stocks") return STOCKS_CURATED;
  if (topic === "crypto") return CRYPTO_CURATED;
  if (topic === "daytrading") return DAYTRADING_CURATED;
  return []; // candlesticks topic is fully generated — every question already has a real chart
}

function generatorsFor(topic: TopicKey): Array<(rand: () => number) => QuizQuestion> {
  if (topic === "stocks") return STOCK_GENERATORS;
  if (topic === "crypto") return CRYPTO_GENERATORS;
  if (topic === "daytrading") return DAYTRADING_GENERATORS;
  return CANDLESTICK_GENERATORS;
}

/**
 * A level's question set is fully determined by (topic, level) — same level
 * always shows the same questions, but each of the ~100 levels per topic
 * gets its own mix. Roughly half curated concept questions (cycling through
 * the bank as level number increases) and half procedurally generated ones
 * with fresh, correct numbers/charts each time.
 */
export function getLevelQuestions(topic: TopicKey, level: number): QuizQuestion[] {
  const rand = mulberry32(seedFromString(`${topic}:${level}`));
  const curated = curatedFor(topic);
  const generators = generatorsFor(topic);
  const questions: QuizQuestion[] = [];

  const curatedCount = curated.length > 0 ? Math.ceil(QUESTIONS_PER_LEVEL / 2) : 0;
  for (let i = 0; i < curatedCount; i++) {
    const idx = (level - 1 + i) % curated.length;
    questions.push(curated[idx]);
  }
  while (questions.length < QUESTIONS_PER_LEVEL) {
    questions.push(pick(rand, generators)(rand));
  }
  return questions;
}
