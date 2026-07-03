// makeDriftSigner — adapts the Privy Solana wallet into the rail `Signer` the engine drives.
//
// Every on-chain submission for one account runs through a per-account TxQueue (rail.TxQueue) so an
// in-flight open and the close that follows it never build against the same stale blockhash or race
// each other — the queue the original repo defined but never wired. Broadcast is gated by
// config.liveBroadcast (default false): the path builds/validates end-to-end but sends nothing
// until the gate is on.

"use client";

import { DriftRailError, TxQueue, type Signer } from "./rail";
import { config } from "@/lib/config";
import {
  openMarketLive,
  closeMarketLive,
  depositCollateral,
  withdrawCollateral,
  getDriftCollateral,
  type AnchorLikeWallet,
} from "./driftTrade";

export interface DriftSignerCtx {
  account: string; // base58 address (display)
  wallet: AnchorLikeWallet;
  network?: string;
  broadcast?: boolean;
}

// one serial queue per account address
const queues = new Map<string, TxQueue>();
function queueFor(account: string): TxQueue {
  let q = queues.get(account);
  if (!q) {
    q = new TxQueue();
    queues.set(account, q);
  }
  return q;
}

export function makeDriftSigner(ctx: DriftSignerCtx): Signer {
  const broadcast = ctx.broadcast ?? config.liveBroadcast;
  const q = queueFor(ctx.account);
  const live = { wallet: ctx.wallet, network: ctx.network, broadcast };

  return {
    account: ctx.account,

    async openMarket(t) {
      try {
        return await q.run(() =>
          openMarketLive(
            {
              symbol: t.symbol,
              stake: t.stake,
              leverage: t.leverage,
              side: t.side,
              markPrice: t.markPrice,
              slippage: t.slippage ?? 0.02,
            },
            live,
          ),
        );
      } catch (e) {
        throw new DriftRailError("CHAIN_REJECTED", e instanceof Error ? e.message : "open failed");
      }
    },

    async closeMarket(p) {
      try {
        return await q.run(() => closeMarketLive(p.symbol, live));
      } catch (e) {
        throw new DriftRailError("CHAIN_REJECTED", e instanceof Error ? e.message : "close failed");
      }
    },
  };
}

/** Deposit USDC from the wallet into Drift collateral (makes it tradable). */
export async function depositVia(ctx: DriftSignerCtx, amount: number): Promise<{ txhash?: string }> {
  const broadcast = ctx.broadcast ?? config.liveBroadcast;
  const r = await queueFor(ctx.account).run(() =>
    depositCollateral(amount, { wallet: ctx.wallet, network: ctx.network, broadcast }),
  );
  return { txhash: r.txhash };
}

/** Withdraw USDC from Drift collateral back to the wallet. */
export async function withdrawVia(ctx: DriftSignerCtx, amount: number): Promise<{ txhash?: string }> {
  const broadcast = ctx.broadcast ?? config.liveBroadcast;
  const r = await queueFor(ctx.account).run(() =>
    withdrawCollateral(amount, { wallet: ctx.wallet, network: ctx.network, broadcast }),
  );
  return { txhash: r.txhash };
}

/** Read the wallet's free (tradable) USDC collateral on Drift. 0 if no account yet. */
export function collateralVia(ctx: DriftSignerCtx): Promise<number> {
  return getDriftCollateral({ wallet: ctx.wallet, network: ctx.network });
}
