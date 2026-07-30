import { GLOSSARY, VIDEOS } from "@/lib/mockData";
import { GlossaryCard } from "@/components/GlossaryCard";
import { VideoCard } from "@/components/VideoCard";
import { Card, CardHeader } from "@/components/ui/Card";

export default function LearnPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink-primary">Interactive Learning</h1>
        <p className="mt-1 text-sm text-ink-secondary">
          Investing concepts explained through real, current stocks — not a separate course.
        </p>
      </div>

      <Card>
        <CardHeader eyebrow="How to use this" title="Learn where you already are" />
        <p className="text-sm leading-relaxed text-ink-secondary">
          Every concept below links to a live example elsewhere on StockCompass — the same pattern card, risk meter,
          or scenario table you&apos;d see while researching a stock. Click a term, then follow the link to see it in
          context.
        </p>
      </Card>

      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-muted">Video lessons</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {VIDEOS.map((video) => (
            <VideoCard key={video.videoId} video={video} />
          ))}
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-muted">Concepts</h2>
        <div className="space-y-3">
          {GLOSSARY.map((term) => (
            <GlossaryCard key={term.term} term={term} />
          ))}
        </div>
      </div>
    </div>
  );
}
