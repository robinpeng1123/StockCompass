import { NextResponse } from "next/server";
import { getLiveCuratedUniverse } from "@/lib/liveStock";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const stocks = await getLiveCuratedUniverse();
    return NextResponse.json({ stocks });
  } catch (err) {
    return NextResponse.json({ stocks: [], error: err instanceof Error ? err.message : "Failed to load universe" }, { status: 500 });
  }
}
