/**
 * The "AI narrative layer" — hand-curated sector grouping, thematic tags, and
 * plain-English blurbs for a broad set of well-known tickers. No market-data
 * API can supply "why this matters" framing or thematic tags (ai/ev/dividend
 * etc.), so this stays curated even though price/fundamentals are now live.
 *
 * Any ticker NOT in this list still works everywhere in the app (full US
 * search, live price, live chart) — it just falls back to a generic blurb
 * and a sector read directly from its live company profile.
 */
export type CuratedEntry = {
  sector: string;
  tags: string[];
  blurb: string;
};

export const CURATED_UNIVERSE: Record<string, CuratedEntry> = {
  NVDA: { sector: "Semiconductors", tags: ["ai", "semiconductors", "momentum", "large-cap"], blurb: "The AI-accelerator bellwether — GPUs for training and inference at hyperscale." },
  AMD: { sector: "Semiconductors", tags: ["ai", "semiconductors", "momentum"], blurb: "Nvidia's closest GPU rival, also riding the AI datacenter buildout." },
  AVGO: { sector: "Semiconductors", tags: ["ai", "semiconductors", "large-cap", "dividend"], blurb: "Custom AI silicon and networking chips for the biggest hyperscale buildouts." },
  INTC: { sector: "Semiconductors", tags: ["semiconductors", "value", "turnaround"], blurb: "Legacy chipmaker mid-turnaround, betting on regaining process-node leadership." },
  SMCI: { sector: "Semiconductors", tags: ["ai", "semiconductors", "high-volatility", "small-cap"], blurb: "AI server builder whose stock swings hard on supply-chain and accounting headlines." },
  MSFT: { sector: "Software", tags: ["ai", "software", "large-cap", "dividend", "low-volatility"], blurb: "Cloud + Copilot compounder — one of the biggest owners of AI infrastructure demand." },
  GOOGL: { sector: "Software", tags: ["ai", "software", "large-cap"], blurb: "Search, cloud and Gemini — one of the few companies with AI reach at every layer." },
  META: { sector: "Software", tags: ["ai", "software", "large-cap", "momentum"], blurb: "Social platforms funding an aggressive bet on AI models and custom silicon." },
  CRM: { sector: "Software", tags: ["ai", "software"], blurb: "Enterprise CRM leader pushing AI \"agentic\" tools into its core product." },
  PLTR: { sector: "Software", tags: ["ai", "software", "new-high", "momentum", "high-volatility"], blurb: "Government + enterprise AI analytics platform, priced for a lot of future growth." },
  SOUN: { sector: "Software", tags: ["ai", "software", "small-cap", "high-volatility", "under-100"], blurb: "Voice-AI micro-cap that moves double digits on retail sentiment and single headlines." },
  AAPL: { sector: "Consumer Technology", tags: ["large-cap", "dividend", "consumer", "low-volatility"], blurb: "Devices-and-services giant leaning on an installed base of 2.2B active units." },
  AMZN: { sector: "Consumer Technology", tags: ["large-cap", "momentum"], blurb: "E-commerce plus AWS — one business funds growth, the other funds the AI buildout." },
  NFLX: { sector: "Media & Entertainment", tags: ["large-cap", "momentum"], blurb: "Streaming's biggest scale player, now layering in ads and live sports." },
  DIS: { sector: "Media & Entertainment", tags: ["large-cap", "value"], blurb: "Parks-and-streaming conglomerate working through a multi-year margin turnaround." },
  TSLA: { sector: "Automotive", tags: ["ev", "automotive", "ai", "high-volatility", "momentum"], blurb: "EV maker whose story now leans on autonomy and robotics as much as car sales." },
  RIVN: { sector: "Automotive", tags: ["ev", "automotive", "small-cap", "high-volatility"], blurb: "Early-stage EV maker similar in ambition to Tesla, years behind on scale and margin." },
  F: { sector: "Automotive", tags: ["automotive", "dividend", "value", "under-100"], blurb: "Legacy automaker balancing a profitable truck business against EV losses." },
  GM: { sector: "Automotive", tags: ["automotive", "dividend", "value", "under-100"], blurb: "Detroit's other legacy automaker, similarly juggling combustion cash flow and EV bets." },
  JNJ: { sector: "Healthcare", tags: ["dividend", "healthcare", "low-volatility", "value"], blurb: "Diversified pharma/medtech dividend aristocrat — the definition of a low-drama holding." },
  UNH: { sector: "Healthcare", tags: ["healthcare", "large-cap", "quality"], blurb: "The largest US health insurer, also running one of the biggest care-delivery arms." },
  PFE: { sector: "Healthcare", tags: ["dividend", "healthcare", "value", "under-100"], blurb: "Post-pandemic pharma major resetting its pipeline after the vaccine-revenue cliff." },
  MRNA: { sector: "Healthcare", tags: ["healthcare", "high-volatility"], blurb: "mRNA-platform biotech searching for its next act beyond COVID vaccines." },
  KO: { sector: "Consumer Staples", tags: ["dividend", "consumer-staples", "low-volatility", "value", "under-100"], blurb: "Global beverage compounder that raises its dividend almost every year, for decades." },
  PEP: { sector: "Consumer Staples", tags: ["dividend", "consumer-staples", "low-volatility", "value"], blurb: "Snacks-and-beverages compounder with a similar low-drama profile to Coca-Cola." },
  PG: { sector: "Consumer Staples", tags: ["dividend", "consumer-staples", "low-volatility", "quality"], blurb: "Household-staples portfolio (Tide, Gillette, Pampers) built for pricing power." },
  WMT: { sector: "Consumer Staples", tags: ["dividend", "consumer-staples", "large-cap", "quality"], blurb: "The largest US retailer, increasingly a logistics and advertising business too." },
  COST: { sector: "Consumer Staples", tags: ["large-cap", "consumer-staples", "low-volatility", "quality"], blurb: "Membership warehouse retailer known for pricing discipline and steady comps." },
  O: { sector: "Real Estate", tags: ["dividend", "real-estate", "under-100", "value", "monthly-dividend"], blurb: '"The Monthly Dividend Company" — net-lease REIT that pays out every single month.' },
  XOM: { sector: "Energy", tags: ["dividend", "energy", "value", "under-200"], blurb: "Integrated oil major — cash-flow machine that tracks the price of crude." },
  CVX: { sector: "Energy", tags: ["dividend", "energy", "value"], blurb: "Exxon's closest peer — similarly a leveraged bet on crude and refining margins." },
  JPM: { sector: "Financials", tags: ["dividend", "financials", "large-cap", "quality"], blurb: "The largest US bank by assets, often treated as a bellwether for the sector." },
  BAC: { sector: "Financials", tags: ["dividend", "financials", "value", "under-100"], blurb: "Consumer-and-investment banking major, highly sensitive to interest-rate swings." },
  LMT: { sector: "Industrials", tags: ["dividend", "industrials", "defense", "quality"], blurb: "Defense prime contractor with revenue backed by multi-year government programs." },
};

export const CURATED_TICKERS = Object.keys(CURATED_UNIVERSE);

export function getCuratedEntry(ticker: string): CuratedEntry | undefined {
  return CURATED_UNIVERSE[ticker.toUpperCase()];
}
