export function formatCompact(n: number, opts: { prefix?: string } = {}) {
  const { prefix = "" } = opts;
  const abs = Math.abs(n);
  if (abs >= 1_000) return `${prefix}${(n / 1000).toFixed(1)}K`;
  return `${prefix}${n.toFixed(2)}`;
}

export function formatPrice(n: number) {
  return `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatMarketCap(billions: number) {
  if (billions >= 1000) return `$${(billions / 1000).toFixed(2)}T`;
  return `$${billions.toFixed(1)}B`;
}

export function signed(n: number, digits = 2) {
  const s = n >= 0 ? "+" : "";
  return `${s}${n.toFixed(digits)}`;
}

export function cx(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}

/**
 * Maps a 0-100 metric to a status color band. `invert` = true means a HIGH
 * value is good (e.g. momentum), false means a HIGH value is bad (risk, volatility).
 */
export function statusForMetric(value: number, invert = false) {
  const v = invert ? 100 - value : value;
  if (v < 35) return { color: "status-good", label: "Low" } as const;
  if (v < 70) return { color: "status-warning", label: "Moderate" } as const;
  return { color: "status-critical", label: "High" } as const;
}

export function scoreLabel(score: number) {
  if (score >= 80) return "Strong";
  if (score >= 60) return "Solid";
  if (score >= 40) return "Mixed";
  return "Weak";
}
