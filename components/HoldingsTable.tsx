import Link from "next/link";
import { computePortfolio } from "@/lib/portfolio";
import { sectorColor } from "@/lib/sectorColors";
import { LiveHoldingCells } from "./ui/LiveHoldingCells";

type PortfolioData = Awaited<ReturnType<typeof computePortfolio>>;

export async function HoldingsTable({ holdings: holdingsProp }: { holdings?: PortfolioData["holdings"] }) {
  const holdings = holdingsProp ?? (await computePortfolio()).holdings;
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-sm">
        <thead>
          <tr className="border-b border-white/[0.08] text-left text-[11px] uppercase tracking-wide text-ink-muted">
            <th className="py-2 pr-3 font-medium">Ticker</th>
            <th className="py-2 pr-3 font-medium">Sector</th>
            <th className="py-2 pr-3 text-right font-medium">Shares</th>
            <th className="py-2 pr-3 text-right font-medium">Price</th>
            <th className="py-2 pr-3 text-right font-medium">Market value</th>
            <th className="py-2 pl-3 text-right font-medium">Gain/loss</th>
          </tr>
        </thead>
        <tbody>
          {holdings.map((h) => (
            <tr key={h.ticker} className="border-b border-white/[0.04] last:border-0">
              <td className="py-2.5 pr-3">
                <Link href={`/stock/${h.ticker}`} className="font-semibold text-ink-primary hover:text-accent-cyan">
                  {h.ticker}
                </Link>
                <div className="text-[11px] text-ink-muted">{h.name}</div>
              </td>
              <td className="py-2.5 pr-3">
                <span className="inline-flex items-center gap-1.5 text-xs text-ink-secondary">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: sectorColor(h.sector) }} />
                  {h.sector}
                </span>
              </td>
              <td className="py-2.5 pr-3 text-right tabular-nums text-ink-secondary">{h.shares}</td>
              <LiveHoldingCells ticker={h.ticker} shares={h.shares} costBasis={h.costBasis} price={h.price} prevClose={h.stock.prevClose} />
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
