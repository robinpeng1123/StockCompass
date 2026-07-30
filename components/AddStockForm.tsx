"use client";

import { useEffect, useRef, useState } from "react";

type SymbolMatch = { symbol: string; description: string };

export function AddStockForm({ onAdd }: { onAdd: (ticker: string, shares: number, costBasis: number) => void }) {
  const [query, setQuery] = useState("");
  const [matches, setMatches] = useState<SymbolMatch[]>([]);
  const [selected, setSelected] = useState<SymbolMatch | null>(null);
  const [shares, setShares] = useState("10");
  const [costBasis, setCostBasis] = useState("");
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selected || query.trim().length < 1) {
      setMatches([]);
      return;
    }
    const handle = setTimeout(() => {
      fetch(`/api/symbols?q=${encodeURIComponent(query)}`)
        .then((r) => r.json())
        .then((d) => setMatches(d.results ?? []))
        .catch(() => setMatches([]));
    }, 200);
    return () => clearTimeout(handle);
  }, [query, selected]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const ticker = selected?.symbol ?? query.trim().toUpperCase();
    if (!ticker) return;
    const sharesNum = Number(shares) || 0;
    if (sharesNum <= 0) return;

    let costNum = costBasis.trim() ? Number(costBasis) : NaN;
    if (!Number.isFinite(costNum) || costNum <= 0) {
      // No cost basis given — track from today's price instead of defaulting to $0
      // (which would otherwise read as an infinite gain).
      costNum = await fetch(`/api/quote/${ticker}`)
        .then((r) => r.json())
        .then((d) => d.quote?.c ?? 0)
        .catch(() => 0);
    }
    if (costNum <= 0) return;

    onAdd(ticker, sharesNum, costNum);
    setQuery("");
    setSelected(null);
    setShares("10");
    setCostBasis("");
    setMatches([]);
    setOpen(false);
  }

  return (
    <form onSubmit={submit} className="flex flex-wrap items-end gap-3">
      <div ref={boxRef} className="relative min-w-[180px] flex-1">
        <label className="mb-1 block text-[11px] font-medium text-ink-muted">Ticker or company</label>
        <input
          type="text"
          value={selected ? `${selected.symbol} — ${selected.description}` : query}
          onChange={(e) => {
            setSelected(null);
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="e.g. AAPL or Apple"
          className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-ink-primary placeholder:text-ink-muted focus:border-accent-cyan/50 focus:outline-none focus:ring-2 focus:ring-accent-cyan/20"
        />
        {open && matches.length > 0 && (
          <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-xl border border-white/10 bg-surface-raised shadow-lg">
            {matches.slice(0, 8).map((m) => (
              <button
                key={m.symbol}
                type="button"
                onClick={() => {
                  setSelected(m);
                  setOpen(false);
                }}
                className="flex w-full items-center justify-between px-3 py-2 text-left text-xs hover:bg-white/[0.05]"
              >
                <span className="font-semibold text-ink-primary">{m.symbol}</span>
                <span className="ml-2 truncate text-ink-muted">{m.description}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="w-24">
        <label className="mb-1 block text-[11px] font-medium text-ink-muted">Shares</label>
        <input
          type="number"
          min="0"
          step="any"
          value={shares}
          onChange={(e) => setShares(e.target.value)}
          className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-ink-primary focus:border-accent-cyan/50 focus:outline-none focus:ring-2 focus:ring-accent-cyan/20"
        />
      </div>

      <div className="w-32">
        <label className="mb-1 block text-[11px] font-medium text-ink-muted">Cost basis</label>
        <input
          type="number"
          min="0"
          step="any"
          value={costBasis}
          onChange={(e) => setCostBasis(e.target.value)}
          placeholder="Current price"
          className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-ink-primary placeholder:text-ink-muted focus:border-accent-cyan/50 focus:outline-none focus:ring-2 focus:ring-accent-cyan/20"
        />
      </div>

      <button type="submit" className="rounded-xl bg-gradient-to-r from-accent-cyan to-accent-violet px-4 py-2 text-xs font-semibold text-plane hover:opacity-90">
        Add to portfolio
      </button>
    </form>
  );
}
