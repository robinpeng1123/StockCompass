import { ReactNode } from "react";
import { cx } from "@/lib/utils";

export function Card({
  children,
  className,
  glow,
}: {
  children: ReactNode;
  className?: string;
  glow?: "cyan" | "violet";
}) {
  return (
    <div
      className={cx(
        "glass-panel p-5",
        glow === "cyan" && "shadow-glow",
        glow === "violet" && "shadow-glow-violet",
        className
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  eyebrow,
  title,
  action,
  icon,
}: {
  eyebrow?: string;
  title: string;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="mb-4 flex items-start justify-between gap-3">
      <div className="flex items-start gap-2.5">
        {icon && <div className="mt-0.5 text-accent-cyan">{icon}</div>}
        <div>
          {eyebrow && <div className="text-[11px] font-medium uppercase tracking-wider text-ink-muted">{eyebrow}</div>}
          <h3 className="text-[15px] font-semibold text-ink-primary">{title}</h3>
        </div>
      </div>
      {action}
    </div>
  );
}
