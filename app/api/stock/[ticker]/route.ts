import { NextRequest, NextResponse } from "next/server";
import { getLiveStock } from "@/lib/liveStock";
import { FinnhubError } from "@/lib/finnhub";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ ticker: string }> }) {
  const { ticker } = await params;
  try {
    // Neither consumer of this route (search results, the watchlist) renders
    // P/E, dividend yield or beta — skip that Finnhub call to leave more of
    // the free-tier rate limit for the calls that actually matter.
    const stock = await getLiveStock(ticker, { skipFinancials: true });
    return NextResponse.json({ stock });
  } catch (err) {
    const status = err instanceof FinnhubError ? err.status : 500;
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed to load stock" }, { status });
  }
}
