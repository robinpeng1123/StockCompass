import { FinnhubNewsItem } from "@/lib/finnhub";
import { Card, CardHeader } from "./ui/Card";
import { formatTimeAgo } from "@/lib/utils";

export function StockNews({ ticker, news }: { ticker: string; news: FinnhubNewsItem[] }) {
  return (
    <Card>
      <CardHeader eyebrow={ticker} title="Recent News" icon={<NewsIcon />} />
      {news.length === 0 ? (
        <p className="text-sm text-ink-muted">No recent news found for {ticker}.</p>
      ) : (
        <ul className="space-y-3.5">
          {news.slice(0, 6).map((n, i) => (
            <li key={i}>
              <a href={n.url} target="_blank" rel="noopener noreferrer" className="group block">
                <p className="text-sm leading-snug text-ink-primary group-hover:text-accent-cyan">{n.headline}</p>
                <div className="mt-1 flex items-center gap-1.5 text-[11px] text-ink-muted">
                  <span className="font-medium text-ink-secondary">{n.source}</span>
                  <span>·</span>
                  <span>{formatTimeAgo(n.datetime)}</span>
                </div>
              </a>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function NewsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <rect x="2.5" y="3.5" width="13" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M5 7h8M5 9.5h8M5 12h5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}
