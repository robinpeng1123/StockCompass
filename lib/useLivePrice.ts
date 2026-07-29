"use client";

import { useLiveQuote } from "./useLiveQuote";

export type LivePrice = { price: number; changePct: number; isLive: boolean };

/**
 * Combines a server-fetched starting price with the shared WebSocket feed —
 * ticks live once a trade comes in, otherwise shows the last known quote.
 */
export function useLivePrice(ticker: string, price: number, prevClose: number, changePct: number): LivePrice {
  const tick = useLiveQuote(ticker);
  if (tick) {
    const base = prevClose || price;
    return { price: tick.price, changePct: base ? ((tick.price - base) / base) * 100 : changePct, isLive: true };
  }
  return { price, changePct, isLive: false };
}
