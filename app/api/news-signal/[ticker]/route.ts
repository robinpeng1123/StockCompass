import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isAdminEmail } from "@/lib/admin";
import { scoreNewsSentiment } from "@/lib/newsSentiment";

export const dynamic = "force-dynamic";

/** Public — anyone viewing a ticker sees the same admin-curated news signals. */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ ticker: string }> }) {
  const { ticker } = await params;
  try {
    const rows = await prisma.newsSignal.findMany({
      where: { ticker: ticker.toUpperCase() },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json({
      entries: rows.map((r) => ({ id: r.id, text: r.text, score: r.score, createdAt: r.createdAt.toISOString() })),
    });
  } catch {
    // No database connected yet (or unreachable) — degrade to "no signal" rather than breaking the prediction UI.
    return NextResponse.json({ entries: [] });
  }
}

/** Admin-only — everyone else can read the result above, but only the site admin can add a news signal. */
export async function POST(req: NextRequest, { params }: { params: Promise<{ ticker: string }> }) {
  const session = await auth();
  if (!isAdminEmail(session?.user?.email)) {
    return NextResponse.json({ error: "Only the site admin can add a news signal." }, { status: 403 });
  }

  const { ticker } = await params;
  const body = await req.json().catch(() => null);
  const text = typeof body?.text === "string" ? body.text.trim() : "";
  if (!text) return NextResponse.json({ error: "News text is required." }, { status: 400 });
  if (text.length > 2000) return NextResponse.json({ error: "Keep it under 2000 characters." }, { status: 400 });

  const { score } = scoreNewsSentiment(text);
  try {
    const row = await prisma.newsSignal.create({
      data: { ticker: ticker.toUpperCase(), text, score },
    });
    return NextResponse.json({ entry: { id: row.id, text: row.text, score: row.score, createdAt: row.createdAt.toISOString() } });
  } catch {
    return NextResponse.json({ error: "No database connected — news signals can't be saved yet." }, { status: 503 });
  }
}

/** Admin-only — removes one news signal entry by id (passed as ?id=). */
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ ticker: string }> }) {
  const session = await auth();
  if (!isAdminEmail(session?.user?.email)) {
    return NextResponse.json({ error: "Only the site admin can remove a news signal." }, { status: 403 });
  }

  const { ticker } = await params;
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id." }, { status: 400 });

  try {
    await prisma.newsSignal.deleteMany({ where: { id, ticker: ticker.toUpperCase() } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "No database connected." }, { status: 503 });
  }
}
