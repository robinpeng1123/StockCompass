"use client";

import { useLivePrice } from "@/lib/useLivePrice";
import { formatPrice, signed } from "@/lib/utils";

export function LiveStockHeaderPrice({
  ticker,
  price,
  prevClose,
  changePct,
}: {
  ticker: string;
  price: number;
  prevClose: number;
  changePct: number;
}) {
  const live = useLivePrice(ticker, price, prevClose, changePct);
  const up = live.changePct >= 0;

  return (
    <div className="text-right">
      <div className="flex items-center justify-end gap-2">
        <div className="text-3xl font-semibold tabular-nums text-ink-primary">{formatPrice(live.price)}</div>
        {live.isLive && <span className="h-2 w-2 animate-pulse-soft rounded-full bg-status-good" title="Live" />}
      </div>
      <div className={`text-sm font-medium ${up ? "text-status-good" : "text-status-critical"}`}>
        {signed(live.changePct)}% today
      </div>
    </div>
  );
}
