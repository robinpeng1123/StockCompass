"use client";

import { useState } from "react";
import Link from "next/link";
import { GlossaryTerm } from "@/lib/types";
import { cx } from "@/lib/utils";

export function GlossaryCard({ term }: { term: GlossaryTerm }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="glass-panel overflow-hidden">
      <button onClick={() => setOpen((o) => !o)} className="flex w-full items-center justify-between gap-3 p-4 text-left">
        <div>
          <div className="text-sm font-semibold text-ink-primary">{term.term}</div>
          <div className="mt-0.5 text-xs text-ink-secondary">{term.short}</div>
        </div>
        <svg
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          className={cx("shrink-0 text-ink-muted transition-transform", open && "rotate-180")}
        >
          <path d="M3 5l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && (
        <div className="border-t border-white/[0.06] bg-white/[0.02] p-4">
          <p className="text-sm leading-relaxed text-ink-secondary">{term.detail}</p>
          <div className="mt-3 rounded-lg border border-accent-cyan/15 bg-accent-cyan/[0.05] p-3">
            <p className="text-xs leading-relaxed text-ink-primary">{term.example}</p>
            <Link
              href={`/stock/${term.relatedTicker}`}
              className="mt-1.5 inline-flex items-center gap-1 text-xs font-semibold text-accent-cyan hover:underline"
            >
              See it live on {term.relatedTicker} →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
