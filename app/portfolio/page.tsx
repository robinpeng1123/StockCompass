import { Card, CardHeader } from "@/components/ui/Card";
import { PortfolioCopilot } from "@/components/PortfolioCopilot";
import { SectorAllocationChart } from "@/components/SectorAllocationChart";
import { HoldingsTable } from "@/components/HoldingsTable";
import { computePortfolio } from "@/lib/portfolio";
import { formatPrice, signed } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function PortfolioPage() {
  const portfolio = await computePortfolio();
  const { totalValue, totalGainUSD, totalGainPct, sectors, topSector, holdings } = portfolio;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink-primary">Portfolio Copilot</h1>
        <p className="mt-1 text-sm text-ink-secondary">
          Not just tracking performance — explaining it, and flagging what to watch.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <div className="text-xs font-medium text-ink-muted">Total portfolio value</div>
          <div className="mt-1 text-2xl font-semibold tabular-nums text-ink-primary">{formatPrice(totalValue)}</div>
        </Card>
        <Card>
          <div className="text-xs font-medium text-ink-muted">Unrealized gain / loss</div>
          <div
            className={`mt-1 text-2xl font-semibold tabular-nums ${
              totalGainUSD >= 0 ? "text-status-good" : "text-status-critical"
            }`}
          >
            {totalGainUSD >= 0 ? "+" : ""}
            {formatPrice(totalGainUSD)}
          </div>
          <div className={`text-xs font-medium ${totalGainPct >= 0 ? "text-status-good" : "text-status-critical"}`}>
            {signed(totalGainPct, 1)}% overall
          </div>
        </Card>
        <Card>
          <div className="text-xs font-medium text-ink-muted">Largest sector exposure</div>
          <div className="mt-1 text-2xl font-semibold tabular-nums text-ink-primary">{topSector.pct.toFixed(0)}%</div>
          <div className="text-xs text-ink-secondary">{topSector.sector}</div>
        </Card>
      </div>

      <PortfolioCopilot data={portfolio} />

      <Card>
        <CardHeader eyebrow="Allocation" title="Sector concentration" />
        <SectorAllocationChart sectors={sectors} totalValue={totalValue} />
      </Card>

      <Card>
        <CardHeader eyebrow="Holdings" title="All positions" />
        <HoldingsTable holdings={holdings} />
      </Card>
    </div>
  );
}
