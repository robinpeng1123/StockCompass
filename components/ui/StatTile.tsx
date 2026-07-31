"use client";

import Link from "next/link";
import { Sparkline } from "./Sparkline";
import { cx, signed } from "@/lib/utils";
import { useLivePrice } from "@/lib/useLivePrice";

export function StatTile({
  label,
  ticker,
  value,
  prevClose,
  deltaPct,
  trend,
  decimals = 2,
}: {
  label: string;
  ticker: string;
  value: number;
  prevClose: number;
  deltaPct: number;
  trend?: number[];
  decimals?: number;
}) {
  const live = useLivePrice(ticker, value, prevClose, deltaPct);
  const up = live.changePct >= 0;

  return (
    <Link
      href={`/stock/${ticker}`}
      className="glass-panel flex items-center justify-between gap-4 p-4 transition-colors hover:border-white/20 hover:bg-white/[0.04]"
    >
      <div>
        <div className="text-xs font-medium text-ink-muted">{label}</div>
        <div className="mt-1 flex items-center gap-1.5">
          <span className="text-2xl font-semibold tracking-tight text-ink-primary">
            {live.price.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}
          </span>
          {live.isLive && <span className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-status-good" title="Live" />}
        </div>
        <div className={cx("mt-0.5 text-xs font-medium", up ? "text-status-good" : "text-status-critical")}>
          {signed(live.changePct)}% today
        </div>
      </div>
      {trend && <Sparkline data={trend} color={up ? "#0ca30c" : "#d03b3b"} width={88} height={32} />}
    </Link>
  );
}
