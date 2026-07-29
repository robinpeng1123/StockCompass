// Pure constants/types shared by server (Yahoo fetch) and client (chart UI)
// code — kept out of yahooHistory.ts so client components can import this
// without pulling in the "server-only" fetch logic.

export const CHART_RANGES = ["1d", "5d", "1mo", "1y", "max"] as const;
export type ChartRangeKey = (typeof CHART_RANGES)[number];

export const RANGE_LABELS: Record<ChartRangeKey, string> = {
  "1d": "Today",
  "5d": "5 Days",
  "1mo": "Month",
  "1y": "Year",
  max: "Max",
};

function isChartRangeKey(v: string): v is ChartRangeKey {
  return (CHART_RANGES as readonly string[]).includes(v);
}

export function parseRangeKey(v: string | null | undefined, fallback: ChartRangeKey = "1mo"): ChartRangeKey {
  return v && isChartRangeKey(v) ? v : fallback;
}
