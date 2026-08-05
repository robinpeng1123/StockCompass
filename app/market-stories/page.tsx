import Link from "next/link";
import { getMarketNews } from "@/lib/finnhub";
import { formatTimeAgo } from "@/lib/utils";
import { Card } from "@/components/ui/Card";

export const dynamic = "force-dynamic";

export default async function MarketStoriesPage() {
  const news = await getMarketNews().catch(() => []);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink-primary">Market Stories</h1>
        <p className="mt-1 text-sm text-ink-secondary">The market's biggest headlines, pulled live — with sources.</p>
      </div>

      {news.length === 0 ? (
        <Card>
          <p className="text-sm text-ink-muted">No market news available right now — try again shortly.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {news.slice(0, 30).map((n, i) => {
            const relatedTickers = n.related ? n.related.split(",").map((t) => t.trim()).filter(Boolean).slice(0, 3) : [];
            // Wire-syndicated stories (Reuters, AP, etc.) often reuse the same
            // generic outlet logo for every headline rather than a real photo
            // — repeating identically across consecutive items is the tell.
            // object-cover crops those into an unreadable fragment, so show a
            // source-initial badge instead when the image isn't distinctive.
            const isGenericLogo = i > 0 && n.image && n.image === news[i - 1].image;
            return (
              <Card key={i} className="flex gap-4">
                {n.image && !isGenericLogo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={n.image}
                    alt=""
                    className="h-16 w-16 shrink-0 rounded-lg bg-white/5 object-contain p-1 sm:h-20 sm:w-28"
                  />
                ) : (
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-white/5 text-lg font-semibold text-ink-muted sm:h-20 sm:w-28">
                    {n.source.slice(0, 1).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <a href={n.url} target="_blank" rel="noopener noreferrer" className="group block">
                    <p className="text-sm font-medium leading-snug text-ink-primary group-hover:text-accent-cyan">{n.headline}</p>
                  </a>
                  {n.summary && <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-ink-secondary">{n.summary}</p>}
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-ink-muted">
                    <span className="font-medium text-ink-secondary">{n.source}</span>
                    <span>·</span>
                    <span>{formatTimeAgo(n.datetime)}</span>
                    {relatedTickers.map((t) => (
                      <Link
                        key={t}
                        href={`/stock/${t}`}
                        className="rounded-full border border-white/10 px-2 py-0.5 font-semibold text-ink-secondary hover:border-accent-cyan/40 hover:text-accent-cyan"
                      >
                        {t}
                      </Link>
                    ))}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
