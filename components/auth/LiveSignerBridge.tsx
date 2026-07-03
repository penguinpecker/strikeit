"use client";

import { useEffect } from "react";
import { useStrike } from "@/lib/store";
import { useAuth } from "./AuthContext";
import { useEngine } from "../engineContext";
import { usePrivySolanaSigner } from "./usePrivySolanaSigner";
import { makeDriftSigner, withdrawVia, depositVia, collateralVia } from "@/lib/drift/driftSigner";
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
  const setDriftCollateral = useStrike((s) => s.setDriftCollateral);
  const setRefreshCollateral = useStrike((s) => s.setRefreshCollateral);

  useEffect(() => {
    const account = solAddress || address;
    if (!ready || !account) {
      setSigner(null);
      setWithdrawFn(null);
      setDepositFn(null);
      setRefreshCollateral(null);
      setDriftCollateral(null);
      return;
    }
    const wallet = getWallet();
    if (!wallet) {
      setSigner(null);
      setWithdrawFn(null);
      setDepositFn(null);
      setRefreshCollateral(null);
      setDriftCollateral(null);
      return;
    }

    const ctx = { account, wallet, network: config.network };
    setSigner(makeDriftSigner(ctx));
    setWithdrawFn(async (amount) => withdrawVia(ctx, amount));
    setDepositFn(async (amount) => depositVia(ctx, amount));
    // read Drift collateral on demand (opening the wallet sheet / after a deposit or withdraw)
    setRefreshCollateral(() => {
      collateralVia(ctx)
        .then((c) => setDriftCollateral(c))
        .catch(() => {});
    });

    return () => {
      setSigner(null);
      setWithdrawFn(null);
      setDepositFn(null);
      setRefreshCollateral(null);
      setDriftCollateral(null);
    };
  }, [ready, address, solAddress, getWallet, setSigner, setWithdrawFn, setDepositFn, setRefreshCollateral, setDriftCollateral]);

  return null;
}
