import { Pattern } from "@/lib/types";
import { Card, CardHeader } from "./ui/Card";
import { Badge } from "./ui/Badge";

const DIRECTION_STATUS = {
  bullish: "good",
  bearish: "critical",
  neutral: "warning",
} as const;

const DIRECTION_LABEL = {
  bullish: "Bullish signal",
  bearish: "Bearish signal",
  neutral: "Neutral / wait-and-see",
} as const;

export function PatternCard({ pattern, ticker }: { pattern: Pattern; ticker: string }) {
  const status = DIRECTION_STATUS[pattern.direction];
  return (
    <Card glow="cyan">
      <CardHeader
        eyebrow={`${ticker} · Detected ${pattern.detectedOn}`}
        title="AI Pattern Detection"
        icon={<PatternIcon />}
        action={<Badge status={status}>{DIRECTION_LABEL[pattern.direction]}</Badge>}
      />

      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <div>
          <div className="text-xl font-semibold text-ink-primary">{pattern.name}</div>
          <div className="text-xs text-ink-muted">Chart pattern</div>
        </div>
        <div className="flex items-center gap-3">
          <ConfidenceRing pct={pattern.confidencePct} />
          <div>
            <div className="text-xs text-ink-muted">Confidence</div>
            <div className="text-lg font-semibold tabular-nums text-ink-primary">{pattern.confidencePct}%</div>
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
        <div className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-ink-muted">Why it matters</div>
        <p className="text-sm leading-relaxed text-ink-secondary">{pattern.explanation}</p>
      </div>

      <div className="mt-3 flex items-start gap-2.5 rounded-xl border border-accent-cyan/15 bg-accent-cyan/[0.05] p-4">
        <HistoryIcon />
        <p className="text-sm leading-relaxed text-ink-primary">{pattern.historicalStat}</p>
      </div>
    </Card>
  );
}

function ConfidenceRing({ pct }: { pct: number }) {
  const r = 18;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - pct / 100);
  return (
    <svg width="46" height="46" viewBox="0 0 46 46" className="-rotate-90">
      <circle cx="23" cy="23" r={r} stroke="rgba(255,255,255,0.08)" strokeWidth="4" fill="none" />
      <circle
        cx="23"
        cy="23"
        r={r}
        stroke="#22e5ff"
        strokeWidth="4"
        fill="none"
        strokeDasharray={c}
        strokeDashoffset={offset}
        strokeLinecap="round"
      />
    </svg>
  );
}

function PatternIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M2 13l4-6 3 3 3-5 4 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function HistoryIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="mt-0.5 shrink-0 text-accent-cyan">
      <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M8 4.5V8l2.4 1.6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
