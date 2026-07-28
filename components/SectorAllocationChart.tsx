"use client";

import { SectorSlice } from "@/lib/portfolio";
import { sectorColor } from "@/lib/sectorColors";
import { useState } from "react";

export function SectorAllocationChart({ sectors, totalValue }: { sectors: SectorSlice[]; totalValue: number }) {
  const [hover, setHover] = useState<string | null>(null);

  return (
    <div>
      <div className="flex h-7 w-full overflow-hidden rounded-lg">
        {sectors.map((s, i) => (
          <div
            key={s.sector}
            onMouseEnter={() => setHover(s.sector)}
            onMouseLeave={() => setHover(null)}
            className="flex items-center justify-center text-[11px] font-semibold text-white/90 transition-opacity"
            style={{
              width: `${s.pct}%`,
              backgroundColor: sectorColor(s.sector),
              marginLeft: i === 0 ? 0 : 2,
              opacity: hover && hover !== s.sector ? 0.45 : 1,
            }}
            title={`${s.sector}: ${s.pct.toFixed(1)}%`}
          >
            {s.pct >= 9 ? `${s.pct.toFixed(0)}%` : ""}
          </div>
        ))}
      </div>

      <div className="mt-4 space-y-2.5">
        {sectors.map((s) => (
          <div
            key={s.sector}
            onMouseEnter={() => setHover(s.sector)}
            onMouseLeave={() => setHover(null)}
            className="flex items-center gap-3 text-xs transition-opacity"
            style={{ opacity: hover && hover !== s.sector ? 0.5 : 1 }}
          >
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: sectorColor(s.sector) }} />
            <span className="w-40 shrink-0 text-ink-secondary">{s.sector}</span>
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
              <div className="h-full rounded-full" style={{ width: `${s.pct}%`, backgroundColor: sectorColor(s.sector) }} />
            </div>
            <span className="w-12 shrink-0 text-right font-semibold tabular-nums text-ink-primary">{s.pct.toFixed(1)}%</span>
            <span className="w-20 shrink-0 text-right tabular-nums text-ink-muted">
              ${(s.valueUSD / 1000).toFixed(1)}K
            </span>
          </div>
        ))}
      </div>
      <p className="mt-2 text-right text-[11px] text-ink-muted">Total portfolio value: ${(totalValue / 1000).toFixed(1)}K</p>
    </div>
  );
}
