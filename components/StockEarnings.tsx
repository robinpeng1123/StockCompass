import { FinnhubEarning } from "@/lib/finnhub";
import { Card, CardHeader } from "./ui/Card";
import { Badge } from "./ui/Badge";

function formatPeriod(period: string) {
  const d = new Date(period + "T00:00:00Z");
  if (Number.isNaN(d.getTime())) return period;
  return d.toLocaleDateString("en-US", { month: "short", year: "numeric", timeZone: "UTC" });
}

export function StockEarnings({ ticker, earnings }: { ticker: string; earnings: FinnhubEarning[] }) {
  return (
    <Card>
      <CardHeader eyebrow={ticker} title="Recent Earnings" icon={<EarningsIcon />} />
      {earnings.length === 0 ? (
        <p className="text-sm text-ink-muted">No recent earnings history found for {ticker}.</p>
      ) : (
        <ul className="space-y-3.5">
          {earnings.slice(0, 6).map((e, i) => {
            const beat = e.surprisePercent !== null && e.surprisePercent > 0.5;
            const missed = e.surprisePercent !== null && e.surprisePercent < -0.5;
            const status = beat ? "good" : missed ? "critical" : "neutral";
            return (
              <li key={i} className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-medium text-ink-primary">
                    Q{e.quarter} {e.year}
                  </div>
                  <div className="text-[11px] text-ink-muted">{formatPeriod(e.period)}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs tabular-nums text-ink-secondary">
                    {e.actual !== null ? `$${e.actual.toFixed(2)}` : "—"}
                    <span className="text-ink-muted"> vs est. {e.estimate !== null ? `$${e.estimate.toFixed(2)}` : "—"}</span>
                  </div>
                  {e.surprisePercent !== null && (
                    <Badge status={status} className="mt-1 px-1.5 py-0.5 text-[10px]">
                      {beat ? "Beat" : missed ? "Missed" : "In line"} {e.surprisePercent >= 0 ? "+" : ""}
                      {e.surprisePercent.toFixed(1)}%
                    </Badge>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

function EarningsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M3 14.5V8M8 14.5V4.5M13 14.5v-7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M2 14.5h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
