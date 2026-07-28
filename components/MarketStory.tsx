import { StoryEvent } from "@/lib/types";
import { Card, CardHeader } from "./ui/Card";
import { signed } from "@/lib/utils";

const KIND_STYLE: Record<StoryEvent["kind"], { color: string; label: string }> = {
  news: { color: "#3987e5", label: "News" },
  earnings: { color: "#9085e9", label: "Earnings" },
  technical: { color: "#199e70", label: "Technical" },
  macro: { color: "#c98500", label: "Macro" },
  product: { color: "#d55181", label: "Product" },
  analyst: { color: "#e66767", label: "Analyst" },
};

export function MarketStory({ ticker, events }: { ticker: string; events: StoryEvent[] }) {
  return (
    <Card>
      <CardHeader eyebrow={ticker} title="Market Storytelling" icon={<TimelineIcon />} />
      <p className="mb-4 text-xs text-ink-muted">Why the stock actually moved — news, earnings and technicals, on one timeline.</p>

      <div className="space-y-0">
        {events.map((e, i) => {
          const style = KIND_STYLE[e.kind];
          const isLast = i === events.length - 1;
          return (
            <div key={i} className="relative flex gap-3 pb-5 last:pb-0">
              {!isLast && <div className="absolute left-[5px] top-3 h-full w-px bg-white/[0.08]" />}
              <div className="relative z-10 mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ring-2 ring-surface" style={{ backgroundColor: style.color }} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-medium text-ink-muted">{e.date}</span>
                  <span className="rounded-full px-1.5 py-0.5 text-[10px] font-medium" style={{ backgroundColor: `${style.color}22`, color: style.color }}>
                    {style.label}
                  </span>
                  <span
                    className={`text-xs font-semibold tabular-nums ${e.priceImpactPct >= 0 ? "text-status-good" : "text-status-critical"}`}
                  >
                    {signed(e.priceImpactPct, 1)}%
                  </span>
                </div>
                <div className="mt-0.5 text-sm font-medium text-ink-primary">{e.title}</div>
                <p className="mt-0.5 text-xs leading-relaxed text-ink-secondary">{e.detail}</p>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function TimelineIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M2 5h14M2 9h14M2 13h9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="16" cy="13" r="1.4" fill="currentColor" />
    </svg>
  );
}
