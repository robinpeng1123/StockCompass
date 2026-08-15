import { getMarketStatus } from "@/lib/marketHours";
import { Card, CardHeader } from "./ui/Card";
import { Badge } from "./ui/Badge";
import { Meter } from "./ui/Meter";

function minutesToDuration(totalMin: number): string {
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h <= 0) return `${m}m`;
  return `${h}h ${m}m`;
}

/**
 * Real US equity market hours (9:30 AM–4:00 PM ET, weekdays) computed from
 * the actual current time — not the "Markets open · simulated" badge in the
 * header, which is a static illustrative label. This one is genuinely live.
 */
export function MarketSchedule() {
  const status = getMarketStatus();

  return (
    <Card>
      <CardHeader
        eyebrow="US Equities"
        title="Market Schedule"
        icon={<CalendarIcon />}
        action={<Badge status={status.isOpen ? "good" : "neutral"}>{status.isOpen ? "Open now" : "Closed"}</Badge>}
      />

      {status.isOpen ? (
        <Meter
          label="Today's session"
          value={status.sessionProgressPct}
          color="status-good"
          helper={`Closes at 4:00 PM ET — ${minutesToDuration(status.minutesUntilClose)} left`}
        />
      ) : (
        <p className="text-sm text-ink-secondary">
          Next open: <span className="font-semibold text-ink-primary">{status.nextOpenLabel}</span>
        </p>
      )}

      <p className="mt-3 text-[11px] text-ink-muted">Regular hours: 9:30 AM – 4:00 PM ET, Monday–Friday.</p>
    </Card>
  );
}

function CalendarIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <rect x="2.5" y="3.5" width="13" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M2.5 7h13M6 2v3M12 2v3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}
