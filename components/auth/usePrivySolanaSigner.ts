"use client";

import { useCallback } from "react";
import { useSignTransaction, useWallets } from "@privy-io/react-auth/solana";
import { PublicKey } from "@solana/web3.js";
import type { AnchorLikeWallet } from "@/lib/drift/driftTrade";

// Bridges the Privy Solana embedded wallet to an Anchor-compatible signer the Drift SDK accepts.
// Solana wallets are native Ed25519, so signing is direct — no keccak digest, no pubkey recovery,
// no bech32 conversion (all of which the Initia original needed). The wallet is rebuilt from the
// CURRENT Privy wallet on every call, so switching accounts can never reuse a stale key.
export function usePrivySolanaSigner() {
  const { wallets } = useWallets();
  const { signTransaction } = useSignTransaction();

  const privyWallet =
    wallets.find((w) => w.standardWallet?.name === "Privy") ?? wallets[0] ?? null;
  const address = privyWallet?.address ?? null;

  const getWallet = useCallback((): AnchorLikeWallet | null => {
    if (!privyWallet?.address) return null;
    const publicKey = new PublicKey(privyWallet.address);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sign = async (tx: any) => {
      const res = await signTransaction({ transaction: tx, wallet: privyWallet });
      // Privy returns the signed transaction (shape has varied across versions — normalize).
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const r = res as any;
      return r?.signedTransaction ?? r?.transaction ?? r ?? tx;
    };

    return {
      publicKey,
      signTransaction: sign,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      signAllTransactions: async (txs: any[]) => {
        const out = [];
        for (const t of txs) out.push(await sign(t));
        return out;
      },
    };
  }, [privyWallet, signTransaction]);

  return { getWallet, ready: !!address, address };
}
