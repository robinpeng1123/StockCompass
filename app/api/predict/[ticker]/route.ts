import { NextResponse } from "next/server";
import { getLiveStock } from "@/lib/liveStock";
import { getAIScenarios } from "@/lib/aiScenarios";
import { FinnhubError } from "@/lib/finnhub";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ ticker: string }> }) {
  const { ticker } = await params;

  let stock;
  try {
    stock = await getLiveStock(ticker);
  } catch (err) {
    if (err instanceof FinnhubError && (err.status === 404 || err.status === 400)) {
      return NextResponse.json({ error: "Unknown ticker." }, { status: 404 });
    }
    return NextResponse.json({ error: "Failed to load stock data." }, { status: 502 });
  }

  const result = await getAIScenarios(stock);
  return NextResponse.json(result);
}
