"use client";

import { ReactNode, useEffect, useState } from "react";
import {
  ANIMALS,
  Animal,
  TOPICS,
  Topic,
  TopicKey,
  getLevelQuestions,
  getLevelLesson,
  getPlacementQuestions,
  placementLevelFromScore,
  QuizQuestion,
  Lesson,
} from "@/lib/learningGame";
import { CandlestickChart } from "@/components/ui/CandlestickChart";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { cx } from "@/lib/utils";

const STORAGE_KEY = "stockcompass:learninggame:v3";

const COMPASS_EMOJI = "🐓";
const COMPASS_NAME = "Compass";

type TopicTheme = { gradient: string; glow: string; plants: string[] };

const TOPIC_THEME: Record<TopicKey, TopicTheme> = {
  stocks: { gradient: "from-accent-cyan to-accent-violet", glow: "shadow-glow", plants: ["🌳", "🌿", "🍀", "🌻"] },
  crypto: {
    gradient: "from-amber-400 to-orange-500",
    glow: "shadow-[0_0_24px_rgba(251,191,36,0.35)]",
    plants: ["🌵", "🪸", "✨", "🌾"],
  },
  daytrading: {
    gradient: "from-pink-500 to-rose-500",
    glow: "shadow-[0_0_24px_rgba(244,63,94,0.35)]",
    plants: ["🌴", "🔥", "🌺", "🍁"],
  },
  candlesticks: {
    gradient: "from-emerald-400 to-teal-500",
    glow: "shadow-[0_0_24px_rgba(52,211,153,0.35)]",
    plants: ["🌲", "🍃", "🌱", "🍄"],
  },
};

const SECTION_ACCENTS = [
  "border-sky-400/30 bg-sky-400/10 text-sky-300",
  "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
  "border-amber-400/30 bg-amber-400/10 text-amber-300",
  "border-fuchsia-400/30 bg-fuchsia-400/10 text-fuchsia-300",
  "border-rose-400/30 bg-rose-400/10 text-rose-300",
  "border-violet-400/30 bg-violet-400/10 text-violet-300",
];

type Progress = {
  animalKey: string | null;
  unlocked: Record<TopicKey, number>; // highest playable level per topic, 1-indexed
  placementTaken: Record<TopicKey, boolean>;
};

const DEFAULT_PROGRESS: Progress = {
  animalKey: null,
  unlocked: { stocks: 1, crypto: 1, daytrading: 1, candlesticks: 1 },
  placementTaken: { stocks: false, crypto: false, daytrading: false, candlesticks: false },
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
      placementTaken: { ...DEFAULT_PROGRESS.placementTaken, ...(parsed.placementTaken ?? {}) },
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
  | { view: "placementOffer"; topic: TopicKey }
  | { view: "placementQuiz"; topic: TopicKey; qIndex: number; answers: number[] }
  | { view: "placementResult"; topic: TopicKey; answers: number[] }
  | { view: "path"; topic: TopicKey }
  | { view: "lesson"; topic: TopicKey; level: number }
  | { view: "quiz"; topic: TopicKey; level: number; qIndex: number; answers: number[] }
  | { view: "levelComplete"; topic: TopicKey; level: number; answers: number[] };

export function LearningGame() {
  const [progress, setProgress] = useState<Progress>(DEFAULT_PROGRESS);
  const [ready, setReady] = useState(false);
  const [screen, setScreen] = useState<Screen>({ view: "animal" });
  const [fullscreen, setFullscreen] = useState(false);

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

  function selectTopic(topic: TopicKey) {
    if (progress.unlocked[topic] === 1 && !progress.placementTaken[topic]) {
      setScreen({ view: "placementOffer", topic });
    } else {
      setScreen({ view: "path", topic });
    }
  }

  function skipPlacement(topic: TopicKey) {
    const next = { ...progress, placementTaken: { ...progress.placementTaken, [topic]: true } };
    setProgress(next);
    saveProgress(next);
    setScreen({ view: "path", topic });
  }

  function handlePlacementAnswer(selected: number) {
    if (screen.view !== "placementQuiz") return;
    const questions = getPlacementQuestions(screen.topic);
    const answers = [...screen.answers, selected];
    if (screen.qIndex + 1 < questions.length) {
      setScreen({ ...screen, qIndex: screen.qIndex + 1, answers });
      return;
    }
    const correct = answers.filter((a, i) => a === questions[i].correctIndex).length;
    const topicDef = TOPICS.find((t) => t.key === screen.topic)!;
    const level = placementLevelFromScore(correct, questions.length, topicDef.totalLevels);
    const next = {
      ...progress,
      unlocked: { ...progress.unlocked, [screen.topic]: Math.max(progress.unlocked[screen.topic], level) },
      placementTaken: { ...progress.placementTaken, [screen.topic]: true },
    };
    setProgress(next);
    saveProgress(next);
    setScreen({ view: "placementResult", topic: screen.topic, answers });
  }

  function startLevel(topic: TopicKey, level: number) {
    setScreen({ view: "lesson", topic, level });
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

  let content: ReactNode;

  if (screen.view === "animal") {
    content = <AnimalSelect onSelect={chooseAnimal} />;
  } else if (screen.view === "topics") {
    content = (
      <TopicSelect
        animal={animal}
        unlocked={progress.unlocked}
        onSelectTopic={selectTopic}
        onChangeAnimal={() => setScreen({ view: "animal" })}
      />
    );
  } else if (screen.view === "placementOffer") {
    const topic = TOPICS.find((t) => t.key === screen.topic)!;
    content = (
      <PlacementOffer
        topic={topic}
        onTakeTest={() => setScreen({ view: "placementQuiz", topic: screen.topic, qIndex: 0, answers: [] })}
        onSkip={() => skipPlacement(screen.topic)}
      />
    );
  } else if (screen.view === "placementQuiz") {
    const topic = TOPICS.find((t) => t.key === screen.topic)!;
    const questions = getPlacementQuestions(screen.topic);
    content = (
      <QuizScreen
        eyebrow={`${topic.title} · Placement test`}
        theme={TOPIC_THEME[topic.key]}
        questions={questions}
        qIndex={screen.qIndex}
        onAnswer={handlePlacementAnswer}
        onExit={() => setScreen({ view: "topics" })}
      />
    );
  } else if (screen.view === "placementResult") {
    const topic = TOPICS.find((t) => t.key === screen.topic)!;
    const questions = getPlacementQuestions(screen.topic);
    const correct = screen.answers.filter((a, i) => a === questions[i].correctIndex).length;
    const level = placementLevelFromScore(correct, questions.length, topic.totalLevels);
    content = (
      <PlacementResult
        topic={topic}
        animal={animal}
        correct={correct}
        total={questions.length}
        level={level}
        onContinue={() => setScreen({ view: "path", topic: screen.topic })}
      />
    );
  } else if (screen.view === "path") {
    const topic = TOPICS.find((t) => t.key === screen.topic)!;
    content = (
      <LevelPath
        topic={topic}
        animal={animal}
        unlockedLevel={progress.unlocked[topic.key]}
        onSelectLevel={(level) => startLevel(topic.key, level)}
        onBack={() => setScreen({ view: "topics" })}
        onRetakePlacement={() => setScreen({ view: "placementOffer", topic: topic.key })}
      />
    );
  } else if (screen.view === "lesson") {
    const topic = TOPICS.find((t) => t.key === screen.topic)!;
    const lesson = getLevelLesson(screen.topic, screen.level);
    content = (
      <LessonScreen
        topic={topic}
        level={screen.level}
        lesson={lesson}
        animal={animal}
        onStart={() => setScreen({ view: "quiz", topic: screen.topic, level: screen.level, qIndex: 0, answers: [] })}
        onBack={() => setScreen({ view: "path", topic: screen.topic })}
      />
    );
  } else if (screen.view === "quiz") {
    const topic = TOPICS.find((t) => t.key === screen.topic)!;
    const questions = getLevelQuestions(screen.topic, screen.level);
    content = (
      <QuizScreen
        eyebrow={`${topic.title} · Level ${screen.level}`}
        theme={TOPIC_THEME[topic.key]}
        questions={questions}
        qIndex={screen.qIndex}
        onAnswer={handleAnswer}
        onExit={() => setScreen({ view: "path", topic: screen.topic })}
      />
    );
  } else {
    const topic = TOPICS.find((t) => t.key === screen.topic)!;
    const questions = getLevelQuestions(screen.topic, screen.level);
    content = (
      <LevelComplete
        topic={topic}
        level={screen.level}
        questions={questions}
        answers={screen.answers}
        animal={animal}
        onContinue={() => setScreen({ view: "path", topic: screen.topic })}
        onRetry={() => setScreen({ view: "quiz", topic: screen.topic, level: screen.level, qIndex: 0, answers: [] })}
      />
    );
  }

  return (
    <GameChrome fullscreen={fullscreen} onToggleFullscreen={() => setFullscreen((v) => !v)}>
      {content}
    </GameChrome>
  );
}

function GameChrome({
  fullscreen,
  onToggleFullscreen,
  children,
}: {
  fullscreen: boolean;
  onToggleFullscreen: () => void;
  children: ReactNode;
}) {
  useEffect(() => {
    if (!fullscreen) return;
    window.scrollTo(0, 0);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onToggleFullscreen();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [fullscreen, onToggleFullscreen]);

  return (
    <div className={cx(fullscreen && "!mt-0 fixed inset-0 z-50 overflow-y-auto bg-plane")}>
      <div className={cx("relative isolate overflow-hidden rounded-2xl", fullscreen && "min-h-full px-4 py-6 sm:px-8 sm:py-10")}>
        <ColorfulBackground />
        <div className={cx("relative", fullscreen && "mx-auto max-w-2xl")}>
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-sm font-semibold tracking-tight text-ink-primary">
              <span className="text-lg">{COMPASS_EMOJI}</span>
              Compass Learning
            </div>
            <button
              onClick={onToggleFullscreen}
              className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1.5 text-[11px] font-medium text-ink-secondary hover:text-ink-primary"
            >
              {fullscreen ? <IconCollapse /> : <IconExpand />}
              {fullscreen ? "Exit fullscreen" : "Fullscreen"}
            </button>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}

function ColorfulBackground() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <div className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-accent-cyan/20 blur-3xl" />
      <div className="absolute -right-16 top-6 h-64 w-64 rounded-full bg-accent-violet/20 blur-3xl" />
      <div className="absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-amber-400/10 blur-3xl" />
      <div className="absolute -bottom-20 right-1/4 h-72 w-72 rounded-full bg-rose-500/10 blur-3xl" />
      <div className="absolute bottom-1/3 left-8 h-56 w-56 rounded-full bg-emerald-400/10 blur-3xl" />
    </div>
  );
}

function IconExpand() {
  return (
    <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
      <path
        d="M5 2H2v3M9 2h3v3M5 12H2V9M9 12h3V9"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function IconCollapse() {
  return (
    <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
      <path
        d="M2 5h3V2M12 5H9V2M2 9h3v3M12 9H9v3"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function AnimalSelect({ onSelect }: { onSelect: (key: string) => void }) {
  return (
    <div className="flex flex-col items-center gap-6 py-8 text-center">
      <div>
        <div className="flex items-center justify-center gap-2 text-sm text-ink-secondary">
          <span className="text-2xl">{COMPASS_EMOJI}</span>
          <span>
            Hi, I'm <span className="font-semibold text-ink-primary">{COMPASS_NAME}</span> — I'll teach you a bit at
            a time as you go.
          </span>
        </div>
        <h2 className="mt-3 text-xl font-semibold text-ink-primary">Pick your companion</h2>
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
          const theme = TOPIC_THEME[t.key];
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
                <div className={cx("h-full rounded-full bg-gradient-to-r", theme.gradient)} style={{ width: `${pct}%` }} />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function PlacementOffer({
  topic,
  onTakeTest,
  onSkip,
}: {
  topic: Topic;
  onTakeTest: () => void;
  onSkip: () => void;
}) {
  const theme = TOPIC_THEME[topic.key];
  return (
    <Card>
      <CardHeader eyebrow={topic.title} title="Find your starting level" />
      <div className="flex flex-col items-center gap-3 py-4 text-center">
        <span className="text-4xl">{topic.emoji}</span>
        <p className="max-w-sm text-sm leading-relaxed text-ink-secondary">
          Take a quick 20-question placement test and we'll drop you in at a level that matches what you already
          know — or just start from the very beginning if you'd rather build up from scratch.
        </p>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          onClick={onTakeTest}
          className={cx(
            "flex-1 rounded-lg bg-gradient-to-r px-4 py-2.5 text-sm font-semibold text-plane hover:opacity-90",
            theme.gradient
          )}
        >
          Take placement test (20 questions)
        </button>
        <button
          onClick={onSkip}
          className="flex-1 rounded-lg border border-white/10 px-4 py-2.5 text-sm font-medium text-ink-secondary hover:text-ink-primary"
        >
          Skip — start at Level 1
        </button>
      </div>
    </Card>
  );
}

function PlacementResult({
  topic,
  animal,
  correct,
  total,
  level,
  onContinue,
}: {
  topic: Topic;
  animal: Animal | null;
  correct: number;
  total: number;
  level: number;
  onContinue: () => void;
}) {
  const theme = TOPIC_THEME[topic.key];
  return (
    <Card>
      <CardHeader eyebrow={topic.title} title="Placement test complete" />
      <div className="flex flex-col items-center gap-2 py-4 text-center">
        <span className="text-5xl">{animal ? animal.emoji : topic.emoji}</span>
        <div className="mt-2 text-4xl font-semibold tracking-tight text-ink-primary">
          {correct}
          <span className="text-xl text-ink-muted">/{total}</span>
        </div>
        <p className="mt-1 text-sm text-ink-secondary">
          You're starting at <span className="font-semibold text-ink-primary">Level {level}</span> of{" "}
          {topic.totalLevels}.
        </p>
      </div>
      <button
        onClick={onContinue}
        className={cx(
          "w-full rounded-lg bg-gradient-to-r px-4 py-2.5 text-sm font-semibold text-plane hover:opacity-90",
          theme.gradient
        )}
      >
        Start learning →
      </button>
    </Card>
  );
}

function LevelPath({
  topic,
  animal,
  unlockedLevel,
  onSelectLevel,
  onBack,
  onRetakePlacement,
}: {
  topic: Topic;
  animal: Animal | null;
  unlockedLevel: number;
  onSelectLevel: (level: number) => void;
  onBack: () => void;
  onRetakePlacement: () => void;
}) {
  const theme = TOPIC_THEME[topic.key];
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

      <div className="flex justify-center">
        <button onClick={onRetakePlacement} className="text-[11px] font-medium text-ink-muted hover:text-ink-primary">
          Retake placement test
        </button>
      </div>

      <div className="glass-panel max-h-[560px] overflow-y-auto p-6">
        {sections.map((section, sIdx) => {
          const accent = SECTION_ACCENTS[sIdx % SECTION_ACCENTS.length];
          return (
            <div key={sIdx} className="mb-6 last:mb-0">
              <div className="mb-4 flex justify-center">
                <span className={cx("rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-wider", accent)}>
                  Levels {section[0]}–{section[section.length - 1]}
                </span>
              </div>
              <div className="flex flex-col items-center gap-3">
                {section.map((level) => {
                  const state = level < unlockedLevel ? "done" : level === unlockedLevel ? "current" : "locked";
                  const offset = Math.round(Math.sin(level * 0.9) * 46);
                  const plantSide = offset >= 0 ? -1 : 1;
                  const plant = theme.plants[level % theme.plants.length];
                  return (
                    <div key={level} className="relative flex h-16 w-full items-center justify-center">
                      <span
                        aria-hidden
                        className="pointer-events-none absolute select-none text-xl opacity-60 sm:text-2xl"
                        style={{ transform: `translateX(${offset + plantSide * 78}px)` }}
                      >
                        {plant}
                      </span>
                      <button
                        disabled={state === "locked"}
                        onClick={() => onSelectLevel(level)}
                        style={{ transform: `translateX(${offset}px)` }}
                        className={cx(
                          "relative flex h-14 w-14 shrink-0 items-center justify-center rounded-full border text-sm font-semibold transition-transform",
                          state === "done" && "border-status-good/40 bg-status-good/15 text-status-good hover:scale-105",
                          state === "current" && cx("scale-110 border-white/20 bg-gradient-to-br text-plane", theme.gradient, theme.glow),
                          state === "locked" && "border-white/10 bg-white/[0.02] text-ink-muted"
                        )}
                      >
                        {state === "done" ? "✓" : state === "locked" ? "🔒" : level}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function LessonScreen({
  topic,
  level,
  lesson,
  animal,
  onStart,
  onBack,
}: {
  topic: Topic;
  level: number;
  lesson: Lesson;
  animal: Animal | null;
  onStart: () => void;
  onBack: () => void;
}) {
  const theme = TOPIC_THEME[topic.key];
  const [displayed, setDisplayed] = useState("");

  useEffect(() => {
    setDisplayed("");
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setDisplayed(lesson.body.slice(0, i));
      if (i >= lesson.body.length) clearInterval(id);
    }, 16);
    return () => clearInterval(id);
  }, [lesson.body]);

  return (
    <Card>
      <CardHeader
        eyebrow={`${topic.title} · Level ${level}`}
        title={lesson.title}
        action={
          <button onClick={onBack} className="text-xs font-medium text-ink-muted hover:text-ink-primary">
            Exit
          </button>
        }
      />
      <div className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4">
        <span className="text-3xl">{COMPASS_EMOJI}</span>
        <div>
          <p className="text-xs font-semibold text-ink-muted">{COMPASS_NAME}</p>
          <p className="mt-1 min-h-[3.5rem] text-sm leading-relaxed text-ink-secondary">
            {displayed}
            {displayed.length < lesson.body.length && <span className="animate-pulse">▍</span>}
          </p>
        </div>
      </div>
      {animal && (
        <p className="mt-2 text-center text-[11px] text-ink-muted">
          {animal.emoji} {animal.label} is cheering you on
        </p>
      )}
      <button
        onClick={onStart}
        className={cx(
          "mt-4 w-full rounded-lg bg-gradient-to-r px-4 py-2.5 text-sm font-semibold text-plane hover:opacity-90",
          theme.gradient
        )}
      >
        Start quiz →
      </button>
    </Card>
  );
}

function QuizScreen({
  eyebrow,
  theme,
  questions,
  qIndex,
  onAnswer,
  onExit,
}: {
  eyebrow: string;
  theme: TopicTheme;
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
        eyebrow={eyebrow}
        title={`Question ${qIndex + 1} of ${total}`}
        action={
          <button onClick={onExit} className="text-xs font-medium text-ink-muted hover:text-ink-primary">
            Exit
          </button>
        }
      />

      <div className="mb-4 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.07]">
        <div
          className={cx("h-full rounded-full bg-gradient-to-r transition-[width] duration-300", theme.gradient)}
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
            className={cx(
              "mt-3 rounded-lg bg-gradient-to-r px-4 py-2 text-xs font-semibold text-plane hover:opacity-90",
              theme.gradient
            )}
          >
            {qIndex + 1 < total ? "Next question →" : "Finish →"}
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
  const theme = TOPIC_THEME[topic.key];
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
            className={cx(
              "rounded-lg bg-gradient-to-r px-4 py-2 text-xs font-semibold text-plane hover:opacity-90",
              theme.gradient
            )}
          >
            Continue → Level {level + 1}
          </button>
        ) : (
          <button
            onClick={onRetry}
            className={cx(
              "rounded-lg bg-gradient-to-r px-4 py-2 text-xs font-semibold text-plane hover:opacity-90",
              theme.gradient
            )}
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
