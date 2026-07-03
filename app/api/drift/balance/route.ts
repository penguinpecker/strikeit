import { NextRequest, NextResponse } from "next/server";
import { getUsdcBalance } from "@/lib/drift/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const address = req.nextUrl.searchParams.get("address") || "";
  const net = req.nextUrl.searchParams.get("network") || undefined;
  try {
    const usdc = await getUsdcBalance(address, net);
    return NextResponse.json({ usdc });
  } catch {
    // RPC failure — return null (NOT 0) so the client keeps the last known balance instead of
    // flashing "$0" and rejecting taps as if the wallet were empty.
    return NextResponse.json({ usdc: null }, { status: 200 });
  }
}
