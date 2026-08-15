import { Candle } from "@/components/ui/CandlestickChart";

export type QuizQuestion = {
  id: string;
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  candles?: Candle[];
};

export type LearningModule = {
  key: string;
  title: string;
  emoji: string;
  description: string;
  questions: QuizQuestion[];
};

export const LEARNING_MODULES: LearningModule[] = [
  {
    key: "stocks",
    title: "Stocks 101",
    emoji: "📈",
    description: "Ownership, valuation, and risk basics every stock investor should know.",
    questions: [
      {
        id: "stocks-1",
        prompt: "When you buy one share of a company's stock, what do you actually own?",
        options: [
          "A tiny ownership stake in the company itself",
          "A loan you've made to the company, to be repaid with interest",
          "A guaranteed right to a share of next year's profits",
          "A coupon redeemable for company products",
        ],
        correctIndex: 0,
        explanation:
          "A share is a fractional ownership stake — you own a (very small) piece of the actual business, its assets, and its future earnings, not a loan or a guarantee of anything.",
      },
      {
        id: "stocks-2",
        prompt: "A stock's P/E ratio is 30. What does that actually measure?",
        options: [
          "The stock's price divided by its earnings per share",
          "How many years the company has been public",
          "The percentage of the company you'd own for $30",
          "The company's total debt load",
        ],
        correctIndex: 0,
        explanation:
          "P/E = price ÷ earnings per share. A P/E of 30 means investors are paying $30 for every $1 of annual profit — a rough gauge of how expensive a stock is relative to what it currently earns.",
      },
      {
        id: "stocks-3",
        prompt: "What does \"market capitalization\" tell you about a company?",
        options: [
          "Its total value — share price times total shares outstanding",
          "Whether the stock is a good deal right now",
          "How much cash the company has in the bank",
          "The maximum price the stock is legally allowed to reach",
        ],
        correctIndex: 0,
        explanation:
          "Market cap is simply size — share price × shares outstanding. It tells you nothing about whether a stock is over- or under-valued; a $3T company and a $3B one can both be mispriced.",
      },
      {
        id: "stocks-4",
        prompt: "Why do investors often spread money across multiple sectors instead of one?",
        options: [
          "So one sector's bad news can't sink the entire portfolio at once",
          "Because it's required by law for retail investors",
          "Because diversified portfolios are guaranteed to outperform",
          "Because stocks in the same sector always move in opposite directions",
        ],
        correctIndex: 0,
        explanation:
          "Diversification doesn't guarantee gains — it manages concentration risk. If every holding is correlated (e.g. all semiconductors), one sector-wide shock hits the whole portfolio at once.",
      },
      {
        id: "stocks-5",
        prompt: "A stock is described as \"high volatility.\" What does that mean?",
        options: [
          "Its price swings by larger amounts, in both directions, over a given period",
          "It only ever goes down",
          "It pays an unusually high dividend",
          "It's about to be delisted",
        ],
        correctIndex: 0,
        explanation:
          "Volatility measures the size of price swings, not their direction. A high-volatility stock can rally hard or drop hard — it's a measure of magnitude, not a prediction.",
      },
      {
        id: "stocks-6",
        prompt: "What is a 50-day moving average typically used for?",
        options: [
          "Smoothing out day-to-day noise to reveal the underlying trend",
          "Predicting the exact price 50 days from now",
          "Calculating a company's tax liability",
          "Setting the stock's official closing price",
        ],
        correctIndex: 0,
        explanation:
          "A moving average is just the average price over a trailing window. It filters out single-day noise so the broader trend — up, down, or sideways — is easier to see.",
      },
    ],
  },
  {
    key: "crypto",
    title: "Crypto Basics",
    emoji: "🪙",
    description: "What makes cryptocurrency different from stocks — and riskier.",
    questions: [
      {
        id: "crypto-1",
        prompt: "At its core, what is a blockchain?",
        options: [
          "A shared, public ledger of transactions maintained by a distributed network rather than one company",
          "A single company's private database of customer accounts",
          "A type of stock exchange only banks can access",
          "A physical coin stored in a vault",
        ],
        correctIndex: 0,
        explanation:
          "A blockchain is a distributed ledger — many independent computers (nodes) maintain and verify the same transaction history, instead of one central authority controlling it.",
      },
      {
        id: "crypto-2",
        prompt: "Why does crypto often swing harder, day to day, than large-cap stocks?",
        options: [
          "Smaller, thinner markets that are more sensitive to sentiment and large trades",
          "Because it's illegal to trade crypto on weekdays",
          "Because crypto exchanges close every night",
          "Because all cryptocurrencies are required to move together",
        ],
        correctIndex: 0,
        explanation:
          "Even large cryptocurrencies typically have less trading depth than mega-cap stocks, so the same size trade moves the price more, and sentiment/news can swing it hard in either direction.",
      },
      {
        id: "crypto-3",
        prompt: "What is a \"stablecoin\" designed to do?",
        options: [
          "Hold a steady value, usually pegged 1:1 to a currency like the US dollar",
          "Guarantee a fixed annual return to holders",
          "Automatically convert into stock shares",
          "Increase in value by exactly 1% every day",
        ],
        correctIndex: 0,
        explanation:
          "Stablecoins aim to avoid crypto's typical volatility by pegging their value to something stable (most commonly the US dollar), usually backed by reserves — though the quality of that backing varies by issuer.",
      },
      {
        id: "crypto-4",
        prompt: "What's the key difference between holding crypto on an exchange versus in your own private wallet?",
        options: [
          "On an exchange you're trusting a third party's custody; in a private wallet, you alone hold the keys",
          "There is no difference — both are equally insured",
          "Private wallets are run by the government",
          "Exchanges are only for buying stocks, not crypto",
        ],
        correctIndex: 0,
        explanation:
          "\"Not your keys, not your coins\" — on an exchange, the exchange controls the private keys and could freeze, lose, or mismanage funds. A self-custodied wallet puts that control (and responsibility) on you.",
      },
      {
        id: "crypto-5",
        prompt: "Why do most major cryptocurrencies trade 24 hours a day, 7 days a week, unlike stocks?",
        options: [
          "There's no centralized exchange with fixed hours — it's a global, always-on network",
          "Regulators require crypto markets to never close",
          "Crypto only trades during stock market holidays",
          "It's a marketing gimmick with no technical basis",
        ],
        correctIndex: 0,
        explanation:
          "Stock exchanges are centralized institutions with set hours. Crypto networks are decentralized and global, with no single entity that opens or closes the market.",
      },
      {
        id: "crypto-6",
        prompt: "What's a risk with crypto that doesn't really apply to a stock held at a regulated US broker?",
        options: [
          "Most crypto platforms don't carry FDIC/SIPC-style protection if the platform fails or is hacked",
          "Crypto can never lose value",
          "Crypto is exempt from all price swings",
          "Stocks are always riskier than crypto",
        ],
        correctIndex: 0,
        explanation:
          "Bank deposits and brokerage securities in the US have specific protections (FDIC, SIPC) against institutional failure. Most crypto exchanges don't offer an equivalent — an exchange hack or collapse can mean a total loss.",
      },
    ],
  },
  {
    key: "daytrading",
    title: "Day Trading",
    emoji: "⚡",
    description: "What a day trade actually is, and why it's a much higher-risk style of trading.",
    questions: [
      {
        id: "daytrading-1",
        prompt: "What technically defines a \"day trade\"?",
        options: [
          "Buying and selling (or short-selling and covering) the same security within the same trading day",
          "Any trade placed using a mobile app",
          "Holding a stock for exactly 24 hours",
          "Buying a stock and never selling it",
        ],
        correctIndex: 0,
        explanation:
          "A day trade means the position is opened and closed within the same session — the defining feature is that it doesn't carry overnight.",
      },
      {
        id: "daytrading-2",
        prompt: "What does the US Pattern Day Trader (PDT) rule generally require?",
        options: [
          "Accounts under $25,000 that make 4+ day trades in 5 business days at a margin broker face restrictions",
          "Every trader must have a license from the SEC",
          "Day trades can only be placed after 3 PM",
          "Day trading is banned for anyone under age 30",
        ],
        correctIndex: 0,
        explanation:
          "FINRA's Pattern Day Trader rule flags accounts under $25,000 equity that place 4+ day trades within 5 business days, restricting further day trading in that account until the minimum is met.",
      },
      {
        id: "daytrading-3",
        prompt: "Why is day trading generally considered much higher-risk than long-term investing?",
        options: [
          "Frequent trading racks up costs and amplifies mistakes, and most retail day traders underperform buy-and-hold over time",
          "Because the stock market is only open for day traders",
          "Because day trades are not allowed to lose money",
          "Because day traders pay no transaction costs",
        ],
        correctIndex: 0,
        explanation:
          "Studies of retail day trading accounts consistently find that most lose money over time once costs and mistakes are factored in — the frequency and leverage involved amplify both gains and losses.",
      },
      {
        id: "daytrading-4",
        prompt: "What is a stop-loss order?",
        options: [
          "An order that automatically sells a position if the price falls to a set level, capping downside",
          "An order that guarantees you sell at the day's highest price",
          "A rule that stops the whole market from falling",
          "A type of dividend payment",
        ],
        correctIndex: 0,
        explanation:
          "A stop-loss automatically triggers a sell once a price threshold is hit, which limits (but doesn't eliminate) further downside if a trade moves against you — execution price can still gap past the stop in fast markets.",
      },
      {
        id: "daytrading-5",
        prompt: "What does \"intraday volatility\" refer to?",
        options: [
          "Price swings that happen within a single trading session",
          "The average change in a stock's price over a full year",
          "How often a company changes its dividend",
          "The number of shares outstanding",
        ],
        correctIndex: 0,
        explanation:
          "Intraday volatility is about movement within one session — how much the price swings between the open and close of a single day, which is exactly what a day trader is exposed to.",
      },
      {
        id: "daytrading-6",
        prompt: "Why do many day traders focus on high-volume, heavily-traded stocks?",
        options: [
          "Tighter bid-ask spreads and easier order execution at the price you expect",
          "High-volume stocks never lose value",
          "It's required by federal regulation",
          "Low-volume stocks are illegal to day trade",
        ],
        correctIndex: 0,
        explanation:
          "High trading volume generally means a tighter spread between the buy and sell price and more liquidity — orders fill closer to the price you see, which matters a lot when trades are held for minutes, not months.",
      },
    ],
  },
  {
    key: "candlesticks",
    title: "Reading Candlesticks",
    emoji: "🕯️",
    description: "How to read the shape of a single candle, and what a couple of key patterns mean.",
    questions: [
      {
        id: "candle-1",
        prompt: "This candle closed above where it opened. What does the green body indicate?",
        candles: [{ open: 100, high: 109, low: 99, close: 108 }],
        options: [
          "Buyers were in control — the price finished higher than it started",
          "Sellers were in control the whole session",
          "No trades occurred that day",
          "The company issued new shares",
        ],
        correctIndex: 0,
        explanation:
          "Green (or unfilled/white on some charts) means close ≥ open — buying pressure won out over the session, even if there were dips along the way.",
      },
      {
        id: "candle-2",
        prompt: "This candle closed below where it opened. What does the red body indicate?",
        candles: [{ open: 108, high: 109, low: 99, close: 100 }],
        options: [
          "Sellers were in control — the price finished lower than it started",
          "Buyers pushed the price up all session",
          "The stock hit a new all-time high",
          "Trading was halted",
        ],
        correctIndex: 0,
        explanation:
          "Red means close < open — the session ended lower than it began, meaning sellers had the upper hand by the close.",
      },
      {
        id: "candle-3",
        prompt: "Small body near the top, with a long wick stretching far below it. What does that long lower wick suggest?",
        candles: [{ open: 104, high: 107, low: 95, close: 106 }],
        options: [
          "Sellers pushed the price sharply lower during the session, but buyers stepped in and pushed it back up before the close",
          "The price never moved the entire day",
          "The stock split during the session",
          "There was no trading below the opening price",
        ],
        correctIndex: 0,
        explanation:
          "The wick shows the full high-low range, not just open/close. A long lower wick means price dropped hard intraday — but buyers absorbed that selling and drove it back up by the close, often read as a bullish reversal signal (a \"hammer\" shape).",
      },
      {
        id: "candle-4",
        prompt: "Small body near the bottom, with a long wick stretching far above it. What does that long upper wick suggest?",
        candles: [{ open: 100, high: 110, low: 97, close: 98 }],
        options: [
          "Buyers pushed the price sharply higher intraday, but sellers took control and pushed it back down before the close",
          "The stock reached a new 52-week low with no recovery",
          "The company announced a dividend increase",
          "The candle represents a full month of trading",
        ],
        correctIndex: 0,
        explanation:
          "A long upper wick with a small body near the low of the range means buyers drove the price up during the session, but sellers overwhelmed that move and pushed it back down before the close — often read bearishly (a \"shooting star\" shape).",
      },
      {
        id: "candle-5",
        prompt: "The open and close are nearly identical, with wicks on both sides. What does this typically signal?",
        candles: [{ open: 102, high: 108, low: 96, close: 102.3 }],
        options: [
          "Indecision — buyers and sellers fought to a standstill over the session",
          "A guaranteed reversal the next day",
          "The strongest possible bullish signal",
          "A halted trading session",
        ],
        correctIndex: 0,
        explanation:
          "This is a \"doji\" — when open and close are almost equal despite the price moving both up and down during the session, it reflects a tug-of-war with no clear winner, often a sign of indecision rather than a strong directional read.",
      },
      {
        id: "candle-6",
        prompt: "In this two-candle pattern, the second (green) candle's body fully covers the first (red) candle's body. What is this called?",
        candles: [
          { open: 106, high: 107, low: 99, close: 100 },
          { open: 99, high: 110, low: 98, close: 109 },
        ],
        options: [
          "A bullish engulfing pattern — often read as buyers overwhelming the prior selling",
          "A bearish engulfing pattern",
          "Two unrelated, random candles with no pattern",
          "A stock split event",
        ],
        correctIndex: 0,
        explanation:
          "A bullish engulfing pattern is a down candle immediately followed by a larger up candle whose body fully covers the prior one — it suggests buying pressure has decisively overwhelmed the recent selling, and is often watched as a potential reversal signal after a downtrend.",
      },
    ],
  },
];
