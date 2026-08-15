"use client";

import { useEffect, useState } from "react";
import { ANIMALS, Animal, TOPICS, Topic, TopicKey, getLevelQuestions, QuizQuestion } from "@/lib/learningGame";
import { CandlestickChart } from "@/components/ui/CandlestickChart";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { cx } from "@/lib/utils";

const STORAGE_KEY = "stockcompass:learninggame:v2";

type Progress = {
  animalKey: string | null;
  unlocked: Record<TopicKey, number>; // highest playable level per topic, 1-indexed
};

const DEFAULT_PROGRESS: Progress = {
  animalKey: null,
  unlocked: { stocks: 1, crypto: 1, daytrading: 1, candlesticks: 1 },
};

function loadProgress(): Progress {
  if (typeof window === "undefined") return DEFAULT_PROGRESS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PROGRESS;
    const parsed = JSON.parse(raw);
    return {
      animalKey: typeof parsed.animalKey === "string" ? parsed.animalKey : null,
      unlocked: { ...DEFAULT_PROGRESS.unlocked, ...(parsed.unlocked ?? {}) },
    };
  } catch {
    return DEFAULT_PROGRESS;
  }
}
function saveProgress(p: Progress) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
}

type Screen =
  | { view: "animal" }
  | { view: "topics" }
  | { view: "path"; topic: TopicKey }
  | { view: "quiz"; topic: TopicKey; level: number; qIndex: number; answers: number[] }
  | { view: "levelComplete"; topic: TopicKey; level: number; answers: number[] };

export function LearningGame() {
  const [progress, setProgress] = useState<Progress>(DEFAULT_PROGRESS);
  const [ready, setReady] = useState(false);
  const [screen, setScreen] = useState<Screen>({ view: "animal" });

  useEffect(() => {
    const p = loadProgress();
    setProgress(p);
    setScreen({ view: p.animalKey ? "topics" : "animal" });
    setReady(true);
  }, []);

  function chooseAnimal(key: string) {
    const next = { ...progress, animalKey: key };
    setProgress(next);
    saveProgress(next);
    setScreen({ view: "topics" });
  }

  function startLevel(topic: TopicKey, level: number) {
    setScreen({ view: "quiz", topic, level, qIndex: 0, answers: [] });
  }

  function handleAnswer(selected: number) {
    if (screen.view !== "quiz") return;
    const questions = getLevelQuestions(screen.topic, screen.level);
    const answers = [...screen.answers, selected];

    if (screen.qIndex + 1 < questions.length) {
      setScreen({ ...screen, qIndex: screen.qIndex + 1, answers });
      return;
    }

    const correct = answers.filter((a, i) => a === questions[i].correctIndex).length;
    const passed = correct >= Math.ceil(questions.length / 2);
    if (passed) {
      const next = {
        ...progress,
        unlocked: {
          ...progress.unlocked,
          [screen.topic]: Math.max(progress.unlocked[screen.topic], screen.level + 1),
        },
      };
      setProgress(next);
      saveProgress(next);
    }
    setScreen({ view: "levelComplete", topic: screen.topic, level: screen.level, answers });
  }

  if (!ready) return null;

  const animal = ANIMALS.find((a) => a.key === progress.animalKey) ?? null;

  if (screen.view === "animal") {
    return <AnimalSelect onSelect={chooseAnimal} />;
  }

  if (screen.view === "topics") {
    return (
      <TopicSelect
        animal={animal}
        unlocked={progress.unlocked}
        onSelectTopic={(topic) => setScreen({ view: "path", topic })}
        onChangeAnimal={() => setScreen({ view: "animal" })}
      />
    );
  }

  if (screen.view === "path") {
    const topic = TOPICS.find((t) => t.key === screen.topic)!;
    return (
      <LevelPath
        topic={topic}
        animal={animal}
        unlockedLevel={progress.unlocked[topic.key]}
        onSelectLevel={(level) => startLevel(topic.key, level)}
        onBack={() => setScreen({ view: "topics" })}
      />
    );
  }

  if (screen.view === "quiz") {
    const topic = TOPICS.find((t) => t.key === screen.topic)!;
    const questions = getLevelQuestions(screen.topic, screen.level);
    return (
      <QuizScreen
        topic={topic}
        level={screen.level}
        questions={questions}
        qIndex={screen.qIndex}
        onAnswer={handleAnswer}
        onExit={() => setScreen({ view: "path", topic: screen.topic })}
      />
    );
  }

  const topic = TOPICS.find((t) => t.key === screen.topic)!;
  const questions = getLevelQuestions(screen.topic, screen.level);
  return (
    <LevelComplete
      topic={topic}
      level={screen.level}
      questions={questions}
      answers={screen.answers}
      animal={animal}
      onContinue={() => setScreen({ view: "path", topic: screen.topic })}
      onRetry={() => startLevel(screen.topic, screen.level)}
    />
  );
}

function AnimalSelect({ onSelect }: { onSelect: (key: string) => void }) {
  return (
    <div className="flex flex-col items-center gap-6 py-8 text-center">
      <div>
        <h2 className="text-xl font-semibold text-ink-primary">Pick your companion</h2>
        <p className="mt-1 text-sm text-ink-secondary">They'll stick with you through every level.</p>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {ANIMALS.map((a) => (
          <button
            key={a.key}
            onClick={() => onSelect(a.key)}
            className="glass-panel flex flex-col items-center gap-2 p-6 transition-transform hover:scale-105 hover:border-accent-cyan/40"
          >
            <span className="text-5xl">{a.emoji}</span>
            <span className="text-sm font-medium text-ink-primary">{a.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function TopicSelect({
  animal,
  unlocked,
  onSelectTopic,
  onChangeAnimal,
}: {
  animal: Animal | null;
  unlocked: Record<TopicKey, number>;
  onSelectTopic: (topic: TopicKey) => void;
  onChangeAnimal: () => void;
}) {
  return (
    <div className="space-y-4">
      {animal && (
        <div className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-2.5">
          <div className="flex items-center gap-2 text-sm text-ink-secondary">
            <span className="text-xl">{animal.emoji}</span>
            Playing as <span className="font-medium text-ink-primary">{animal.label}</span>
          </div>
          <button onClick={onChangeAnimal} className="text-xs font-medium text-ink-muted hover:text-ink-primary">
            Change
          </button>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {TOPICS.map((t) => {
          const level = unlocked[t.key];
          const complete = level > t.totalLevels;
          const pct = Math.min(100, Math.round(((level - 1) / t.totalLevels) * 100));
          return (
            <button
              key={t.key}
              onClick={() => onSelectTopic(t.key)}
              className="glass-panel flex flex-col items-start gap-2 p-5 text-left transition-colors hover:border-white/20 hover:bg-white/[0.04]"
            >
              <div className="flex w-full items-center justify-between">
                <span className="text-2xl">{t.emoji}</span>
                <Badge status={complete ? "good" : "neutral"} className="px-2 py-0.5 text-[10px]">
                  {complete ? "Complete" : `Level ${level}/${t.totalLevels}`}
                </Badge>
              </div>
              <div className="text-base font-semibold text-ink-primary">{t.title}</div>
              <p className="text-xs leading-relaxed text-ink-secondary">{t.description}</p>
              <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.07]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-accent-cyan to-accent-violet"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function LevelPath({
  topic,
  animal,
  unlockedLevel,
  onSelectLevel,
  onBack,
}: {
  topic: Topic;
  animal: Animal | null;
  unlockedLevel: number;
  onSelectLevel: (level: number) => void;
  onBack: () => void;
}) {
  const levels = Array.from({ length: topic.totalLevels }, (_, i) => i + 1);
  const sections: number[][] = [];
  for (let i = 0; i < levels.length; i += 10) sections.push(levels.slice(i, i + 10));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="text-xs font-medium text-ink-muted hover:text-ink-primary">
          ← Topics
        </button>
        <div className="flex items-center gap-2 text-sm text-ink-secondary">
          <span className="text-xl">{topic.emoji}</span>
          <span className="font-medium text-ink-primary">{topic.title}</span>
        </div>
        <span className="text-xl">{animal ? animal.emoji : ""}</span>
      </div>

      <div className="glass-panel max-h-[560px] overflow-y-auto p-6">
        {sections.map((section, sIdx) => (
          <div key={sIdx} className="mb-6 last:mb-0">
            <div className="mb-4 text-center text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
              Levels {section[0]}–{section[section.length - 1]}
            </div>
            <div className="flex flex-col items-center gap-3">
              {section.map((level) => {
                const state = level < unlockedLevel ? "done" : level === unlockedLevel ? "current" : "locked";
                const offset = Math.round(Math.sin(level * 0.9) * 46);
                return (
                  <button
                    key={level}
                    disabled={state === "locked"}
                    onClick={() => onSelectLevel(level)}
                    style={{ transform: `translateX(${offset}px)` }}
                    className={cx(
                      "flex h-14 w-14 shrink-0 items-center justify-center rounded-full border text-sm font-semibold transition-transform",
                      state === "done" && "border-status-good/40 bg-status-good/15 text-status-good hover:scale-105",
                      state === "current" &&
                        "scale-110 border-accent-cyan bg-gradient-to-br from-accent-cyan to-accent-violet text-plane shadow-glow",
                      state === "locked" && "border-white/10 bg-white/[0.02] text-ink-muted"
                    )}
                  >
                    {state === "done" ? "✓" : state === "locked" ? "🔒" : level}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function QuizScreen({
  topic,
  level,
  questions,
  qIndex,
  onAnswer,
  onExit,
}: {
  topic: Topic;
  level: number;
  questions: QuizQuestion[];
  qIndex: number;
  onAnswer: (selected: number) => void;
  onExit: () => void;
}) {
  const [selected, setSelected] = useState<number | null>(null);
  const question = questions[qIndex];
  const total = questions.length;

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
        eyebrow={`${topic.title} · Level ${level}`}
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
            {qIndex + 1 < total ? "Next question →" : "Finish level →"}
          </button>
        </div>
      )}
    </Card>
  );
}

function LevelComplete({
  topic,
  level,
  questions,
  answers,
  animal,
  onContinue,
  onRetry,
}: {
  topic: Topic;
  level: number;
  questions: QuizQuestion[];
  answers: number[];
  animal: Animal | null;
  onContinue: () => void;
  onRetry: () => void;
}) {
  const total = questions.length;
  const correct = answers.filter((a, i) => a === questions[i].correctIndex).length;
  const pct = Math.round((correct / total) * 100);
  const passed = correct >= Math.ceil(total / 2);

  return (
    <Card>
      <CardHeader eyebrow={`${topic.title} · Level ${level}`} title={passed ? "Level complete!" : "Almost there"} />
      <div className="flex flex-col items-center py-4 text-center">
        <span className="text-5xl">{animal ? animal.emoji : passed ? "🎉" : "💪"}</span>
        <div className="mt-2 text-4xl font-semibold tracking-tight text-ink-primary">
          {correct}
          <span className="text-xl text-ink-muted">/{total}</span>
        </div>
        <p className="mt-1 text-sm text-ink-secondary">
          {pct === 100
            ? "Perfect score — next level unlocked."
            : passed
              ? "Nice work — next level unlocked."
              : "Review the explanations below, then retry to unlock the next level."}
        </p>
      </div>

      <div className="space-y-2">
        {questions.map((q, i) => {
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
        {passed ? (
          <button
            onClick={onContinue}
            className="rounded-lg bg-gradient-to-r from-accent-cyan to-accent-violet px-4 py-2 text-xs font-semibold text-plane hover:opacity-90"
          >
            Continue → Level {level + 1}
          </button>
        ) : (
          <button
            onClick={onRetry}
            className="rounded-lg bg-gradient-to-r from-accent-cyan to-accent-violet px-4 py-2 text-xs font-semibold text-plane hover:opacity-90"
          >
            Retry level
          </button>
        )}
        <button
          onClick={onContinue}
          className="rounded-lg border border-white/10 px-4 py-2 text-xs font-medium text-ink-secondary hover:text-ink-primary"
        >
          Back to path
        </button>
      </div>
    </Card>
  );
}
