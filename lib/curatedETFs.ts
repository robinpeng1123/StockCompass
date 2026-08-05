/**
 * A hand-curated list of well-known ETFs for the "ETFs" browse page — same
 * idea as curatedUniverse.ts's stock list (plain-English blurb + category
 * tags no market-data API supplies), kept in its own file and NOT folded
 * into CURATED_TICKERS so ETFs don't start surfacing inside the individual-
 * stock thematic screener/dashboard universe. getLiveStock still checks
 * this list too, so an ETF's own detail page gets the same curated
 * treatment (real blurb, sensible category, no "Full-market listing" badge)
 * as any curated stock.
 */
export type CuratedETFEntry = {
  category: string;
  tags: string[];
  blurb: string;
};

export const CURATED_ETFS: Record<string, CuratedETFEntry> = {
  SPY: { category: "Broad Market", tags: ["broad-market", "large-cap"], blurb: "Tracks the S&P 500 — the original, most-traded US large-cap index ETF." },
  VOO: { category: "Broad Market", tags: ["broad-market", "large-cap", "low-cost"], blurb: "Vanguard's S&P 500 tracker, functionally identical to SPY at a lower expense ratio." },
  IVV: { category: "Broad Market", tags: ["broad-market", "large-cap", "low-cost"], blurb: "iShares' S&P 500 tracker — the third major fund chasing the same index as SPY and VOO." },
  VTI: { category: "Broad Market", tags: ["broad-market", "total-market"], blurb: "Total US stock market in one fund — large, mid, and small caps together." },
  QQQ: { category: "Broad Market", tags: ["broad-market", "large-cap", "tech-heavy", "momentum"], blurb: "Tracks the Nasdaq-100 — mega-cap tech-heavy, more concentrated than the S&P 500." },
  DIA: { category: "Broad Market", tags: ["broad-market", "large-cap"], blurb: "Tracks the Dow Jones Industrial Average's 30 blue-chip names." },
  IWM: { category: "Broad Market", tags: ["small-cap", "high-volatility"], blurb: "Tracks the Russell 2000 — small-cap US stocks, choppier than large-cap funds." },
  VXUS: { category: "International", tags: ["international", "diversification"], blurb: "Everything outside the US in one fund — developed and emerging markets combined." },
  EFA: { category: "International", tags: ["international", "developed-markets"], blurb: "Developed international markets (Europe, Australasia, Far East), excluding the US and Canada." },
  EEM: { category: "International", tags: ["international", "emerging-markets", "high-volatility"], blurb: "Emerging-market stocks — higher growth potential, higher currency and political risk." },
  XLK: { category: "Sector · Technology", tags: ["sector", "technology"], blurb: "S&P 500 technology-sector stocks only — a concentrated bet on one industry." },
  XLF: { category: "Sector · Financials", tags: ["sector", "financials"], blurb: "S&P 500 financial-sector stocks — banks, insurers, payment networks." },
  XLE: { category: "Sector · Energy", tags: ["sector", "energy", "high-volatility"], blurb: "S&P 500 energy-sector stocks — swings with oil and gas prices." },
  XLV: { category: "Sector · Healthcare", tags: ["sector", "healthcare", "defensive"], blurb: "S&P 500 healthcare-sector stocks — pharma, insurers, medical devices." },
  XLY: { category: "Sector · Consumer", tags: ["sector", "consumer"], blurb: "S&P 500 consumer-discretionary stocks — retail, autos, restaurants." },
  VYM: { category: "Dividend", tags: ["dividend", "income"], blurb: "High-dividend-yield US stocks across sectors, built for income over growth." },
  SCHD: { category: "Dividend", tags: ["dividend", "income", "quality", "low-cost"], blurb: "Dividend-growth screen — companies with a track record of raising payouts, not just a high yield." },
  BND: { category: "Bonds", tags: ["bonds", "income", "defensive"], blurb: "Total US bond market — investment-grade government and corporate debt." },
  AGG: { category: "Bonds", tags: ["bonds", "income", "defensive"], blurb: "Broad investment-grade US bond index, similar mandate to BND." },
  TLT: { category: "Bonds", tags: ["bonds", "long-duration", "high-volatility"], blurb: "Long-dated (20+ year) US Treasuries — much more rate-sensitive than short-term bond funds." },
  GLD: { category: "Commodities", tags: ["commodities", "gold", "hedge"], blurb: "Physically-backed gold — a traditional hedge against inflation and market stress." },
  SLV: { category: "Commodities", tags: ["commodities", "silver", "high-volatility"], blurb: "Physically-backed silver — smaller market than gold, so prices swing harder." },
  USO: { category: "Commodities", tags: ["commodities", "oil", "high-volatility"], blurb: "Tracks crude oil futures — direct energy-price exposure without owning a barrel." },
  ARKK: { category: "Thematic", tags: ["thematic", "innovation", "high-volatility"], blurb: "Actively managed bet on disruptive-innovation stocks — high conviction, high volatility." },
  ICLN: { category: "Thematic", tags: ["thematic", "clean-energy", "high-volatility"], blurb: "Global clean-energy and renewables companies in one fund." },
};

export const CURATED_ETF_TICKERS = Object.keys(CURATED_ETFS);

export function getCuratedETFEntry(ticker: string): CuratedETFEntry | undefined {
  return CURATED_ETFS[ticker.toUpperCase()];
}
