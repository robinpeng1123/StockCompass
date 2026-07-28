"use client";

import { useState, useTransition } from "react";
import { runScreen, EXAMPLE_QUERIES, ScreenResult } from "@/lib/nlScreener";
import { StockCard } from "./StockCard";
import { Badge } from "./ui/Badge";

export function NaturalLanguageSearch({ compact = false }: { compact?: boolean }) {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<ScreenResult | null>(null);
  const [thinking, setThinking] = useState(false);
  const [, startTransition] = useTransition();

  function runQuery(q: string) {
    setQuery(q);
    setThinking(true);
    setResult(null);
    // Small delay sells the "AI is translating this" moment — screen itself is instant.
    window.setTimeout(() => {
      startTransition(() => {
        setResult(runScreen(q));
        setThinking(false);
      });
    }, 450);
  }

  return (
    <div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (query.trim()) runQuery(query);
        }}
        className="relative"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 18 18"
          fill="none"
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-muted"
        >
          <circle cx="8" cy="8" r="5.25" stroke="currentColor" strokeWidth="1.4" />
          <path d="M15 15L12 12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder='Try "cheap AI companies" or "stocks making new highs"'
          className="w-full rounded-2xl border border-white/10 bg-white/[0.03] py-3.5 pl-11 pr-28 text-sm text-ink-primary placeholder:text-ink-muted focus:border-accent-cyan/50 focus:outline-none focus:ring-2 focus:ring-accent-cyan/20"
        />
        <button
          type="submit"
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl bg-gradient-to-r from-accent-cyan to-accent-violet px-4 py-2 text-xs font-semibold text-plane transition-opacity hover:opacity-90"
        >
          Ask AI
        </button>
      </form>

      <div className="mt-3 flex flex-wrap gap-2">
        {EXAMPLE_QUERIES.map((ex) => (
          <button
            key={ex}
            onClick={() => runQuery(ex)}
            className="rounded-full border border-white/10 bg-white/[0.02] px-3 py-1.5 text-xs text-ink-secondary transition-colors hover:border-accent-cyan/40 hover:text-ink-primary"
          >
            {ex}
          </button>
        ))}
      </div>

      {thinking && (
        <div className="mt-6 flex items-center gap-2 text-sm text-ink-secondary">
          <span className="h-2 w-2 animate-pulse-soft rounded-full bg-accent-cyan" />
          Translating your request into a stock screen…
        </div>
      )}

      {result && !thinking && (
        <div className="mt-6">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="text-xs text-ink-muted">AI read this as:</span>
            {result.criteria.map((c) => (
              <Badge key={c} status="neutral">
                {c}
              </Badge>
            ))}
          </div>
          {result.results.length === 0 ? (
            <p className="text-sm text-ink-muted">No matches in the sample universe — try a different phrase.</p>
          ) : (
            <div className={`grid gap-3 ${compact ? "sm:grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-3"}`}>
              {result.results.map((s) => (
                <StockCard key={s.ticker} stock={s} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
