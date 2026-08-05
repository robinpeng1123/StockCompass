"use client";

import { ReactNode, useEffect, useRef, useState } from "react";

export type CarouselTab = {
  key: string;
  label: string;
  desc: string;
  color: string;
  emoji: string;
  content: ReactNode;
};

/**
 * N color-coded selector cards above a shared viewport that slides
 * horizontally to the active tab, animating its own height to match
 * whichever panel is showing (each panel keeps its natural height via
 * self-start — a plain flex row would otherwise size the container to
 * the tallest panel always, leaving empty space under shorter ones).
 */
export function TabCarousel({ tabs }: { tabs: CarouselTab[] }) {
  const [active, setActive] = useState(0);
  const panelRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [height, setHeight] = useState<number>();

  useEffect(() => {
    const el = panelRefs.current[active];
    if (el) setHeight(el.scrollHeight);
  }, [active, tabs]);

  return (
    <div className="space-y-4">
      <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}>
        {tabs.map((t, i) => {
          const isActive = active === i;
          return (
            <button
              key={t.key}
              onClick={() => setActive(i)}
              className="glass-panel p-3.5 text-left transition-colors hover:bg-white/[0.04]"
              style={isActive ? { borderColor: `${t.color}80`, backgroundColor: `${t.color}14` } : undefined}
            >
              <div className="text-lg">{t.emoji}</div>
              <div className="mt-1 text-xs font-semibold" style={{ color: isActive ? t.color : undefined }}>
                {t.label}
              </div>
              <p className="mt-0.5 text-[11px] leading-snug text-ink-muted">{t.desc}</p>
            </button>
          );
        })}
      </div>

      <div className="overflow-hidden transition-[height] duration-500 ease-out" style={{ height }}>
        <div
          className="flex transition-transform duration-500 ease-out"
          style={{ width: `${tabs.length * 100}%`, transform: `translateX(-${active * (100 / tabs.length)}%)` }}
        >
          {tabs.map((t, i) => (
            <div
              key={t.key}
              ref={(el) => {
                panelRefs.current[i] = el;
              }}
              className="shrink-0 space-y-4 self-start px-0.5"
              style={{ width: `${100 / tabs.length}%` }}
            >
              {t.content}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
