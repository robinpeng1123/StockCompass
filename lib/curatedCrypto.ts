/**
 * A hand-curated list of major cryptocurrencies for the "Crypto" browse page
 * and search — same idea as curatedUniverse.ts (stocks) and curatedETFs.ts,
 * a plain-English blurb + category tag no market-data API supplies.
 *
 * Keyed by Yahoo Finance's crypto ticker convention ("BTC-USD") rather than
 * a stock ticker, since price/history for these comes from
 * lib/yahooHistory.ts's getHistory() — which already supports any ticker
 * Yahoo's public chart endpoint recognizes, crypto included, with zero
 * changes needed there.
 */
export type CuratedCryptoEntry = {
  name: string;
  category: string;
  tags: string[];
  blurb: string;
};

export const CURATED_CRYPTO: Record<string, CuratedCryptoEntry> = {
  "BTC-USD": { name: "Bitcoin", category: "Store of Value", tags: ["crypto", "large-cap"], blurb: "The original cryptocurrency — the largest by market cap, often traded as a macro risk asset." },
  "ETH-USD": { name: "Ethereum", category: "Smart Contract Platform", tags: ["crypto", "large-cap"], blurb: "The leading smart-contract platform — most DeFi and NFT activity settles here." },
  "SOL-USD": { name: "Solana", category: "Smart Contract Platform", tags: ["crypto", "high-volatility"], blurb: "High-throughput smart-contract chain, positioned as a faster/cheaper Ethereum alternative." },
  "XRP-USD": { name: "XRP", category: "Payments", tags: ["crypto"], blurb: "Built for cross-border payments and settlement, tied closely to Ripple's legal and banking partnerships." },
  "BNB-USD": { name: "BNB", category: "Exchange Token", tags: ["crypto"], blurb: "Binance's native token — utility on the world's largest crypto exchange and its own chain." },
  "DOGE-USD": { name: "Dogecoin", category: "Meme Coin", tags: ["crypto", "meme", "high-volatility"], blurb: "The original meme coin — price action driven heavily by social sentiment, not fundamentals." },
  "ADA-USD": { name: "Cardano", category: "Smart Contract Platform", tags: ["crypto"], blurb: "Research-driven smart-contract platform known for a slower, peer-reviewed development approach." },
  "AVAX-USD": { name: "Avalanche", category: "Smart Contract Platform", tags: ["crypto", "high-volatility"], blurb: "Smart-contract platform built around fast finality and custom application-specific chains." },
  "LINK-USD": { name: "Chainlink", category: "Infrastructure", tags: ["crypto"], blurb: "Oracle network that feeds real-world data (prices, events) to smart contracts across chains." },
  "DOT-USD": { name: "Polkadot", category: "Interoperability", tags: ["crypto"], blurb: "Designed to let independent blockchains ('parachains') interoperate and share security." },
  "MATIC-USD": { name: "Polygon", category: "Scaling", tags: ["crypto"], blurb: "Ethereum scaling network — cheaper, faster transactions that settle back to Ethereum." },
  "LTC-USD": { name: "Litecoin", category: "Payments", tags: ["crypto"], blurb: "An early Bitcoin fork tuned for faster block times — one of the longest-running altcoins." },
  "BCH-USD": { name: "Bitcoin Cash", category: "Payments", tags: ["crypto"], blurb: "A Bitcoin fork prioritizing larger blocks and lower fees for everyday payments." },
  "UNI-USD": { name: "Uniswap", category: "DeFi", tags: ["crypto", "high-volatility"], blurb: "Governance token for the largest decentralized token-swap exchange." },
  "SHIB-USD": { name: "Shiba Inu", category: "Meme Coin", tags: ["crypto", "meme", "high-volatility"], blurb: "A Dogecoin-inspired meme coin — extreme sentiment-driven volatility, minimal fundamentals." },
  "TRX-USD": { name: "TRON", category: "Smart Contract Platform", tags: ["crypto"], blurb: "Smart-contract platform heavily used for stablecoin transfers, especially in Asia." },
};

export const CURATED_CRYPTO_TICKERS = Object.keys(CURATED_CRYPTO);

export function getCuratedCryptoEntry(ticker: string): CuratedCryptoEntry | undefined {
  return CURATED_CRYPTO[ticker.toUpperCase()];
}
