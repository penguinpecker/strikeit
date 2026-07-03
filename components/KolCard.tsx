"use client";

import { useStrike } from "@/lib/store";
import { fmt } from "@/lib/format";
import { avatarUrl } from "@/lib/social";
import { XLogo } from "./icons";

// The card that opens when you tap a 𝕏 pfp pin on the chart.
export function KolCard() {
  const k = useStrike((s) => s.kol);
  const setKol = useStrike((s) => s.setKol);
  if (!k) return null;
  const { handle, resolvedHandle, live, pct, dir, entry, lev } = k;

  return (
    <div
      id="kol"
      data-overlay
      className="on"
      onClick={(e) => {
        if ((e.target as HTMLElement).id === "kol") setKol(null);
      }}
    >
      <div className="kcard">
        <div className="kav" id="kav">
          <span>{(handle[0] || "?").toUpperCase()}</span>
          {resolvedHandle && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl(resolvedHandle)} alt="" />
          )}
        </div>
        <div className="knm">{handle === "you" ? "you" : handle}</div>
        <div className="kh">{resolvedHandle ? "@" + resolvedHandle : "𝕏 not connected"}</div>
        <div className="kpnl" style={{ color: pct >= 0 ? "var(--ng)" : "var(--nr)" }}>
          {(pct >= 0 ? "+" : "") + pct.toFixed(1)}%
        </div>
        <div className="kst">{live ? "LIVE · riding right now" : pct >= 0 ? "CALLED IT ✓" : "FUMBLED ✗"}</div>
        <div className="kmeta">
          <span className="kc">{dir > 0 ? "↑ LONG" : "↓ SHORT"}</span>
          <span className="kc">entry ${fmt(entry)}</span>
          <span className="kc">{lev}x</span>
        </div>
        <div className="kx">
          {resolvedHandle ? (
            <a id="kolx" href={"https://x.com/" + resolvedHandle} target="_blank" rel="noopener">
              <XLogo size={14} /> View on 𝕏
            </a>
          ) : null}
          <button id="kolclose" onClick={() => setKol(null)}>
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
}
