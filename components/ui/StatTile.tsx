import { Sparkline } from "./Sparkline";
import { cx, signed } from "@/lib/utils";

export function StatTile({
  label,
  value,
  deltaPct,
  trend,
}: {
  label: string;
  value: string;
  deltaPct?: number;
  trend?: number[];
}) {
  const up = (deltaPct ?? 0) >= 0;
  return (
    <div className="glass-panel flex items-center justify-between gap-4 p-4">
      <div>
        <div className="text-xs font-medium text-ink-muted">{label}</div>
        <div className="mt-1 text-2xl font-semibold tracking-tight text-ink-primary">{value}</div>
        {deltaPct !== undefined && (
          <div className={cx("mt-0.5 text-xs font-medium", up ? "text-status-good" : "text-status-critical")}>
            {signed(deltaPct)}% today
          </div>
        )}
      </div>
      {trend && <Sparkline data={trend} color={up ? "#0ca30c" : "#d03b3b"} width={88} height={32} />}
    </div>
  );
}
