"use client";

import { useEffect, useState } from "react";
import { Pattern, Scenario } from "./types";
import { AIRiskOverride } from "@/components/RiskMeter";

export type CoachData = {
  scenarios: Scenario[];
  pattern: Pattern;
  risk: AIRiskOverride | undefined;
  source: "ai" | "fallback";
};

/** Fetches /api/coach/[ticker] once per ticker, falling back to the static heuristics on any failure. */
export function useAICoach(ticker: string, fallbackScenarios: Scenario[], fallbackPattern: Pattern): { data: CoachData; loading: boolean } {
  const [data, setData] = useState<CoachData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`/api/coach/${ticker}`)
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        const scenarios = Array.isArray(d.scenarios) && d.scenarios.length === 3 ? d.scenarios : fallbackScenarios;
        const pattern = d.pattern ?? fallbackPattern;
        setData({ scenarios, pattern, risk: d.risk ?? undefined, source: d.source === "ai" ? "ai" : "fallback" });
      })
      .catch(() => {
        if (cancelled) return;
        setData({ scenarios: fallbackScenarios, pattern: fallbackPattern, risk: undefined, source: "fallback" });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticker]);

  return { data: data ?? { scenarios: fallbackScenarios, pattern: fallbackPattern, risk: undefined, source: "fallback" }, loading };
}
