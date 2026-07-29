"use client";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const rateLimited = /rate limit/i.test(error.message);

  return (
    <div className="mx-auto flex max-w-lg flex-col items-center gap-4 py-24 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03]">
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
          <path
            d="M11 7v5M11 15.5h.01M3.5 18.5h15L11 3.5 3.5 18.5Z"
            stroke="#fab219"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <h2 className="text-lg font-semibold text-ink-primary">
        {rateLimited ? "Live market data is rate-limited right now" : "Something didn't load"}
      </h2>
      <p className="max-w-sm text-sm leading-relaxed text-ink-secondary">
        {rateLimited
          ? "Finnhub's free tier caps how many requests can come through per minute. Give it a few seconds and try again."
          : "The live market data feed didn't respond. This can happen if the API key is missing or a symbol has no data."}
      </p>
      <button
        onClick={reset}
        className="rounded-xl bg-gradient-to-r from-accent-cyan to-accent-violet px-5 py-2.5 text-sm font-semibold text-plane hover:opacity-90"
      >
        Try again
      </button>
    </div>
  );
}
