"use client";

import { Component, ReactNode } from "react";

export class ErrorBoundary extends Component<{ children: ReactNode; fallback?: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode; fallback?: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    // eslint-disable-next-line no-console
    console.error("Section failed to render:", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="rounded-2xl border border-status-warning/20 bg-status-warning/[0.04] p-5 text-sm text-ink-secondary">
            This section couldn&apos;t load. Try refreshing the page.
          </div>
        )
      );
    }
    return this.props.children;
  }
}
