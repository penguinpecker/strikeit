import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Live positions are read client-side via the Drift SDK when connected (the close path targets the
// market directly, not a server-resolved id). This endpoint is a stable placeholder that returns an
// empty list so any legacy caller degrades gracefully.
export async function GET() {
  return NextResponse.json({ positions: [] });
}
