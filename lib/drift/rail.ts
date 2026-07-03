// drift-rail — the safety layer every STRIKE trade goes through.
//
// Framework-agnostic and client-safe (no heavy SDK import): input clamping, a min-notional
// precheck, a cost/breakeven preview, a per-account serial tx queue, and a typed error taxonomy.
// The actual on-chain signer plugs in behind `Signer` (see driftSigner.ts).

import type { DriftPairConfig } from "./types";

export type Side = "long" | "short";

export class DriftRailError extends Error {
  constructor(
    public code:
      | "BELOW_MIN_NOTIONAL"
      | "BAD_INPUT"
      | "INSUFFICIENT_BALANCE"
      | "SIGNER_NOT_WIRED"
      | "MARKET_CLOSED"
      | "CHAIN_REJECTED"
      | "TIMEOUT",
    message: string,
  ) {
    super(message);
    this.name = "DriftRailError";
  }
}

export interface TapIntent {
  stake: number; // USDC collateral
  leverage: number;
  side: Side;
  slippage?: number; // fraction; default 0.02
}

export interface Validation {
  ok: boolean;
  code?: DriftRailError["code"];
  reason?: string;
}

// ── input clamping ──
export function validateInputs(t: TapIntent): Validation {
  if (!Number.isFinite(t.stake) || t.stake <= 0)
    return { ok: false, code: "BAD_INPUT", reason: "stake must be > 0" };
  if (!Number.isFinite(t.leverage) || t.leverage < 1)
    return { ok: false, code: "BAD_INPUT", reason: "leverage must be ≥ 1" };
  const slip = t.slippage ?? 0.02;
  if (!Number.isFinite(slip) || slip <= 0 || slip >= 1)
    return { ok: false, code: "BAD_INPUT", reason: "slippage must be in (0,1)" };
  if (t.side !== "long" && t.side !== "short")
    return { ok: false, code: "BAD_INPUT", reason: "side must be long|short" };
  return { ok: true };
}

// ── market minimum + leverage cap ──
export function validateNotional(t: TapIntent, cfg: DriftPairConfig): Validation {
  const notional = t.stake * t.leverage;
  if (notional < cfg.minPositionValue) {
    const minLev = Math.ceil(cfg.minPositionValue / t.stake);
    return {
      ok: false,
      code: "BELOW_MIN_NOTIONAL",
      reason: `$${t.stake} needs ≥ ${minLev}x (min position $${cfg.minPositionValue})`,
    };
  }
  if (t.leverage > cfg.maxLeverage) {
    return { ok: false, code: "BAD_INPUT", reason: `max leverage is ${cfg.maxLeverage}x` };
  }
  return { ok: true };
}

export function validateTap(t: TapIntent, cfg: DriftPairConfig, balance: number): Validation {
  const inp = validateInputs(t);
  if (!inp.ok) return inp;
  if (t.stake > balance)
    return { ok: false, code: "INSUFFICIENT_BALANCE", reason: "not enough balance" };
  return validateNotional(t, cfg);
}

// ── cost + breakeven preview (taker fee both sides) ──
export interface CostQuote {
  notional: number;
  openFee: number;
  closeFee: number;
  platformFee: number; // STRIKE fee on the stake
  txFees: number; // 2 × est. Solana network fee (tiny)
  roundTripCost: number;
  roundTripPctOfStake: number;
  breakevenMovePct: number;
  breakevenMoveUsd: (markPrice: number) => number;
}

const FIXED_TX_FEE = 0.001; // ~USDC-equivalent per Solana tx (lamports are negligible; kept for parity)

export function quoteCost(t: TapIntent, cfg: DriftPairConfig, platformFeeRate = 0): CostQuote {
  const notional = t.stake * t.leverage;
  const openFee = notional * cfg.takerFeeRate;
  const closeFee = notional * cfg.takerFeeRate;
  const platformFee = t.stake * platformFeeRate; // STRIKE fee on the stake, once per call
  const txFees = FIXED_TX_FEE * 2;
  const roundTripCost = openFee + closeFee + platformFee + txFees;
  const breakevenMovePct = (roundTripCost / notional) * 100;
  return {
    notional,
    openFee,
    closeFee,
    platformFee,
    txFees,
    roundTripCost,
    roundTripPctOfStake: (roundTripCost / t.stake) * 100,
    breakevenMovePct,
    breakevenMoveUsd: (markPrice: number) => (breakevenMovePct / 100) * markPrice,
  };
}

// ── per-account serial queue (prevents blockhash/nonce races on rapid taps) ──
// Every on-chain submission for one account goes through here so an in-flight open and the
// following close never build against the same stale blockhash / collide. WIRED in driftSigner.
export class TxQueue {
  private tail: Promise<unknown> = Promise.resolve();
  run<T>(job: () => Promise<T>): Promise<T> {
    const out = this.tail.then(job, job);
    this.tail = out.then(
      () => undefined,
      () => undefined,
    );
    return out;
  }
}

// ── the signer the live write-path plugs into ──
export interface OpenResult {
  txhash: string;
  marketIndex: number;
  isLong: boolean;
}
export interface Signer {
  account: string;
  openMarket(t: TapIntent & { symbol: string; markPrice: number }): Promise<OpenResult>;
  // Drift nets one position per market, so a close targets the market (not a placeholder id).
  closeMarket(p: { symbol: string; slippage?: number }): Promise<{ txhash: string }>;
}

export class UnwiredSigner implements Signer {
  account = "(unwired)";
  async openMarket(): Promise<OpenResult> {
    throw new DriftRailError(
      "SIGNER_NOT_WIRED",
      "live on-chain trading needs a connected wallet — running in paper mode",
    );
  }
  async closeMarket(): Promise<{ txhash: string }> {
    throw new DriftRailError("SIGNER_NOT_WIRED", "no signer wired");
  }
}
