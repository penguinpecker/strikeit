"use client";

import { useStrike } from "@/lib/store";
import { fmt2 } from "@/lib/format";
import { BrandMark, XLogo } from "./icons";
import { useAuth } from "./auth/AuthContext";

export function Header() {
  const usdcBalance = useStrike((s) => s.usdcBalance);
  const openSheet = useStrike((s) => s.openSheet);
  const { connected, handle, avatar, login } = useAuth();

  return (
    <header>
      <div className="brand">
        <BrandMark />
        <b>STRIKE</b>
        <span>BTC PERP · SOLANA</span>
      </div>
      <div style={{ display: "flex", alignItems: "center" }}>
        <button id="xbtn" onClick={login}>
          {connected ? (
            <>
              {avatar && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatar} alt="" />
              )}{" "}
              @{handle}
            </>
          ) : (
            <>
              <XLogo /> Connect
            </>
          )}
        </button>
        <div
          className="bal"
          onClick={connected ? () => openSheet("wallet") : undefined}
          style={connected ? { cursor: "pointer" } : undefined}
          title={connected ? "wallet" : undefined}
        >
          <span className="l">{connected ? "wallet ›" : "balance"}</span>
          <span className="v" key={String(usdcBalance)} id="bal">
            {connected ? (usdcBalance == null ? "…" : `$${fmt2(usdcBalance)}`) : "—"}
          </span>
        </div>
      </div>
    </header>
  );
}
