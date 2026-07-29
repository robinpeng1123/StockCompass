"use client";

/**
 * A single shared WebSocket connection to Finnhub's real-time trade feed,
 * reused across every component on the page. Each stock card / price display
 * calls useLiveQuote(ticker) independently, but they all multiplex onto one
 * socket with refcounted subscriptions instead of opening a connection each.
 */

export type LiveTick = { price: number; t: number };
type Listener = (tick: LiveTick) => void;

const listeners = new Map<string, Set<Listener>>();
const refCounts = new Map<string, number>();
let ws: WebSocket | null = null;
let connecting = false;
let closeTimer: ReturnType<typeof setTimeout> | null = null;

function getKey() {
  return process.env.NEXT_PUBLIC_FINNHUB_API_KEY;
}

function ensureSocket() {
  const key = getKey();
  if (!key || connecting || (ws && ws.readyState <= WebSocket.OPEN)) return;
  connecting = true;

  ws = new WebSocket(`wss://ws.finnhub.io?token=${key}`);
  ws.onopen = () => {
    connecting = false;
    for (const symbol of listeners.keys()) {
      ws?.send(JSON.stringify({ type: "subscribe", symbol }));
    }
  };
  ws.onmessage = (event) => {
    try {
      const msg = JSON.parse(event.data);
      if (msg.type !== "trade" || !Array.isArray(msg.data)) return;
      for (const trade of msg.data) {
        const subs = listeners.get(trade.s);
        if (!subs) continue;
        const tick: LiveTick = { price: trade.p, t: trade.t };
        subs.forEach((fn) => fn(tick));
      }
    } catch {
      // ignore malformed frames
    }
  };
  ws.onclose = () => {
    ws = null;
    connecting = false;
  };
  ws.onerror = () => {
    ws?.close();
  };
}

export function subscribeLiveQuote(symbol: string, onTick: Listener): () => void {
  if (typeof window === "undefined" || !getKey()) return () => {};
  if (closeTimer) {
    clearTimeout(closeTimer);
    closeTimer = null;
  }

  const sym = symbol.toUpperCase();
  if (!listeners.has(sym)) listeners.set(sym, new Set());
  listeners.get(sym)!.add(onTick);
  refCounts.set(sym, (refCounts.get(sym) ?? 0) + 1);

  ensureSocket();
  if (ws && ws.readyState === WebSocket.OPEN && refCounts.get(sym) === 1) {
    ws.send(JSON.stringify({ type: "subscribe", symbol: sym }));
  }

  return () => {
    const subs = listeners.get(sym);
    subs?.delete(onTick);
    const remaining = (refCounts.get(sym) ?? 1) - 1;
    refCounts.set(sym, remaining);
    if (remaining <= 0) {
      listeners.delete(sym);
      refCounts.delete(sym);
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "unsubscribe", symbol: sym }));
      }
    }
    // If nobody's listening to anything, close the socket after a short grace
    // period so quick page navigations don't thrash the connection.
    if (listeners.size === 0 && !closeTimer) {
      closeTimer = setTimeout(() => {
        ws?.close();
        ws = null;
        closeTimer = null;
      }, 5000);
    }
  };
}
