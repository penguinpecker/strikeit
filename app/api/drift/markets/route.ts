import { NextRequest, NextResponse } from "next/server";
import { getMarkets } from "@/lib/drift/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const net = req.nextUrl.searchParams.get("network") || undefined;
  return NextResponse.json(await getMarkets(net));
}
