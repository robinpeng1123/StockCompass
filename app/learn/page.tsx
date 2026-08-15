import { LearningGame } from "@/components/LearningGame";

export default function LearnPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink-primary">Learning Game</h1>
        <p className="mt-1 text-sm text-ink-secondary">
          Pick a companion, then level up through stocks, crypto, day trading, and reading candlestick charts — 100
          levels each, with real explanations after every answer, right or wrong.
        </p>
      </div>

      <LearningGame />
    </div>
  );
}
