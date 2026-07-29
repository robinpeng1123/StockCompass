import { NextRequest, NextResponse } from "next/server";
import { getQuote, FinnhubError } from "@/lib/finnhub";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ ticker: string }> }) {
  const { ticker } = await params;
  try {
    const quote = await getQuote(ticker);
    return NextResponse.json({ quote });
  } catch (err) {
    const status = err instanceof FinnhubError ? err.status : 500;
    return NextResponse.json({ error: err instanceof Error ? err.message : "Quote lookup failed" }, { status });
  }
}
