"use client";

import { useState } from "react";
import { useStrike } from "@/lib/store";
import { useAuth } from "./auth/AuthContext";
import { fmt2 } from "@/lib/format";
import { shortAddress } from "@/lib/solana/wallet";
import { XLogo } from "./icons";

// Wallet / deposit / withdraw — the user's real USDC (non-custodial; their Privy Solana wallet).
//   deposit  = move USDC from the wallet into Drift collateral (makes it tradable margin)
//   withdraw = pull USDC from Drift collateral back to the wallet
// Everything is signed by the user's own wallet; STRIKE never takes custody.
export function WalletViews({ view }: { view: "wallet" | "deposit" | "withdraw" }) {
  const auth = useAuth();
  const bal = useStrike((s) => s.usdcBalance);
  const openSheet = useStrike((s) => s.openSheet);
  const showToast = useStrike((s) => s.showToast);
  const refreshBalance = useStrike((s) => s.refreshBalance);
  const withdrawFn = useStrike((s) => s.withdrawFn);
  const depositFn = useStrike((s) => s.depositFn);
  const [amt, setAmt] = useState("");
  const [depAmt, setDepAmt] = useState("");
  const [busy, setBusy] = useState(false);

  const addr = auth.solAddress;

  if (!auth.connected || !addr) {
    return (
      <>
        <div className="sub" style={{ marginBottom: 10 }}>connect 𝕏 to open your wallet</div>
        <button className="xgo" onClick={auth.login}>
          <XLogo size={15} /> CONNECT 𝕏
        </button>
      </>
    );
  }
  const balNum = bal ?? 0;

  // re-poll the real balance a few times after a settle (the 20s poll is the backstop)
  const nudgeBalance = () => {
    setTimeout(() => refreshBalance?.(), 2500);
    setTimeout(() => refreshBalance?.(), 8000);
  };

  if (view === "wallet") {
    return (
      <>
        <div
          style={{
            borderRadius: 18,
            padding: "18px 16px",
            background: "rgba(0,255,133,.07)",
            border: "1.5px solid rgba(0,255,133,.22)",
            marginBottom: 12,
          }}
        >
          <div style={{ fontSize: 11, letterSpacing: ".14em", color: "var(--wt4)", fontWeight: 700, textTransform: "uppercase" }}>
            USDC balance · Solana
          </div>
          <div className="baloo" style={{ fontSize: 38, fontWeight: 800, marginTop: 2 }}>
            ${fmt2(balNum)}
          </div>
          <div className="mono" style={{ fontSize: 11, color: "var(--wt4)", marginTop: 2 }}>
            {shortAddress(addr, 6, 6)}
          </div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="xgo" style={{ flex: 1 }} onClick={() => openSheet("deposit")}>
            DEPOSIT
          </button>
          <button
            className="xgo"
            style={{ flex: 1, background: "rgba(255,255,255,.1)", color: "#fff", border: "1.5px solid rgba(255,255,255,.2)" }}
            onClick={() => openSheet("withdraw")}
          >
            WITHDRAW
          </button>
        </div>
        <div className="sub" style={{ marginTop: 12 }}>
          your funds stay in your wallet — STRIKE never holds them. Drift locks collateral only while a position is open.
        </div>
      </>
    );
  }

  if (view === "deposit") {
    const depNum = Number(depAmt) || 0;
    const depValid = depNum > 0 && depNum <= balNum;
    return (
      <>
        <div className="sub" style={{ marginBottom: 8 }}>
          move USDC from your wallet into <b>Drift</b> collateral so it can back your calls.
        </div>
        <div
          style={{
            borderRadius: 14,
            padding: "12px 14px",
            background: "rgba(255,255,255,.05)",
            border: "1px solid rgba(255,255,255,.12)",
            marginBottom: 10,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
          }}
        >
          <span style={{ fontSize: 11, letterSpacing: ".12em", color: "var(--wt4)", fontWeight: 700, textTransform: "uppercase" }}>
            in your wallet
          </span>
          <span className="baloo" style={{ fontSize: 22, fontWeight: 800 }}>
            {bal == null ? "…" : `$${fmt2(balNum)}`}
          </span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            className="xin"
            inputMode="decimal"
            placeholder="amount (USDC)"
            value={depAmt}
            onChange={(e) => setDepAmt(e.target.value)}
            onKeyDown={(e) => e.stopPropagation()}
            style={{ flex: 1 }}
          />
          <button
            className="xin"
            style={{ width: 64, cursor: "pointer", color: "var(--accent, #00ff85)" }}
            onClick={() => setDepAmt(String(balNum))}
          >
            MAX
          </button>
        </div>
        <button
          className="xgo"
          disabled={!depValid || busy}
          style={{ opacity: depValid && !busy ? 1 : 0.5 }}
          onClick={async () => {
            if (!depositFn) return showToast("deposit goes live once your wallet is connected");
            setBusy(true);
            try {
              const r = await depositFn(depNum);
              showToast(r.txhash && !r.txhash.startsWith("(") ? `deposited · ${r.txhash.slice(0, 10)}…` : "signed (broadcast off)");
              setDepAmt("");
              nudgeBalance();
            } catch (e) {
              showToast(e instanceof Error ? e.message : "deposit failed");
            } finally {
              setBusy(false);
            }
          }}
        >
          {busy ? "DEPOSITING…" : "DEPOSIT TO DRIFT"}
        </button>
        <div className="sub" style={{ marginTop: 10 }}>
          signed by your Privy wallet — a single Solana transaction. Needs a little SOL for gas.
        </div>
        <a
          className="xgo"
          href="https://jup.ag/swap/SOL-USDC"
          target="_blank"
          rel="noopener"
          style={{
            textDecoration: "none",
            display: "block",
            textAlign: "center",
            marginTop: 8,
            background: "rgba(255,255,255,.08)",
            color: "#fff",
            border: "1px solid rgba(255,255,255,.16)",
          }}
        >
          NO USDC? GET SOME ON JUPITER ↗
        </a>
      </>
    );
  }

  // withdraw — pull USDC out of Drift collateral back to your own wallet
  const amtNum = Number(amt) || 0;
  const valid = amtNum > 0;
  return (
    <>
      <div className="sub" style={{ marginBottom: 8 }}>
        withdraw <b>USDC</b> from Drift collateral back to your Solana wallet.
      </div>
      <input
        className="xin"
        inputMode="decimal"
        placeholder="amount (USDC)"
        value={amt}
        onChange={(e) => setAmt(e.target.value)}
        onKeyDown={(e) => e.stopPropagation()}
      />
      <button
        className="xgo"
        disabled={!valid || busy}
        style={{ opacity: valid && !busy ? 1 : 0.5 }}
        onClick={async () => {
          if (!withdrawFn) return showToast("withdraw goes live once the wallet is funded");
          setBusy(true);
          try {
            const r = await withdrawFn(amtNum, addr);
            showToast(r.txhash && !r.txhash.startsWith("(") ? `sent · ${r.txhash.slice(0, 10)}…` : "signed (broadcast off)");
            setAmt("");
            nudgeBalance();
          } catch (e) {
            showToast(e instanceof Error ? e.message : "withdraw failed");
          } finally {
            setBusy(false);
          }
        }}
      >
        {busy ? "SIGNING…" : "WITHDRAW"}
      </button>
      <div className="sub" style={{ marginTop: 10 }}>
        signed by your Privy wallet — funds land in your own Solana wallet, no custody.
      </div>
    </>
  );
}
