import { NextRequest, NextResponse } from "next/server";
import { getPairConfig } from "@/lib/drift/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const symbol = req.nextUrl.searchParams.get("symbol") || "BTC/USD";
  const net = req.nextUrl.searchParams.get("network") || undefined;
  const cfg = await getPairConfig(symbol, net);
  if (!cfg) return NextResponse.json({ error: "unknown market" }, { status: 404 });
  return NextResponse.json(cfg);
}
