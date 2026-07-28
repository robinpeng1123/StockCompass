const FEATURES = [
  { emoji: "🧠", title: "AI Trading Coach", desc: "Avoid emotional mistakes and learn from your own trade history." },
  { emoji: "📊", title: "Market Storytelling", desc: "Why a stock moved — news, earnings and technicals on one timeline." },
  { emoji: "🔍", title: "Conversational Search", desc: "Describe what you want in plain English instead of filter forms." },
  { emoji: "⚠️", title: "Risk Predictor", desc: "Concentration, volatility and event warnings before they bite." },
  { emoji: "🎓", title: "Interactive Learning", desc: "Concepts taught through the real stocks you're already exploring." },
];

export function FeatureStrip() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {FEATURES.map((f) => (
        <div key={f.title} className="glass-panel p-3.5">
          <div className="text-lg">{f.emoji}</div>
          <div className="mt-1 text-xs font-semibold text-ink-primary">{f.title}</div>
          <p className="mt-0.5 text-[11px] leading-snug text-ink-muted">{f.desc}</p>
        </div>
      ))}
    </div>
  );
}
