"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { Stock } from "./types";
import { loadWatchlist, saveWatchlist, WatchlistEntry } from "./watchlist";
import { computePortfolioStats } from "./portfolioStats";

export function useWatchlist() {
  const { status } = useSession();
  const signedIn = status === "authenticated";

  const [entries, setEntries] = useState<WatchlistEntry[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [stocks, setStocks] = useState<Record<string, Stock>>({});
  const [loading, setLoading] = useState(true);
  const migrated = useRef(false);

  // Load entries: from the database when signed in, from localStorage otherwise.
  // localStorage only exists client-side, so this runs after mount to avoid a
  // server/client hydration mismatch.
  useEffect(() => {
    if (status === "loading") return;

    let cancelled = false;

    async function load() {
      if (signedIn) {
        // One-time migration: push any locally-saved entries into the
        // database the first time we see an authenticated session, then
        // clear localStorage so it isn't re-migrated.
        if (!migrated.current) {
          migrated.current = true;
          const local = loadWatchlist();
          if (local.length > 0) {
            await Promise.all(
              local.map((e) =>
                fetch("/api/portfolio", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(e),
                }).catch(() => null)
              )
            );
            saveWatchlist([]);
          }
        }
        const res = await fetch("/api/portfolio").then((r) => r.json()).catch(() => ({ entries: [] }));
        if (!cancelled) {
          setEntries(res.entries ?? []);
          setHydrated(true);
        }
      } else {
        if (!cancelled) {
          setEntries(loadWatchlist());
          setHydrated(true);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [signedIn, status]);

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

  const add = useCallback(
    (ticker: string, shares: number, costBasis: number) => {
      const upper = ticker.toUpperCase();
      setEntries((prev) => {
        const next = [...prev.filter((e) => e.ticker !== upper), { ticker: upper, shares, costBasis }];
        if (!signedIn) saveWatchlist(next);
        return next;
      });
      if (signedIn) {
        fetch("/api/portfolio", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ticker: upper, shares, costBasis }),
        }).catch(() => null);
      }
    },
    [signedIn]
  );

  const remove = useCallback(
    (ticker: string) => {
      const upper = ticker.toUpperCase();
      setEntries((prev) => {
        const next = prev.filter((e) => e.ticker !== upper);
        if (!signedIn) saveWatchlist(next);
        return next;
      });
      if (signedIn) {
        fetch(`/api/portfolio?ticker=${encodeURIComponent(upper)}`, { method: "DELETE" }).catch(() => null);
      }
    },
    [signedIn]
  );

  const stats = computePortfolioStats(entries, stocks);

  return { entries, stats, loading: loading || !hydrated, add, remove };
}
