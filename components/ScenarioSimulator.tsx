"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Scenario } from "@/lib/types";
import { Card, CardHeader } from "./ui/Card";
import { Badge } from "./ui/Badge";
import { signed } from "@/lib/utils";
import { ScenarioComboChart } from "./ui/ScenarioComboChart";
import { NewsEntry, averageSentiment, applyNewsSignal } from "@/lib/newsSignal";
import { isAdminEmail } from "@/lib/admin";

const SCENARIO_COLOR: Record<Scenario["label"], string> = {
  Bullish: "#0ca30c",
  Neutral: "#5b6580",
  Bearish: "#d03b3b",
};

const SCENARIO_STATUS: Record<Scenario["label"], "good" | "neutral" | "critical"> = {
  Bullish: "good",
  Neutral: "neutral",
  Bearish: "critical",
};

export function ScenarioSimulator({
  ticker,
  scenarios,
  price,
  dailyVolPct,
}: {
  ticker: string;
  scenarios: Scenario[];
  price: number;
  /** The model's own measured daily volatility (real %) — see getDailyVolatilityPct. */
  dailyVolPct: number;
}) {
  const { data: session } = useSession();
  const isAdmin = isAdminEmail(session?.user?.email);

  const [entries, setEntries] = useState<NewsEntry[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadEntries() {
    try {
      const res = await fetch(`/api/news-signal/${encodeURIComponent(ticker)}`);
      const data = await res.json();
      setEntries(Array.isArray(data.entries) ? data.entries : []);
    } catch {
      setEntries([]);
    }
  }

  useEffect(() => {
    setDraft("");
    setError(null);
    loadEntries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticker]);

  const sentiment = averageSentiment(entries);
  const effective = applyNewsSignal(scenarios, sentiment);

  async function submitNews() {
    if (!draft.trim() || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/news-signal/${encodeURIComponent(ticker)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: draft }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Couldn't add that signal.");
        return;
      }
      setDraft("");
      await loadEntries();
    } finally {
      setBusy(false);
    }
  }

  async function deleteNews(id: string) {
    setBusy(true);
    try {
      await fetch(`/api/news-signal/${encodeURIComponent(ticker)}?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      await loadEntries();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardHeader
        eyebrow={ticker}
        title="Prediction Simulator"
        icon={<DiceIcon />}
        action={<span className="text-[11px] text-ink-muted">ML model prediction, not a forecast</span>}
      />

      {/* Combined probability — single stacked bar, part-to-whole across the three scenarios */}
      <div className="mb-1.5 text-[11px] text-ink-muted">Probability weighting</div>
      <div className="flex h-6 w-full overflow-hidden rounded-lg">
        {effective.map((s, i) => (
          <div
            key={s.label}
            className="flex items-center justify-center text-[11px] font-semibold text-white/90 transition-[width] duration-300"
            style={{ width: `${s.probabilityPct}%`, backgroundColor: SCENARIO_COLOR[s.label], marginLeft: i === 0 ? 0 : 2 }}
          >
            {s.probabilityPct >= 12 ? `${s.probabilityPct}%` : ""}
          </div>
        ))}
      </div>

      <div className="mt-5">
        <ScenarioComboChart ticker={ticker} scenarios={effective} price={price} dailyVolPct={dailyVolPct} />
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        {effective.map((s) => (
          <div key={s.label} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3.5">
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="text-sm font-semibold text-ink-primary">{s.label}</span>
              <Badge status={SCENARIO_STATUS[s.label]} className="px-1.5 py-0.5 text-[10px]">
                {s.probabilityPct}% chance
              </Badge>
            </div>

            <div className="text-xs font-semibold tabular-nums text-ink-primary">
              {signed(s.rangeLowPct, 0)}% to {signed(s.rangeHighPct, 0)}%
            </div>
            <p className="mt-1 text-[11px] leading-relaxed text-ink-secondary">{s.trigger}</p>
          </div>
        ))}
      </div>

      <p className="mt-5 text-[11px] leading-relaxed text-ink-muted">
        Probabilities come from a supervised model trained on 5 years of price action across 500+ stocks — on
        held-out stocks it predicts direction correctly about 39% of the time (vs. 33% random, 36% always-guess-
        Neutral). A real, modest edge — not a reliable forecast. Each path is a ~30-day-out estimate for that
        scenario, not a guarantee.
      </p>

      {(isAdmin || entries.length > 0) && (
        <NewsSignalSection
          entries={entries}
          draft={draft}
          onDraftChange={setDraft}
          onSubmit={submitNews}
          onDelete={deleteNews}
          sentiment={sentiment}
          isAdmin={isAdmin}
          busy={busy}
          error={error}
        />
      )}
    </Card>
  );
}

function NewsSignalSection({
  entries,
  draft,
  onDraftChange,
  onSubmit,
  onDelete,
  sentiment,
  isAdmin,
  busy,
  error,
}: {
  entries: NewsEntry[];
  draft: string;
  onDraftChange: (v: string) => void;
  onSubmit: () => void;
  onDelete: (id: string) => void;
  sentiment: number;
  isAdmin: boolean;
  busy: boolean;
  error: string | null;
}) {
  return (
    <div className="mt-5 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="text-xs font-semibold uppercase tracking-wide text-ink-muted">News signal</div>
        {entries.length > 0 && <SentimentBadge score={sentiment} />}
      </div>
      <p className="mt-1.5 text-[11px] leading-relaxed text-ink-muted">
        {isAdmin
          ? "Paste a headline or article about this stock. A transparent keyword scorer reads it and nudges the odds and ranges above toward or away from Bullish/Bearish for every visitor — it's a curated signal layered on top of the model above, not the model itself learning or retraining (it's trained offline on price history only)."
          : "A news signal curated for this stock, blended into the odds and ranges above — layered on top of the model's own price-action-based prediction, not the model itself retraining."}
      </p>

      {isAdmin && (
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <textarea
            value={draft}
            onChange={(e) => onDraftChange(e.target.value)}
            placeholder='e.g. "Company beats earnings estimates and raises full-year guidance"'
            rows={2}
            className="flex-1 resize-none rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-ink-primary placeholder:text-ink-muted focus:border-accent-cyan/50 focus:outline-none"
          />
          <button
            onClick={onSubmit}
            disabled={!draft.trim() || busy}
            className="shrink-0 self-end rounded-lg bg-gradient-to-r from-accent-cyan to-accent-violet px-4 py-2 text-xs font-semibold text-plane transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            Add signal
          </button>
        </div>
      )}
      {error && <p className="mt-2 text-[11px] text-status-critical">{error}</p>}

      {entries.length > 0 && (
        <div className="mt-3 space-y-1.5">
          {entries.map((e) => (
            <div key={e.id} className="flex items-start justify-between gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] px-2.5 py-1.5">
              <div className="flex min-w-0 items-start gap-2">
                <SentimentBadge score={e.score} />
                <p className="min-w-0 flex-1 text-[11px] text-ink-secondary">{e.text}</p>
              </div>
              {isAdmin && (
                <button
                  onClick={() => onDelete(e.id)}
                  disabled={busy}
                  className="shrink-0 text-[11px] text-ink-muted hover:text-status-critical disabled:opacity-40"
                  aria-label="Remove this news signal"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SentimentBadge({ score }: { score: number }) {
  const status = score > 0.15 ? "good" : score < -0.15 ? "critical" : "neutral";
  const label = score > 0.15 ? "Positive" : score < -0.15 ? "Negative" : "Neutral";
  return (
    <Badge status={status} className="shrink-0 px-1.5 py-0.5 text-[10px]">
      {label} {signed(Math.round(score * 100), 0)}
    </Badge>
  );
}

function DiceIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <rect x="2.5" y="2.5" width="13" height="13" rx="3" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="6.5" cy="6.5" r="1" fill="currentColor" />
      <circle cx="11.5" cy="6.5" r="1" fill="currentColor" />
      <circle cx="9" cy="9" r="1" fill="currentColor" />
      <circle cx="6.5" cy="11.5" r="1" fill="currentColor" />
      <circle cx="11.5" cy="11.5" r="1" fill="currentColor" />
    </svg>
  );
}
