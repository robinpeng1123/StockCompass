import { COACH_TIPS } from "@/lib/mockData";
import { Card, CardHeader } from "./ui/Card";
import { Badge } from "./ui/Badge";

const KIND_META = {
  warning: { status: "warning", label: "Behavior flag" },
  good: { status: "good", label: "Nice work" },
  lesson: { status: "neutral", label: "Lesson" },
} as const;

export function AICoachPanel() {
  return (
    <Card glow="violet">
      <CardHeader eyebrow="AI Trading Coach" title="Learn from your own trades" icon={<BrainIcon />} />
      <div className="space-y-3">
        {COACH_TIPS.map((tip) => {
          const meta = KIND_META[tip.kind];
          return (
            <div key={tip.id} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3.5">
              <div className="mb-1.5 flex items-center gap-2">
                <Badge status={meta.status}>{meta.label}</Badge>
              </div>
              <div className="text-sm font-medium text-ink-primary">{tip.title}</div>
              <p className="mt-1 text-xs leading-relaxed text-ink-secondary">{tip.detail}</p>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

function BrainIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path
        d="M7 3.2c-1.9 0-3.2 1.5-3 3.2-1 .5-1.6 1.6-1.4 2.8-.8.7-1 1.9-.3 2.9.4 1.5 1.9 2.4 3.4 2.1.5.9 1.5 1.4 2.5 1.2V3.2Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      <path
        d="M11 3.2c1.9 0 3.2 1.5 3 3.2 1 .5 1.6 1.6 1.4 2.8.8.7 1 1.9.3 2.9-.4 1.5-1.9 2.4-3.4 2.1-.5.9-1.5 1.4-2.5 1.2V3.2Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
    </svg>
  );
}
