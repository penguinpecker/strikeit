import { NextRequest, NextResponse } from "next/server";
import { insertCall, supabaseConfigured, type CallRow } from "@/lib/supabase/rest";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Persist a settled call. Best-effort: if Supabase isn't configured or the write fails, we still
// return ok so the client's fire-and-forget call never surfaces an error into the game.
export async function POST(req: NextRequest) {
  if (!supabaseConfigured()) return NextResponse.json({ ok: false, reason: "supabase not configured" });
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, reason: "bad json" }, { status: 400 });
  }
  const dir = Number(body.dir);
  if (dir !== 1 && dir !== -1) return NextResponse.json({ ok: false, reason: "bad dir" }, { status: 400 });

  const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : undefined);
  const str = (v: unknown) => (typeof v === "string" && v.length ? v : undefined);
  const row: CallRow = {
    wallet: str(body.wallet) ?? null,
    handle: str(body.handle) ?? null,
    symbol: str(body.symbol) ?? "BTC/USD",
    dir,
    entry: num(body.entry),
    lev: num(body.lev),
    stake: num(body.stake),
    mode: str(body.mode) ?? "paper",
    how: str(body.how),
    win: typeof body.win === "boolean" ? body.win : undefined,
    pnl: num(body.pnl),
    pct: num(body.pct),
    secs: num(body.secs),
    txhash: str(body.txhash) ?? null,
  };
  const ok = await insertCall(row);
  return NextResponse.json({ ok });
}
