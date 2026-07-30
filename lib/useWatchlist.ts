"use client";

import { useCallback, useEffect, useState } from "react";
import { Stock } from "./types";
import { loadWatchlist, saveWatchlist, WatchlistEntry } from "./watchlist";
import { computePortfolioStats } from "./portfolioStats";

export function useWatchlist() {
  const [entries, setEntries] = useState<WatchlistEntry[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [stocks, setStocks] = useState<Record<string, Stock>>({});
  const [loading, setLoading] = useState(true);

  // localStorage only exists client-side, so read it after mount to avoid a
  // server/client hydration mismatch.
  useEffect(() => {
    setEntries(loadWatchlist());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (entries.length === 0) {
      setStocks({});
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    Promise.all(
      entries.map((e) =>
        fetch(`/api/stock/${e.ticker}`)
          .then((r) => r.json())
          .then((d) => (d.stock as Stock) ?? null)
          .catch(() => null)
      )
    ).then((results) => {
      if (cancelled) return;
      const map: Record<string, Stock> = {};
      results.forEach((s, i) => {
        if (s) map[entries[i].ticker] = s;
      });
      setStocks(map);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [entries, hydrated]);

  const add = useCallback((ticker: string, shares: number, costBasis: number) => {
    setEntries((prev) => {
      const upper = ticker.toUpperCase();
      const next = [...prev.filter((e) => e.ticker !== upper), { ticker: upper, shares, costBasis }];
      saveWatchlist(next);
      return next;
    });
  }, []);

  const remove = useCallback((ticker: string) => {
    setEntries((prev) => {
      const next = prev.filter((e) => e.ticker !== ticker.toUpperCase());
      saveWatchlist(next);
      return next;
    });
  }, []);

  const stats = computePortfolioStats(entries, stocks);

  return { entries, stats, loading: loading || !hydrated, add, remove };
}
