import Link from "next/link";

const FEATURES = [
  { emoji: "💼", title: "Portfolio Copilot", desc: "Build a watchlist and see your sector concentration and risk explained.", href: "/portfolio" },
  { emoji: "📊", title: "Market Storytelling", desc: "The market's biggest headlines, with sources.", href: "/market-stories" },
  { emoji: "🔍", title: "Conversational Search", desc: "Describe what you want in plain English instead of filter forms.", href: "/screener" },
  { emoji: "🎓", title: "Interactive Learning", desc: "Concepts taught through the real stocks you're already exploring.", href: "/learn" },
];

export function FeatureStrip() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {FEATURES.map((f) => (
        <Link key={f.title} href={f.href} className="glass-panel block p-3.5 transition-colors hover:border-white/20 hover:bg-white/[0.04]">
          <div className="text-lg">{f.emoji}</div>
          <div className="mt-1 text-xs font-semibold text-ink-primary">{f.title}</div>
          <p className="mt-0.5 text-[11px] leading-snug text-ink-muted">{f.desc}</p>
        </Link>
      ))}
    </div>
  );
}
