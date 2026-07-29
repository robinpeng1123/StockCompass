import { NextRequest, NextResponse } from "next/server";
import { getHistory } from "@/lib/yahooHistory";
import { parseRangeKey } from "@/lib/chartRanges";

export async function GET(req: NextRequest, { params }: { params: Promise<{ ticker: string }> }) {
  const { ticker } = await params;
  const rangeKey = parseRangeKey(req.nextUrl.searchParams.get("range"));

  try {
    const points = await getHistory(ticker, rangeKey);
    return NextResponse.json({ points, rangeKey });
  } catch (err) {
    return NextResponse.json({ points: [], error: err instanceof Error ? err.message : "History lookup failed" }, { status: 500 });
  }
}
