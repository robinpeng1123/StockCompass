import { Stock } from "./types";
import { WatchlistEntry } from "./watchlist";

export type EnrichedHolding = WatchlistEntry & {
  name: string;
  sector: string;
  price: number;
  marketValue: number;
  costValue: number;
  gainUSD: number;
  gainPct: number;
  stock: Stock;
};

export type SectorSlice = { sector: string; valueUSD: number; pct: number };

export type PortfolioStats = {
  holdings: EnrichedHolding[];
  totalValue: number;
  totalCost: number;
  totalGainUSD: number;
  totalGainPct: number;
  sectors: SectorSlice[];
  topSector: SectorSlice | null;
  correlatedPct: number;
  avgRisk: number;
  avgVolatility: number;
};

const EMPTY: PortfolioStats = {
  holdings: [],
  totalValue: 0,
  totalCost: 0,
  totalGainUSD: 0,
  totalGainPct: 0,
  sectors: [],
  topSector: null,
  correlatedPct: 0,
  avgRisk: 0,
  avgVolatility: 0,
};

/**
 * Pure, client-safe port of the stats the old server-side computePortfolio
 * produced — now derived from whatever the user has actually added to their
 * localStorage watchlist, plus the live Stock data fetched for each ticker.
 */
export function computePortfolioStats(entries: WatchlistEntry[], stocks: Record<string, Stock>): PortfolioStats {
  const enriched: EnrichedHolding[] = entries
    .map((e) => {
      const stock = stocks[e.ticker];
      if (!stock) return null;
      const marketValue = e.shares * stock.price;
      const costValue = e.shares * e.costBasis;
      const gainUSD = marketValue - costValue;
      const gainPct = costValue ? (gainUSD / costValue) * 100 : 0;
      return { ...e, name: stock.name, sector: stock.sector, price: stock.price, marketValue, costValue, gainUSD, gainPct, stock };
    })
    .filter((h): h is EnrichedHolding => h !== null);

  const totalValue = enriched.reduce((sum, h) => sum + h.marketValue, 0);
  const totalCost = enriched.reduce((sum, h) => sum + h.costValue, 0);

  if (enriched.length === 0 || totalValue === 0) {
    return { ...EMPTY, holdings: enriched };
  }

  const sectorMap = new Map<string, number>();
  for (const h of enriched) sectorMap.set(h.sector, (sectorMap.get(h.sector) ?? 0) + h.marketValue);
  const sectors: SectorSlice[] = Array.from(sectorMap.entries())
    .map(([sector, valueUSD]) => ({ sector, valueUSD, pct: (valueUSD / totalValue) * 100 }))
    .sort((a, b) => b.pct - a.pct);

  const topSector = sectors[0];
  const correlatedValue = enriched
    .filter((h) => h.sector === topSector.sector || h.stock.tags.includes("ai"))
    .reduce((sum, h) => sum + h.marketValue, 0);
  const correlatedPct = (correlatedValue / totalValue) * 100;

  const avgRisk = enriched.reduce((sum, h) => sum + h.stock.risk * h.marketValue, 0) / totalValue;
  const avgVolatility = enriched.reduce((sum, h) => sum + h.stock.volatility * h.marketValue, 0) / totalValue;

  return {
    holdings: enriched,
    totalValue,
    totalCost,
    totalGainUSD: totalValue - totalCost,
    totalGainPct: totalCost ? ((totalValue - totalCost) / totalCost) * 100 : 0,
    sectors,
    topSector,
    correlatedPct,
    avgRisk,
    avgVolatility,
  };
}
