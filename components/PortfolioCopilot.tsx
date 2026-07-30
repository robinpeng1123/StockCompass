"use client";

import { useWatchlist } from "@/lib/useWatchlist";
import { Card, CardHeader } from "./ui/Card";
import { Badge } from "./ui/Badge";
import { AddStockForm } from "./AddStockForm";

export function PortfolioCopilot({ compact = false }: { compact?: boolean }) {
  const { entries, stats, loading, add } = useWatchlist();
  const { topSector, correlatedPct, avgRisk, avgVolatility, totalGainPct } = stats;

  if (loading) {
    return (
      <Card>
        <CardHeader eyebrow="Portfolio Copilot" title="What your portfolio is telling you" icon={<CopilotIcon />} />
        <p className="text-sm text-ink-muted">Loading your portfolio…</p>
      </Card>
    );
  }

  if (entries.length === 0 || !topSector) {
    return (
      <Card>
        <CardHeader eyebrow="Portfolio Copilot" title="What your portfolio is telling you" icon={<CopilotIcon />} />
        <p className="mb-4 text-sm leading-relaxed text-ink-secondary">
          Your portfolio is empty. Add your first stock below — the AI Copilot will explain your sector
          concentration and risk once there's something to analyze.
        </p>
        <AddStockForm onAdd={add} />
      </Card>
    );
  }

  const concentrationLevel = topSector.pct >= 40 ? "critical" : topSector.pct >= 28 ? "warning" : "good";

  return (
    <Card>
      <CardHeader
        eyebrow="Portfolio Copilot"
        title="What your portfolio is telling you"
        icon={<CopilotIcon />}
        action={<Badge status={concentrationLevel}>{concentrationLevel === "good" ? "Well diversified" : "Concentration risk"}</Badge>}
      />

      <p className="text-sm leading-relaxed text-ink-primary">
        Your portfolio is{" "}
        <span className="font-semibold text-accent-cyan">{topSector.pct.toFixed(0)}% concentrated</span> in{" "}
        <span className="font-semibold">{topSector.sector}</span>. A downturn in that sector alone could pressure
        roughly <span className="font-semibold text-status-warning">{correlatedPct.toFixed(0)}%</span> of your total
        holdings once correlated AI-linked names are counted. Consider reviewing your sector exposure.
      </p>

      {!compact && (
        <div className="mt-4 grid grid-cols-3 gap-3">
          <MiniStat label="Avg. risk score" value={`${Math.round(avgRisk)}/100`} />
          <MiniStat label="Avg. volatility" value={`${Math.round(avgVolatility)}/100`} />
          <MiniStat
            label="Total return"
            value={`${totalGainPct >= 0 ? "+" : ""}${totalGainPct.toFixed(1)}%`}
            tone={totalGainPct >= 0 ? "good" : "critical"}
          />
        </div>
      )}
    </Card>
  );
}

function MiniStat({ label, value, tone }: { label: string; value: string; tone?: "good" | "critical" }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
      <div className="text-[10px] font-medium uppercase tracking-wide text-ink-muted">{label}</div>
      <div
        className={`mt-1 text-base font-semibold tabular-nums ${
          tone === "good" ? "text-status-good" : tone === "critical" ? "text-status-critical" : "text-ink-primary"
        }`}
      >
        {value}
      </div>
    </div>
  );
}

function CopilotIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <rect x="2.5" y="4" width="13" height="9" rx="2.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M6 4V2.5M12 4V2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="6.5" cy="8.5" r="1" fill="currentColor" />
      <circle cx="11.5" cy="8.5" r="1" fill="currentColor" />
    </svg>
  );
}
