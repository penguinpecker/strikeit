"use client";

import { useEffect } from "react";
import { useStrike } from "@/lib/store";
import { useAuth } from "./AuthContext";
import { useEngine } from "../engineContext";
import { usePrivySolanaSigner } from "./usePrivySolanaSigner";
import { makeDriftSigner, withdrawVia, depositVia } from "@/lib/drift/driftSigner";
import { config } from "@/lib/config";

// Renders nothing. While a Privy Solana wallet is connected, it injects a live Drift signer into
// the engine (so live-mode taps open/close real perps) and registers the deposit/withdraw handlers
// the wallet sheet calls. The signer is rebuilt whenever the connected address changes, so an
// account switch can never trade with a previous user's wallet.
export function LiveSignerBridge() {
  const { getWallet, ready, address } = usePrivySolanaSigner();
  const { solAddress } = useAuth();
  const { setSigner } = useEngine();
  const setWithdrawFn = useStrike((s) => s.setWithdrawFn);
  const setDepositFn = useStrike((s) => s.setDepositFn);

  useEffect(() => {
    const account = solAddress || address;
    if (!ready || !account) {
      setSigner(null);
      setWithdrawFn(null);
      setDepositFn(null);
      return;
    }
    const wallet = getWallet();
    if (!wallet) {
      setSigner(null);
      setWithdrawFn(null);
      setDepositFn(null);
      return;
    }

    const ctx = { account, wallet, network: config.network };
    setSigner(makeDriftSigner(ctx));
    setWithdrawFn(async (amount) => withdrawVia(ctx, amount));
    setDepositFn(async (amount) => depositVia(ctx, amount));

    return () => {
      setSigner(null);
      setWithdrawFn(null);
      setDepositFn(null);
    };
  }, [ready, address, solAddress, getWallet, setSigner, setWithdrawFn, setDepositFn]);

  return null;
}
