"use client";

import { Card, CardHeader } from "@/components/ui/Card";
import { PortfolioCopilot } from "@/components/PortfolioCopilot";
import { SectorAllocationChart } from "@/components/SectorAllocationChart";
import { HoldingsTable } from "@/components/HoldingsTable";
import { useWatchlist } from "@/lib/useWatchlist";
import { formatPrice, signed } from "@/lib/utils";

export default function PortfolioPage() {
  const { stats, loading } = useWatchlist();
  const { totalValue, totalGainUSD, totalGainPct, sectors, topSector } = stats;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink-primary">Portfolio Copilot</h1>
        <p className="mt-1 text-sm text-ink-secondary">
          Not just tracking performance — explaining it, and flagging what to watch. Your portfolio lives in this
          browser only — add stocks below to build it.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <div className="text-xs font-medium text-ink-muted">Total portfolio value</div>
          <div className="mt-1 text-2xl font-semibold tabular-nums text-ink-primary">{loading ? "—" : formatPrice(totalValue)}</div>
        </Card>
        <Card>
          <div className="text-xs font-medium text-ink-muted">Unrealized gain / loss</div>
          <div
            className={`mt-1 text-2xl font-semibold tabular-nums ${
              totalGainUSD >= 0 ? "text-status-good" : "text-status-critical"
            }`}
          >
            {loading ? "—" : `${totalGainUSD >= 0 ? "+" : ""}${formatPrice(totalGainUSD)}`}
          </div>
          {!loading && (
            <div className={`text-xs font-medium ${totalGainPct >= 0 ? "text-status-good" : "text-status-critical"}`}>
              {signed(totalGainPct, 1)}% overall
            </div>
          )}
        </Card>
        <Card>
          <div className="text-xs font-medium text-ink-muted">Largest sector exposure</div>
          <div className="mt-1 text-2xl font-semibold tabular-nums text-ink-primary">
            {loading || !topSector ? "—" : `${topSector.pct.toFixed(0)}%`}
          </div>
          <div className="text-xs text-ink-secondary">{topSector?.sector ?? "No holdings yet"}</div>
        </Card>
      </div>

      <PortfolioCopilot />

      <Card>
        <CardHeader eyebrow="Allocation" title="Sector concentration" />
        <SectorAllocationChart sectors={sectors} totalValue={totalValue} />
      </Card>

      <Card>
        <CardHeader eyebrow="Holdings" title="All positions" />
        <HoldingsTable />
      </Card>
    </div>
  );
}
