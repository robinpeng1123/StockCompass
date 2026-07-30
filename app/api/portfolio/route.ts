import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const holdings = await prisma.holding.findMany({ where: { userId: session.user.id } });
  return NextResponse.json({
    entries: holdings.map((h) => ({ ticker: h.ticker, shares: h.shares, costBasis: h.costBasis })),
  });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const body = await req.json().catch(() => null);
  const ticker = typeof body?.ticker === "string" ? body.ticker.trim().toUpperCase() : "";
  const shares = Number(body?.shares);
  const costBasis = Number(body?.costBasis);

  if (!ticker || !Number.isFinite(shares) || shares <= 0 || !Number.isFinite(costBasis) || costBasis <= 0) {
    return NextResponse.json({ error: "Invalid ticker, shares, or cost basis." }, { status: 400 });
  }

  const holding = await prisma.holding.upsert({
    where: { userId_ticker: { userId: session.user.id, ticker } },
    update: { shares, costBasis },
    create: { userId: session.user.id, ticker, shares, costBasis },
  });

  return NextResponse.json({ entry: { ticker: holding.ticker, shares: holding.shares, costBasis: holding.costBasis } });
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const ticker = searchParams.get("ticker")?.trim().toUpperCase();
  if (!ticker) return NextResponse.json({ error: "Missing ticker." }, { status: 400 });

  await prisma.holding.deleteMany({ where: { userId: session.user.id, ticker } });
  return NextResponse.json({ ok: true });
}
