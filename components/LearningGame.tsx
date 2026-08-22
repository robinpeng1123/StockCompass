"use client";

import { ReactNode, useEffect, useState } from "react";
import Image from "next/image";
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

type TopicTheme = { gradient: string; glow: string };

const TOPIC_THEME: Record<TopicKey, TopicTheme> = {
  stocks: { gradient: "from-accent-cyan to-accent-violet", glow: "shadow-glow" },
  crypto: { gradient: "from-amber-400 to-orange-500", glow: "shadow-[0_0_24px_rgba(251,191,36,0.35)]" },
  daytrading: { gradient: "from-pink-500 to-rose-500", glow: "shadow-[0_0_24px_rgba(244,63,94,0.35)]" },
  candlesticks: { gradient: "from-emerald-400 to-teal-500", glow: "shadow-[0_0_24px_rgba(52,211,153,0.35)]" },
};

const SECTION_ACCENTS = [
  "border-sky-400/30 bg-sky-400/10 text-sky-300",
  "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
  "border-amber-400/30 bg-amber-400/10 text-amber-300",
  "border-fuchsia-400/30 bg-fuchsia-400/10 text-fuchsia-300",
  "border-rose-400/30 bg-rose-400/10 text-rose-300",
  "border-violet-400/30 bg-violet-400/10 text-violet-300",
];

// A rotating palette of "unit" colors for level badges — like Duolingo's
// per-unit theming, cycling every 5 levels so a long 100-level path reads
// as a colorful, varied trail rather than one flat color block.
const TIER_PALETTE = [
  { gradient: "from-slate-400 to-slate-500", ribbon: "border-slate-400/30 bg-slate-400/15 text-slate-200" },
  { gradient: "from-emerald-400 to-green-500", ribbon: "border-emerald-400/30 bg-emerald-400/15 text-emerald-200" },
  { gradient: "from-sky-400 to-blue-500", ribbon: "border-sky-400/30 bg-sky-400/15 text-sky-200" },
  { gradient: "from-violet-500 to-purple-600", ribbon: "border-violet-400/30 bg-violet-400/15 text-violet-200" },
  { gradient: "from-amber-400 to-yellow-500", ribbon: "border-amber-400/30 bg-amber-400/15 text-amber-100" },
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
  | { view: "greeting"; animalKey: string }
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
    setScreen({ view: "greeting", animalKey: key });
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
  const big = fullscreen;

  let content: ReactNode;

  if (screen.view === "animal") {
    content = <AnimalSelect onSelect={chooseAnimal} big={big} />;
  } else if (screen.view === "greeting") {
    const greetingAnimal = ANIMALS.find((a) => a.key === screen.animalKey)!;
    content = <GreetingScreen animal={greetingAnimal} onContinue={() => setScreen({ view: "topics" })} big={big} />;
  } else if (screen.view === "topics") {
    content = (
      <TopicSelect
        animal={animal}
        unlocked={progress.unlocked}
        onSelectTopic={selectTopic}
        onChangeAnimal={() => setScreen({ view: "animal" })}
        big={big}
      />
    );
  } else if (screen.view === "placementOffer") {
    const topic = TOPICS.find((t) => t.key === screen.topic)!;
    content = (
      <PlacementOffer
        topic={topic}
        onTakeTest={() => setScreen({ view: "placementQuiz", topic: screen.topic, qIndex: 0, answers: [] })}
        onSkip={() => skipPlacement(screen.topic)}
        big={big}
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
        big={big}
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
        big={big}
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
        big={big}
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
        big={big}
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
        big={big}
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
        big={big}
      />
    );
  }

  const scene = screen.view === "lesson" ? "desk" : "city";

  return (
    <GameChrome fullscreen={fullscreen} onToggleFullscreen={() => setFullscreen((v) => !v)} scene={scene}>
      {content}
    </GameChrome>
  );
}

function GameChrome({
  fullscreen,
  onToggleFullscreen,
  scene,
  children,
}: {
  fullscreen: boolean;
  onToggleFullscreen: () => void;
  scene: "city" | "desk";
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
      <div className={cx("relative isolate overflow-hidden rounded-2xl", fullscreen && "min-h-full px-4 py-6 sm:px-10 sm:py-10")}>
        <SceneBackground variant={scene} />
        <div className={cx("relative", fullscreen && "mx-auto max-w-4xl")}>
          <div className="mb-3 flex items-center justify-between">
            <div
              className={cx(
                "flex items-center gap-1.5 font-semibold tracking-tight text-ink-primary",
                fullscreen ? "text-base sm:text-lg" : "text-sm"
              )}
            >
              <span className={fullscreen ? "text-xl" : "text-lg"}>{COMPASS_EMOJI}</span>
              Compass Learning
            </div>
            <button
              onClick={onToggleFullscreen}
              className={cx(
                "flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] font-medium text-ink-secondary hover:text-ink-primary",
                fullscreen ? "px-3 py-2 text-xs" : "px-2.5 py-1.5 text-[11px]"
              )}
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

function SceneBackground({ variant }: { variant: "city" | "desk" }) {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <Image
        src={variant === "desk" ? "/learn/desk-scene.png" : "/learn/city-map.png"}
        alt=""
        fill
        sizes="100vw"
        className="object-cover opacity-[0.22]"
        priority={false}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-plane/70 via-plane/60 to-plane/80" />
      <div className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-accent-cyan/10 blur-3xl" />
      <div className="absolute -right-16 top-6 h-64 w-64 rounded-full bg-accent-violet/10 blur-3xl" />
      <div className="absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-amber-400/10 blur-3xl" />
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

// ---------------------------------------------------------------------------
// Compass + companion "stage" — a shared duo-style character row used
// wherever the rooster and the player's chosen animal share a moment
// (greeting, teaching, celebrating), rather than a single static emoji.
// ---------------------------------------------------------------------------

type Interaction = "talk" | "greet" | "cheer";

function CompanionStage({ animal, interaction, big }: { animal: Animal | null; interaction: Interaction; big?: boolean }) {
  const icon = interaction === "greet" ? "🤝" : interaction === "cheer" ? "🤗" : null;
  const avatarBox = big
    ? "h-20 w-20 text-5xl sm:h-24 sm:w-24 sm:text-6xl"
    : "h-14 w-14 text-3xl sm:h-16 sm:w-16 sm:text-4xl";
  return (
    <div className="flex items-center justify-center gap-3 sm:gap-5">
      <div className="flex flex-col items-center gap-1">
        <div
          className={cx(
            "flex items-center justify-center rounded-full border-2 border-white/10 bg-white/[0.04] shadow-lg",
            avatarBox,
            interaction === "talk" && "animate-bounce-slow"
          )}
        >
          {COMPASS_EMOJI}
        </div>
        <span className="text-[10px] font-semibold text-ink-muted">{COMPASS_NAME}</span>
      </div>
      {icon && (
        <span key={interaction} className={cx("animate-pop-in", big ? "text-3xl sm:text-4xl" : "text-xl sm:text-2xl")}>
          {icon}
        </span>
      )}
      {animal && (
        <div className="flex flex-col items-center gap-1">
          <div className={cx("flex items-center justify-center rounded-full border-2 border-white/10 bg-white/[0.04] shadow-lg", avatarBox)}>
            {animal.emoji}
          </div>
          <span className="text-[10px] font-semibold text-ink-muted">{animal.label}</span>
        </div>
      )}
    </div>
  );
}

function AnimalSelect({ onSelect, big }: { onSelect: (key: string) => void; big?: boolean }) {
  return (
    <div className={cx("flex flex-col items-center text-center", big ? "gap-8 py-12" : "gap-6 py-8")}>
      <div>
        <div className="flex items-center justify-center gap-2 text-sm text-ink-secondary">
          <span className="text-2xl">{COMPASS_EMOJI}</span>
          <span>
            Hi, I'm <span className="font-semibold text-ink-primary">{COMPASS_NAME}</span> — I'll teach you a bit at
            a time as you go.
          </span>
        </div>
        <h2 className={cx("mt-3 font-semibold text-ink-primary", big ? "text-3xl" : "text-xl")}>Pick your companion</h2>
        <p className="mt-1 text-sm text-ink-secondary">They'll stick with you through every level.</p>
      </div>
      <div className={cx("grid grid-cols-2 sm:grid-cols-4", big ? "gap-6" : "gap-4")}>
        {ANIMALS.map((a) => (
          <button
            key={a.key}
            onClick={() => onSelect(a.key)}
            className={cx(
              "glass-panel flex flex-col items-center transition-transform hover:scale-105 hover:border-accent-cyan/40",
              big ? "gap-3 p-10" : "gap-2 p-6"
            )}
          >
            <span className={big ? "text-7xl" : "text-5xl"}>{a.emoji}</span>
            <span className={cx("font-medium text-ink-primary", big ? "text-base" : "text-sm")}>{a.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function GreetingScreen({ animal, onContinue, big }: { animal: Animal; onContinue: () => void; big?: boolean }) {
  return (
    <Card className={big ? "sm:p-10" : undefined}>
      <CardHeader eyebrow="Say hello" title="Meet your teacher" />
      <div className={cx("flex flex-col items-center text-center", big ? "gap-6 py-6" : "gap-4 py-4")}>
        <CompanionStage animal={animal} interaction="greet" big={big} />
        <p className={cx("max-w-sm leading-relaxed text-ink-secondary", big ? "text-base" : "text-sm")}>
          <span className="font-semibold text-ink-primary">{COMPASS_NAME}</span>: "Nice to meet you, {animal.label}!
          Let's get started — I'll teach you a bit at every level."
        </p>
      </div>
      <button
        onClick={onContinue}
        className={cx(
          "w-full rounded-lg bg-gradient-to-r from-accent-cyan to-accent-violet font-semibold text-plane hover:opacity-90",
          big ? "py-3.5 text-base" : "py-2.5 text-sm"
        )}
      >
        Let's go →
      </button>
    </Card>
  );
}

function TopicSelect({
  animal,
  unlocked,
  onSelectTopic,
  onChangeAnimal,
  big,
}: {
  animal: Animal | null;
  unlocked: Record<TopicKey, number>;
  onSelectTopic: (topic: TopicKey) => void;
  onChangeAnimal: () => void;
  big?: boolean;
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

      <div className={cx("grid sm:grid-cols-2", big ? "gap-6" : "gap-4")}>
        {TOPICS.map((t) => {
          const level = unlocked[t.key];
          const complete = level > t.totalLevels;
          const pct = Math.min(100, Math.round(((level - 1) / t.totalLevels) * 100));
          const theme = TOPIC_THEME[t.key];
          return (
            <button
              key={t.key}
              onClick={() => onSelectTopic(t.key)}
              className={cx(
                "glass-panel flex flex-col items-start text-left transition-colors hover:border-white/20 hover:bg-white/[0.04]",
                big ? "gap-3 p-8" : "gap-2 p-5"
              )}
            >
              <div className="flex w-full items-center justify-between">
                <span className={big ? "text-4xl" : "text-2xl"}>{t.emoji}</span>
                <Badge status={complete ? "good" : "neutral"} className={cx(big ? "px-2.5 py-1 text-xs" : "px-2 py-0.5 text-[10px]")}>
                  {complete ? "Complete" : `Level ${level}/${t.totalLevels}`}
                </Badge>
              </div>
              <div className={cx("font-semibold text-ink-primary", big ? "text-xl" : "text-base")}>{t.title}</div>
              <p className={cx("leading-relaxed text-ink-secondary", big ? "text-sm" : "text-xs")}>{t.description}</p>
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
  big,
}: {
  topic: Topic;
  onTakeTest: () => void;
  onSkip: () => void;
  big?: boolean;
}) {
  const theme = TOPIC_THEME[topic.key];
  return (
    <Card className={big ? "sm:p-10" : undefined}>
      <CardHeader eyebrow={topic.title} title="Find your starting level" />
      <div className={cx("flex flex-col items-center text-center", big ? "gap-4 py-6" : "gap-3 py-4")}>
        <span className={big ? "text-6xl" : "text-4xl"}>{topic.emoji}</span>
        <p className={cx("max-w-sm leading-relaxed text-ink-secondary", big ? "text-base" : "text-sm")}>
          Take a quick 20-question placement test and we'll drop you in at a level that matches what you already
          know — or just start from the very beginning if you'd rather build up from scratch.
        </p>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          onClick={onTakeTest}
          className={cx(
            "flex-1 rounded-lg bg-gradient-to-r font-semibold text-plane hover:opacity-90",
            big ? "py-3.5 text-base" : "py-2.5 text-sm",
            theme.gradient
          )}
        >
          Take placement test (20 questions)
        </button>
        <button
          onClick={onSkip}
          className={cx(
            "flex-1 rounded-lg border border-white/10 font-medium text-ink-secondary hover:text-ink-primary",
            big ? "py-3.5 text-base" : "py-2.5 text-sm"
          )}
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
  big,
}: {
  topic: Topic;
  animal: Animal | null;
  correct: number;
  total: number;
  level: number;
  onContinue: () => void;
  big?: boolean;
}) {
  const theme = TOPIC_THEME[topic.key];
  return (
    <Card className={big ? "sm:p-10" : undefined}>
      <CardHeader eyebrow={topic.title} title="Placement test complete" />
      <div className={cx("flex flex-col items-center text-center", big ? "gap-3 py-6" : "gap-2 py-4")}>
        <span className={big ? "text-6xl" : "text-5xl"}>{animal ? animal.emoji : topic.emoji}</span>
        <div className={cx("font-semibold tracking-tight text-ink-primary", big ? "mt-2 text-5xl" : "mt-2 text-4xl")}>
          {correct}
          <span className="text-xl text-ink-muted">/{total}</span>
        </div>
        <p className={cx("text-ink-secondary", big ? "mt-1 text-base" : "mt-1 text-sm")}>
          You're starting at <span className="font-semibold text-ink-primary">Level {level}</span> of{" "}
          {topic.totalLevels}.
        </p>
      </div>
      <button
        onClick={onContinue}
        className={cx(
          "w-full rounded-lg bg-gradient-to-r font-semibold text-plane hover:opacity-90",
          big ? "py-3.5 text-base" : "py-2.5 text-sm",
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
  big,
}: {
  topic: Topic;
  animal: Animal | null;
  unlockedLevel: number;
  onSelectLevel: (level: number) => void;
  onBack: () => void;
  onRetakePlacement: () => void;
  big?: boolean;
}) {
  const theme = TOPIC_THEME[topic.key];
  const levels = Array.from({ length: topic.totalLevels }, (_, i) => i + 1);
  const sections: number[][] = [];
  for (let i = 0; i < levels.length; i += 10) sections.push(levels.slice(i, i + 10));

  const nodeAmplitude = big ? 58 : 40;

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

      {/* Level 1 sits at the top; higher levels follow going down the page — scroll to reach them. */}
      <div className={cx("glass-panel overflow-y-auto p-6", big ? "max-h-[70vh]" : "max-h-[560px]")}>
        {sections.map((section, sIdx) => {
          const accent = SECTION_ACCENTS[sIdx % SECTION_ACCENTS.length];
          return (
            <div key={sIdx} className="mb-8 last:mb-0">
              <div className="mb-5 flex justify-center">
                <span className={cx("rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-wider", accent)}>
                  Levels {section[0]}–{section[section.length - 1]}
                </span>
              </div>
              <div className={cx("flex flex-col items-center", big ? "gap-6" : "gap-4")}>
                {section.map((level) => {
                  const state = level < unlockedLevel ? "done" : level === unlockedLevel ? "current" : "locked";
                  const offset = Math.round(Math.sin(level * 0.9) * nodeAmplitude);
                  const tier = TIER_PALETTE[(level - 1) % TIER_PALETTE.length];
                  const lessonTitle = getLevelLesson(topic.key, level).title;
                  return (
                    <div key={level} className="flex w-full justify-center">
                      <div
                        className="flex flex-col items-center gap-1.5"
                        style={{ transform: `translateX(${offset}px)` }}
                      >
                        <button
                          disabled={state === "locked"}
                          onClick={() => onSelectLevel(level)}
                          className={cx(
                            "relative flex shrink-0 items-center justify-center rounded-full border-4 border-white/15 font-bold text-white shadow-lg transition-transform",
                            big ? "h-20 w-20 text-xl" : "h-16 w-16 text-lg",
                            "bg-gradient-to-br",
                            state === "current" ? cx(theme.gradient, theme.glow, "scale-110 border-white/30") : tier.gradient,
                            state === "locked" && "opacity-60 hover:scale-100",
                            state !== "locked" && "hover:scale-105"
                          )}
                        >
                          {level}
                          {state === "done" && (
                            <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-status-good text-xs text-white ring-2 ring-surface">
                              ✓
                            </span>
                          )}
                          {state === "locked" && (
                            <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-xs ring-2 ring-surface">
                              🔒
                            </span>
                          )}
                        </button>
                        <span
                          className={cx(
                            "max-w-[8.5rem] rounded-full border px-2.5 py-1 text-center text-[10px] font-semibold leading-tight sm:max-w-[10rem]",
                            tier.ribbon
                          )}
                        >
                          {lessonTitle}
                        </span>
                      </div>
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
  big,
}: {
  topic: Topic;
  level: number;
  lesson: Lesson;
  animal: Animal | null;
  onStart: () => void;
  onBack: () => void;
  big?: boolean;
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
    <Card className={big ? "sm:p-10" : undefined}>
      <CardHeader
        eyebrow={`${topic.title} · Level ${level}`}
        title={lesson.title}
        action={
          <button onClick={onBack} className="text-xs font-medium text-ink-muted hover:text-ink-primary">
            Exit
          </button>
        }
      />
      <div className={cx("flex flex-col items-center rounded-xl border border-white/10 bg-white/[0.03]", big ? "gap-4 p-6" : "gap-3 p-4")}>
        <CompanionStage animal={animal} interaction="talk" big={big} />
        <div className="w-full rounded-xl bg-white/[0.02] p-3 sm:p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">{COMPASS_NAME} says</p>
          <p className={cx("mt-1 min-h-[3.5rem] leading-relaxed text-ink-secondary", big ? "text-base" : "text-sm")}>
            {displayed}
            {displayed.length < lesson.body.length && <span className="animate-pulse">▍</span>}
          </p>
        </div>
      </div>
      <button
        onClick={onStart}
        className={cx(
          "mt-4 w-full rounded-lg bg-gradient-to-r font-semibold text-plane hover:opacity-90",
          big ? "py-3.5 text-base" : "py-2.5 text-sm",
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
  big,
}: {
  eyebrow: string;
  theme: TopicTheme;
  questions: QuizQuestion[];
  qIndex: number;
  onAnswer: (selected: number) => void;
  onExit: () => void;
  big?: boolean;
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
    <Card className={big ? "sm:p-10" : undefined}>
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

      <p className={cx("mb-4 font-medium leading-relaxed text-ink-primary", big ? "text-base" : "text-sm")}>{question.prompt}</p>

      <div className={cx(big ? "space-y-3" : "space-y-2")}>
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
                "w-full rounded-xl border text-left transition-colors",
                big ? "px-5 py-4 text-base" : "px-4 py-3 text-sm",
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
          <p className={cx("mt-1.5 leading-relaxed text-ink-secondary", big ? "text-base" : "text-sm")}>{question.explanation}</p>
          <button
            onClick={next}
            className={cx(
              "mt-3 rounded-lg bg-gradient-to-r font-semibold text-plane hover:opacity-90",
              big ? "px-5 py-2.5 text-sm" : "px-4 py-2 text-xs",
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
  big,
}: {
  topic: Topic;
  level: number;
  questions: QuizQuestion[];
  answers: number[];
  animal: Animal | null;
  onContinue: () => void;
  onRetry: () => void;
  big?: boolean;
}) {
  const theme = TOPIC_THEME[topic.key];
  const total = questions.length;
  const correct = answers.filter((a, i) => a === questions[i].correctIndex).length;
  const pct = Math.round((correct / total) * 100);
  const passed = correct >= Math.ceil(total / 2);

  return (
    <Card className={big ? "sm:p-10" : undefined}>
      <CardHeader eyebrow={`${topic.title} · Level ${level}`} title={passed ? "Level complete!" : "Almost there"} />
      <div className={cx("flex flex-col items-center text-center", big ? "gap-3 py-6" : "gap-2 py-4")}>
        {passed && animal ? (
          <CompanionStage animal={animal} interaction="cheer" big={big} />
        ) : (
          <span className={big ? "text-6xl" : "text-5xl"}>{animal ? animal.emoji : passed ? "🎉" : "💪"}</span>
        )}
        <div className={cx("font-semibold tracking-tight text-ink-primary", big ? "mt-2 text-5xl" : "mt-2 text-4xl")}>
          {correct}
          <span className="text-xl text-ink-muted">/{total}</span>
        </div>
        <p className={cx("text-ink-secondary", big ? "text-base" : "text-sm")}>
          {pct === 100
            ? "Perfect score — next level unlocked."
            : passed
              ? "Nice work — next level unlocked."
              : "Review the explanations below, then retry to unlock the next level."}
        </p>
      </div>

      <div className={cx(big ? "space-y-2.5" : "space-y-2")}>
        {questions.map((q, i) => {
          const got = answers[i] === q.correctIndex;
          return (
            <div
              key={q.id}
              className={cx("flex items-start gap-2 rounded-lg border border-white/[0.06] bg-white/[0.02]", big ? "px-4 py-3" : "px-3 py-2")}
            >
              <span className={got ? "text-status-good" : "text-status-critical"}>{got ? "✓" : "✗"}</span>
              <p className={cx("leading-relaxed text-ink-secondary", big ? "text-sm" : "text-xs")}>{q.prompt}</p>
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex gap-2">
        {passed ? (
          <button
            onClick={onContinue}
            className={cx(
              "rounded-lg bg-gradient-to-r font-semibold text-plane hover:opacity-90",
              big ? "px-5 py-2.5 text-sm" : "px-4 py-2 text-xs",
              theme.gradient
            )}
          >
            Continue → Level {level + 1}
          </button>
        ) : (
          <button
            onClick={onRetry}
            className={cx(
              "rounded-lg bg-gradient-to-r font-semibold text-plane hover:opacity-90",
              big ? "px-5 py-2.5 text-sm" : "px-4 py-2 text-xs",
              theme.gradient
            )}
          >
            Retry level
          </button>
        )}
        <button
          onClick={onContinue}
          className={cx(
            "rounded-lg border border-white/10 font-medium text-ink-secondary hover:text-ink-primary",
            big ? "px-5 py-2.5 text-sm" : "px-4 py-2 text-xs"
          )}
        >
          Back to path
        </button>
      </div>
    </Card>
  );
}
