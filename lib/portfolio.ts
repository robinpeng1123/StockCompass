import { HOLDINGS } from "./mockData";
import { getStock } from "./mockData";

export type SectorSlice = { sector: string; valueUSD: number; pct: number };

export function computePortfolio() {
  const enriched = HOLDINGS.map((h) => {
    const marketValue = h.shares * h.price;
    const costValue = h.shares * h.costBasis;
    const gainUSD = marketValue - costValue;
    const gainPct = (gainUSD / costValue) * 100;
    const stock = getStock(h.ticker);
    return { ...h, marketValue, costValue, gainUSD, gainPct, stock };
  });

  const totalValue = enriched.reduce((sum, h) => sum + h.marketValue, 0);
  const totalCost = enriched.reduce((sum, h) => sum + h.costValue, 0);

  const sectorMap = new Map<string, number>();
  for (const h of enriched) {
    sectorMap.set(h.sector, (sectorMap.get(h.sector) ?? 0) + h.marketValue);
  }
  const sectors: SectorSlice[] = Array.from(sectorMap.entries())
    .map(([sector, valueUSD]) => ({ sector, valueUSD, pct: (valueUSD / totalValue) * 100 }))
    .sort((a, b) => b.pct - a.pct);

  const topSector = sectors[0];

  // Sympathetic exposure: holdings that would likely move together with the
  // top sector even if not classified in it (e.g. AI-tagged software next to semis).
  const correlatedValue = enriched
    .filter((h) => h.sector === topSector.sector || h.stock?.tags.includes("ai"))
    .reduce((sum, h) => sum + h.marketValue, 0);
  const correlatedPct = (correlatedValue / totalValue) * 100;

  const avgRisk = enriched.reduce((sum, h) => sum + (h.stock?.risk ?? 50) * h.marketValue, 0) / totalValue;
  const avgVolatility = enriched.reduce((sum, h) => sum + (h.stock?.volatility ?? 50) * h.marketValue, 0) / totalValue;

  return {
    holdings: enriched,
    totalValue,
    totalCost,
    totalGainUSD: totalValue - totalCost,
    totalGainPct: ((totalValue - totalCost) / totalCost) * 100,
    sectors,
    topSector,
    correlatedPct,
    avgRisk,
    avgVolatility,
  };
}
