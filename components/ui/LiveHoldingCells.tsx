"use client";

import { useLivePrice } from "@/lib/useLivePrice";
import { formatPrice, signed } from "@/lib/utils";

export function LiveHoldingCells({
  ticker,
  shares,
  costBasis,
  price,
  prevClose,
}: {
  ticker: string;
  shares: number;
  costBasis: number;
  price: number;
  prevClose: number;
}) {
  const live = useLivePrice(ticker, price, prevClose, 0);
  const marketValue = shares * live.price;
  const costValue = shares * costBasis;
  const gainPct = ((marketValue - costValue) / costValue) * 100;

  return (
    <>
      <td className="py-2.5 pr-3 text-right tabular-nums text-ink-secondary">
        <span className="inline-flex items-center gap-1.5">
          {formatPrice(live.price)}
          {live.isLive && <span className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-status-good" title="Live" />}
        </span>
      </td>
      <td className="py-2.5 pr-3 text-right font-medium tabular-nums text-ink-primary">{formatPrice(marketValue)}</td>
      <td className={`py-2.5 pl-3 text-right font-medium tabular-nums ${gainPct >= 0 ? "text-status-good" : "text-status-critical"}`}>
        {signed(gainPct, 1)}%
      </td>
    </>
  );
}
