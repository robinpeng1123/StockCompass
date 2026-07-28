import { cx } from "@/lib/utils";

const STATUS_MAP = {
  good: "bg-status-good/15 text-status-good ring-status-good/30",
  warning: "bg-status-warning/15 text-status-warning ring-status-warning/30",
  serious: "bg-status-serious/15 text-status-serious ring-status-serious/30",
  critical: "bg-status-critical/15 text-status-critical ring-status-critical/30",
  neutral: "bg-white/[0.06] text-ink-secondary ring-white/10",
};

export function Badge({
  children,
  status = "neutral",
  icon,
  className,
}: {
  children: React.ReactNode;
  status?: keyof typeof STATUS_MAP;
  icon?: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset",
        STATUS_MAP[status],
        className
      )}
    >
      {icon}
      {children}
    </span>
  );
}

export function Dot({ status = "neutral" as keyof typeof STATUS_MAP }) {
  const dotColor: Record<string, string> = {
    good: "bg-status-good",
    warning: "bg-status-warning",
    serious: "bg-status-serious",
    critical: "bg-status-critical",
    neutral: "bg-ink-muted",
  };
  return <span className={cx("h-1.5 w-1.5 rounded-full", dotColor[status])} />;
}
