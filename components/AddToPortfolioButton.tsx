"use client";

import { useState } from "react";
import { useWatchlist } from "@/lib/useWatchlist";

export function AddToPortfolioButton({ ticker, price }: { ticker: string; price: number }) {
  const { entries, add, remove, loading } = useWatchlist();
  const [expanded, setExpanded] = useState(false);
  const [shares, setShares] = useState("10");

  if (loading) return null;

  const held = entries.find((e) => e.ticker === ticker.toUpperCase());

  if (held) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-status-good/25 bg-status-good/[0.06] px-3 py-2 text-xs font-medium text-status-good">
        <CheckIcon />
        In your portfolio ({held.shares} shares)
        <button onClick={() => remove(ticker)} className="ml-1 text-ink-muted underline hover:text-status-critical">
          Remove
        </button>
      </div>
    );
  }

  if (!expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-semibold text-ink-primary hover:border-accent-cyan/40 hover:text-accent-cyan"
      >
        <PlusIcon />
        Add to Portfolio
      </button>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const n = Number(shares);
        if (n > 0) {
          add(ticker, n, price);
          setExpanded(false);
        }
      }}
      className="flex items-center gap-2"
    >
      <input
        type="number"
        min="0"
        step="any"
        autoFocus
        value={shares}
        onChange={(e) => setShares(e.target.value)}
        className="w-20 rounded-xl border border-white/10 bg-white/[0.03] px-2.5 py-2 text-xs text-ink-primary focus:border-accent-cyan/50 focus:outline-none focus:ring-2 focus:ring-accent-cyan/20"
      />
      <span className="text-[11px] text-ink-muted">shares @ {price ? `$${price.toFixed(2)}` : "—"}</span>
      <button type="submit" className="rounded-xl bg-gradient-to-r from-accent-cyan to-accent-violet px-3 py-2 text-xs font-semibold text-plane hover:opacity-90">
        Confirm
      </button>
      <button type="button" onClick={() => setExpanded(false)} className="text-xs text-ink-muted hover:text-ink-primary">
        Cancel
      </button>
    </form>
  );
}

function PlusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M7 2.5v9M2.5 7h9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M2.5 7.5l3 3 6-6.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
