import { NaturalLanguageSearch } from "@/components/NaturalLanguageSearch";
import { Card, CardHeader } from "@/components/ui/Card";

export default function ScreenerPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink-primary">Conversational Stock Search</h1>
        <p className="mt-1 text-sm text-ink-secondary">
          Skip the dozens of filter checkboxes — describe what you&apos;re looking for in plain English.
        </p>
      </div>

      <Card>
        <NaturalLanguageSearch />
      </Card>

      <Card>
        <CardHeader eyebrow="How it works" title="Behind the scenes" />
        <p className="text-sm leading-relaxed text-ink-secondary">
          Your request is translated into concrete screening criteria — valuation, sector, momentum, volatility,
          dividend yield — shown above your results as plain-language chips, so you always know exactly what the AI
          searched for.
        </p>
      </Card>
    </div>
  );
}
