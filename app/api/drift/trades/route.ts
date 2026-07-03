import { NextRequest, NextResponse } from "next/server";
import { getRecentTrades } from "@/lib/drift/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const net = req.nextUrl.searchParams.get("network") || undefined;
  const limit = Math.min(200, Math.max(1, Number(req.nextUrl.searchParams.get("limit")) || 40));
  return NextResponse.json(await getRecentTrades(net, limit));
}
