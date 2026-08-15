"use client";

import { useState } from "react";
import { LEARNING_MODULES, LearningModule } from "@/lib/learningGame";
import { CandlestickChart } from "@/components/ui/CandlestickChart";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { cx } from "@/lib/utils";

type Screen =
  | { view: "select" }
  | { view: "quiz"; moduleKey: string; qIndex: number; answers: number[] }
  | { view: "results"; moduleKey: string; answers: number[] };

export function LearningGame() {
  const [screen, setScreen] = useState<Screen>({ view: "select" });
  const [bestScores, setBestScores] = useState<Record<string, number>>({});

  function startModule(key: string) {
    setScreen({ view: "quiz", moduleKey: key, qIndex: 0, answers: [] });
  }

  function handleAnswer(selected: number) {
    if (screen.view !== "quiz") return;
    const mod = LEARNING_MODULES.find((m) => m.key === screen.moduleKey)!;
    const answers = [...screen.answers, selected];
    if (screen.qIndex + 1 < mod.questions.length) {
      setScreen({ ...screen, qIndex: screen.qIndex + 1, answers });
    } else {
      const correct = answers.filter((a, i) => a === mod.questions[i].correctIndex).length;
      setBestScores((prev) => ({ ...prev, [screen.moduleKey]: Math.max(prev[screen.moduleKey] ?? 0, correct) }));
      setScreen({ view: "results", moduleKey: screen.moduleKey, answers });
    }
  }

  if (screen.view === "select") {
    return <ModuleSelect bestScores={bestScores} onSelect={startModule} />;
  }

  const mod = LEARNING_MODULES.find((m) => m.key === screen.moduleKey)!;

  if (screen.view === "quiz") {
    return (
      <QuizScreen
        module={mod}
        qIndex={screen.qIndex}
        onAnswer={handleAnswer}
        onExit={() => setScreen({ view: "select" })}
      />
    );
  }

  return (
    <ResultsScreen
      module={mod}
      answers={screen.answers}
      onRetry={() => startModule(screen.moduleKey)}
      onExit={() => setScreen({ view: "select" })}
    />
  );
}

function ModuleSelect({ bestScores, onSelect }: { bestScores: Record<string, number>; onSelect: (key: string) => void }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {LEARNING_MODULES.map((mod) => {
        const best = bestScores[mod.key];
        const total = mod.questions.length;
        return (
          <button
            key={mod.key}
            onClick={() => onSelect(mod.key)}
            className="glass-panel flex flex-col items-start gap-2 p-5 text-left transition-colors hover:border-white/20 hover:bg-white/[0.04]"
          >
            <div className="flex w-full items-center justify-between">
              <span className="text-2xl">{mod.emoji}</span>
              {best !== undefined && (
                <Badge status={best === total ? "good" : "neutral"} className="px-2 py-0.5 text-[10px]">
                  Best: {best}/{total}
                </Badge>
              )}
            </div>
            <div className="text-base font-semibold text-ink-primary">{mod.title}</div>
            <p className="text-xs leading-relaxed text-ink-secondary">{mod.description}</p>
            <span className="mt-1 text-xs font-medium text-accent-cyan">{best !== undefined ? "Play again →" : "Start →"}</span>
          </button>
        );
      })}
    </div>
  );
}

function QuizScreen({
  module,
  qIndex,
  onAnswer,
  onExit,
}: {
  module: LearningModule;
  qIndex: number;
  onAnswer: (selected: number) => void;
  onExit: () => void;
}) {
  const [selected, setSelected] = useState<number | null>(null);
  const question = module.questions[qIndex];
  const total = module.questions.length;

  function choose(i: number) {
    if (selected !== null) return;
    setSelected(i);
  }

  function next() {
    if (selected === null) return;
    onAnswer(selected);
    setSelected(null);
  }

  return (
    <Card>
      <CardHeader
        eyebrow={module.title}
        title={`Question ${qIndex + 1} of ${total}`}
        action={
          <button onClick={onExit} className="text-xs font-medium text-ink-muted hover:text-ink-primary">
            Exit
          </button>
        }
      />

      <div className="mb-4 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.07]">
        <div
          className="h-full rounded-full bg-gradient-to-r from-accent-cyan to-accent-violet transition-[width] duration-300"
          style={{ width: `${(qIndex / total) * 100}%` }}
        />
      </div>

      {question.candles && (
        <div className="mb-4 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
          <CandlestickChart candles={question.candles} />
        </div>
      )}

      <p className="mb-4 text-sm font-medium leading-relaxed text-ink-primary">{question.prompt}</p>

      <div className="space-y-2">
        {question.options.map((opt, i) => {
          const isCorrect = i === question.correctIndex;
          const isSelected = i === selected;
          const showResult = selected !== null;
          return (
            <button
              key={i}
              onClick={() => choose(i)}
              disabled={selected !== null}
              className={cx(
                "w-full rounded-xl border px-4 py-3 text-left text-sm transition-colors",
                !showResult && "border-white/10 bg-white/[0.02] text-ink-secondary hover:border-accent-cyan/40 hover:text-ink-primary",
                showResult && isCorrect && "border-status-good/40 bg-status-good/10 text-ink-primary",
                showResult && isSelected && !isCorrect && "border-status-critical/40 bg-status-critical/10 text-ink-primary",
                showResult && !isSelected && !isCorrect && "border-white/10 bg-white/[0.02] text-ink-muted"
              )}
            >
              {opt}
            </button>
          );
        })}
      </div>

      {selected !== null && (
        <div className="mt-4 rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
            {selected === question.correctIndex ? "Correct" : "Not quite"}
          </p>
          <p className="mt-1.5 text-sm leading-relaxed text-ink-secondary">{question.explanation}</p>
          <button
            onClick={next}
            className="mt-3 rounded-lg bg-gradient-to-r from-accent-cyan to-accent-violet px-4 py-2 text-xs font-semibold text-plane hover:opacity-90"
          >
            {qIndex + 1 < total ? "Next question →" : "See results →"}
          </button>
        </div>
      )}
    </Card>
  );
}

function ResultsScreen({
  module,
  answers,
  onRetry,
  onExit,
}: {
  module: LearningModule;
  answers: number[];
  onRetry: () => void;
  onExit: () => void;
}) {
  const total = module.questions.length;
  const correct = answers.filter((a, i) => a === module.questions[i].correctIndex).length;
  const pct = Math.round((correct / total) * 100);

  return (
    <Card>
      <CardHeader eyebrow={module.title} title="Results" />
      <div className="flex flex-col items-center py-4 text-center">
        <div className="text-4xl font-semibold tracking-tight text-ink-primary">
          {correct}
          <span className="text-xl text-ink-muted">/{total}</span>
        </div>
        <p className="mt-1 text-sm text-ink-secondary">
          {pct === 100
            ? "Perfect score."
            : pct >= 70
              ? "Solid — a review of the missed ones below is worth a look."
              : "Worth another pass — review the explanations below and try again."}
        </p>
      </div>

      <div className="space-y-2">
        {module.questions.map((q, i) => {
          const got = answers[i] === q.correctIndex;
          return (
            <div key={q.id} className="flex items-start gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2">
              <span className={got ? "text-status-good" : "text-status-critical"}>{got ? "✓" : "✗"}</span>
              <p className="text-xs leading-relaxed text-ink-secondary">{q.prompt}</p>
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex gap-2">
        <button
          onClick={onRetry}
          className="rounded-lg bg-gradient-to-r from-accent-cyan to-accent-violet px-4 py-2 text-xs font-semibold text-plane hover:opacity-90"
        >
          Try again
        </button>
        <button
          onClick={onExit}
          className="rounded-lg border border-white/10 px-4 py-2 text-xs font-medium text-ink-secondary hover:text-ink-primary"
        >
          Back to modules
        </button>
      </div>
    </Card>
  );
}
