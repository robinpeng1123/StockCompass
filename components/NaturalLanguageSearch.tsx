"use client";

import { useEffect, useState } from "react";
import { runScreen } from "@/lib/nlScreener";
import { Stock } from "@/lib/types";
import { StockCard } from "./StockCard";
import { Badge } from "./ui/Badge";

type Status = "idle" | "loading-universe" | "searching" | "done" | "error";

export function NaturalLanguageSearch({ compact = false }: { compact?: boolean }) {
  const [query, setQuery] = useState("");
  const [universe, setUniverse] = useState<Stock[] | null>(null);
  const [criteria, setCriteria] = useState<string[]>([]);
  const [results, setResults] = useState<Stock[]>([]);
  const [directMatch, setDirectMatch] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/universe")
      .then((r) => r.json())
      .then((data) => setUniverse(data.stocks ?? []))
      .catch(() => setUniverse([]));
  }, []);

  async function doSearch(q: string) {
    setQuery(q);
    setStatus("searching");
    setError(null);

    try {
      // Tier 1: does this look like a direct company/ticker search? Check the
      // full ~6,000-ticker US directory first, so typing an actual name wins.
      const symRes = await fetch(`/api/symbols?q=${encodeURIComponent(q)}`).then((r) => r.json());
      const symbolMatches: { symbol: string; description: string }[] = symRes.results ?? [];

      let rateLimited = false;
      if (symbolMatches.length > 0) {
        const top = symbolMatches.slice(0, 6);
        const responses = await Promise.all(
          top.map((m) =>
            fetch(`/api/stock/${m.symbol}`)
              .then((r) => r.json().then((d) => ({ status: r.status, stock: d.stock as Stock | null })))
              .catch(() => ({ status: 0, stock: null as Stock | null }))
          )
        );
        const found = responses.map((r) => r.stock).filter((s): s is Stock => !!s);
        rateLimited = found.length === 0 && responses.some((r) => r.status === 429);
        if (found.length > 0) {
          setCriteria([`Matches for "${q}" across all US-listed stocks`]);
          setResults(found);
          setDirectMatch(true);
          setStatus("done");
          return;
        }
      }

      // Tier 2: fall back to the thematic screener over the curated universe.
      const u = universe ?? (await fetch("/api/universe").then((r) => r.json()).then((d) => d.stocks ?? []));
      const result = runScreen(q, u);
      if (result.results.length === 0 && rateLimited) {
        setError("Live market data is rate-limited right now — try again in a moment.");
        setStatus("error");
        return;
      }
      setCriteria(result.criteria);
      setResults(result.results);
      setDirectMatch(false);
      setStatus("done");
    } catch {
      setError("Live market data is temporarily unavailable — try again in a moment.");
      setStatus("error");
    }
  }

  return (
    <div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (query.trim()) doSearch(query);
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
          placeholder='Try "cheap AI companies", "Boeing", or "AAPL"'
          className="w-full rounded-2xl border border-white/10 bg-white/[0.03] py-3.5 pl-11 pr-28 text-sm text-ink-primary placeholder:text-ink-muted focus:border-accent-cyan/50 focus:outline-none focus:ring-2 focus:ring-accent-cyan/20"
        />
        <button
          type="submit"
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl bg-gradient-to-r from-accent-cyan to-accent-violet px-4 py-2 text-xs font-semibold text-plane transition-opacity hover:opacity-90"
        >
          Ask AI
        </button>
      </form>

      {status === "searching" && (
        <div className="mt-6 flex items-center gap-2 text-sm text-ink-secondary">
          <span className="h-2 w-2 animate-pulse-soft rounded-full bg-accent-cyan" />
          Searching live US market data…
        </div>
      )}

      {status === "error" && <p className="mt-6 text-sm text-status-critical">{error}</p>}

      {status === "done" && (
        <div className="mt-6">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="text-xs text-ink-muted">{directMatch ? "Direct match:" : "AI read this as:"}</span>
            {criteria.map((c) => (
              <Badge key={c} status="neutral">
                {c}
              </Badge>
            ))}
          </div>
          {results.length === 0 ? (
            <p className="text-sm text-ink-muted">No matches found — try a different phrase, company name, or ticker.</p>
          ) : (
            <div className={`grid gap-3 ${compact ? "sm:grid-cols-2" : "sm:grid-cols-2 lg:grid-cols-3"}`}>
              {results.map((s) => (
                <StockCard key={s.ticker} stock={s} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
