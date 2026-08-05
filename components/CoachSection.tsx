"use client";

import { useState } from "react";
import { cx } from "@/lib/utils";
import { ErrorBoundary } from "./ErrorBoundary";

export function CoachSection({ children }: { children: React.ReactNode }) {
  const [revealed, setRevealed] = useState(false);

  return (
    <div>
      <button
        onClick={() => setRevealed((r) => !r)}
        className={cx(
          "flex w-full items-center justify-center gap-2.5 rounded-2xl border px-5 py-4 text-sm font-semibold transition-colors",
          revealed
            ? "border-white/10 bg-white/[0.03] text-ink-secondary hover:text-ink-primary"
            : "border-transparent bg-gradient-to-r from-accent-cyan to-accent-violet text-plane hover:opacity-90"
        )}
      >
        <CoachIcon />
        {revealed ? "Hide AI Coach" : "Coach Me!"}
      </button>

      {revealed && (
        <div className="mt-6">
          <ErrorBoundary>{children}</ErrorBoundary>
        </div>
      )}
    </div>
  );
}

function CoachIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path
        d="M7 3.2c-1.9 0-3.2 1.5-3 3.2-1 .5-1.6 1.6-1.4 2.8-.8.7-1 1.9-.3 2.9.4 1.5 1.9 2.4 3.4 2.1.5.9 1.5 1.4 2.5 1.2V3.2Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      <path
        d="M11 3.2c1.9 0 3.2 1.5 3 3.2 1 .5 1.6 1.6 1.4 2.8.8.7 1 1.9.3 2.9-.4 1.5-1.9 2.4-3.4 2.1-.5.9-1.5 1.4-2.5 1.2V3.2Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
    </svg>
  );
}
