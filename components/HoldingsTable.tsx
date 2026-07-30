"use client";

import Link from "next/link";
import { useWatchlist } from "@/lib/useWatchlist";
import { sectorColor } from "@/lib/sectorColors";
import { AddStockForm } from "./AddStockForm";
import { LiveHoldingCells } from "./ui/LiveHoldingCells";

export function HoldingsTable() {
  const { entries, stats, loading, add, remove } = useWatchlist();

  return (
    <div>
      <AddStockForm onAdd={add} />

      <div className="mt-5">
        {loading ? (
          <p className="text-sm text-ink-muted">Loading your positions…</p>
        ) : entries.length === 0 ? (
          <p className="text-sm text-ink-muted">
            No positions yet — search for a stock above to add it. Leave cost basis blank to track from today's price.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-sm">
              <thead>
                <tr className="border-b border-white/[0.08] text-left text-[11px] uppercase tracking-wide text-ink-muted">
                  <th className="py-2 pr-3 font-medium">Ticker</th>
                  <th className="py-2 pr-3 font-medium">Sector</th>
                  <th className="py-2 pr-3 text-right font-medium">Shares</th>
                  <th className="py-2 pr-3 text-right font-medium">Price</th>
                  <th className="py-2 pr-3 text-right font-medium">Market value</th>
                  <th className="py-2 pl-3 text-right font-medium">Gain/loss</th>
                  <th className="py-2 pl-3 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {stats.holdings.map((h) => (
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
                    <td className="py-2.5 pl-3 text-right">
                      <button
                        onClick={() => remove(h.ticker)}
                        className="rounded-lg px-2 py-1 text-[11px] font-medium text-ink-muted hover:bg-white/[0.05] hover:text-status-critical"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
