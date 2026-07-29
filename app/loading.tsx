export default function Loading() {
  return (
    <div className="mx-auto flex max-w-7xl items-center gap-3 py-24 text-sm text-ink-secondary">
      <span className="h-2.5 w-2.5 animate-pulse-soft rounded-full bg-accent-cyan" />
      Fetching live market data…
    </div>
  );
}
