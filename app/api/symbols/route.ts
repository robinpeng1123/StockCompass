import { NextRequest, NextResponse } from "next/server";
import { searchUSSymbols, FinnhubError } from "@/lib/finnhub";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") ?? "";
  if (q.trim().length < 1) return NextResponse.json({ results: [] });

  try {
    const results = await searchUSSymbols(q, 20);
    return NextResponse.json({ results });
  } catch (err) {
    const status = err instanceof FinnhubError ? err.status : 500;
    return NextResponse.json({ results: [], error: err instanceof Error ? err.message : "Symbol search failed" }, { status });
  }
}
