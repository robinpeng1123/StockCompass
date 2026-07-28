"use client";

import { useState } from "react";
import { NEWS } from "@/lib/mockData";
import { Card, CardHeader } from "./ui/Card";
import Link from "next/link";

const SENTIMENT_COLOR = {
  positive: "#0ca30c",
  negative: "#d03b3b",
  neutral: "#5b6580",
} as const;

function timeAgo(min: number) {
  if (min < 60) return `${min}m ago`;
  return `${Math.round(min / 60)}h ago`;
}

export function TrendingNews() {
  const [expanded, setExpanded] = useState(false);
  const items = expanded ? NEWS : NEWS.slice(0, 5);

  return (
    <Card>
      <CardHeader eyebrow="Trending" title="What the market's talking about" icon={<PulseIcon />} />
      <ul className="space-y-3">
        {items.map((n) => (
          <li key={n.id}>
            <Link href={`/stock/${n.ticker}`} className="group flex items-start gap-2.5">
              <span
                className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                style={{ backgroundColor: SENTIMENT_COLOR[n.sentiment] }}
              />
              <div className="min-w-0">
                <p className="text-sm leading-snug text-ink-primary group-hover:text-accent-cyan">
                  <span className="font-semibold">{n.ticker}</span> · {n.headline}
                </p>
                <span className="text-[11px] text-ink-muted">{timeAgo(n.minutesAgo)}</span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
      <button
        onClick={() => setExpanded((e) => !e)}
        className="mt-3 text-xs font-medium text-accent-cyan/90 hover:text-accent-cyan"
      >
        {expanded ? "Show less" : `Show ${NEWS.length - items.length} more`}
      </button>
    </Card>
  );
}

function PulseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M2 9h3l1.5-4L9.5 14 11 9h5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
