"use client";

import { useMemo, useState } from "react";
import { Stock } from "@/lib/types";
import { StockCard } from "./StockCard";

export function CryptoSearch({ cryptos }: { cryptos: Stock[] }) {
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return cryptos;
    return cryptos.filter((c) => c.ticker.toLowerCase().includes(q) || c.name.toLowerCase().includes(q));
  }, [cryptos, query]);

  return (
    <div>
      <div className="relative">
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
          placeholder='Search by name or ticker — "Bitcoin", "ETH"...'
          className="w-full rounded-2xl border border-white/10 bg-white/[0.03] py-3.5 pl-11 pr-4 text-sm text-ink-primary placeholder:text-ink-muted focus:border-accent-cyan/50 focus:outline-none focus:ring-2 focus:ring-accent-cyan/20"
        />
      </div>

      <div className="mt-6">
        {results.length === 0 ? (
          <p className="text-sm text-ink-muted">No matches — try a different name or ticker.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((c) => (
              <StockCard key={c.ticker} stock={c} href={`/crypto/${c.ticker}`} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
