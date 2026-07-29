"use client";

import { useEffect, useState } from "react";
import { subscribeLiveQuote, LiveTick } from "./liveQuoteClient";

/**
 * Live-ticking price for one ticker, multiplexed onto a single shared
 * WebSocket (see liveQuoteClient). Returns null until the first real trade
 * comes in — callers should fall back to the server-fetched price/change
 * until then (markets can be closed, or a symbol can be illiquid).
 */
export function useLiveQuote(ticker: string | undefined): LiveTick | null {
  const [tick, setTick] = useState<LiveTick | null>(null);

  useEffect(() => {
    setTick(null);
    if (!ticker) return;
    return subscribeLiveQuote(ticker, (t) => setTick(t));
  }, [ticker]);

  return tick;
}
