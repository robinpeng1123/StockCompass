import Link from "next/link";
import { Stock } from "@/lib/types";
import { Sparkline } from "./ui/Sparkline";
import { formatPrice, signed } from "@/lib/utils";
import { Badge } from "./ui/Badge";

export function StockCard({ stock }: { stock: Stock }) {
  const up = stock.changePct >= 0;
  return (
    <Link
      href={`/stock/${stock.ticker}`}
      className="group glass-panel flex flex-col gap-3 p-4 transition-all hover:border-white/20 hover:bg-white/[0.04]"
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-ink-primary">{stock.ticker}</span>
            <Badge status={stock.aiScore >= 70 ? "good" : stock.aiScore >= 50 ? "warning" : "neutral"} className="px-1.5 py-0.5 text-[10px]">
              AI {stock.aiScore}
            </Badge>
          </div>
          <div className="mt-0.5 truncate text-xs text-ink-muted">{stock.name}</div>
        </div>
        <Sparkline data={stock.history} color={up ? "#0ca30c" : "#d03b3b"} width={72} height={30} />
      </div>

      <div className="flex items-end justify-between">
        <div>
          <div className="text-lg font-semibold tabular-nums text-ink-primary">{formatPrice(stock.price)}</div>
          <div className={`text-xs font-medium ${up ? "text-status-good" : "text-status-critical"}`}>
            {signed(stock.changePct)}%
          </div>
        </div>
        <div className="text-right text-[11px] text-ink-muted">{stock.sector}</div>
      </div>

      <p className="line-clamp-2 text-xs leading-relaxed text-ink-secondary">{stock.blurb}</p>
    </Link>
  );
}
