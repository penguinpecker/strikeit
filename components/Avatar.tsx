"use client";

import { useState } from "react";
import { avatarUrl } from "@/lib/social";
import { useStrike } from "@/lib/store";

// 𝕏 pfp pill. `src` = a resolved real 𝕏 avatar (from a known identity) and wins when present.
// Otherwise, "you" → the connected user's own pfp; any other on-chain wallet has no Twitter, so it
// shows the deterministic gradient identicon — we never fake a 𝕏 lookup on a blockchain address.
export function Avatar({ nm, col, src }: { nm: string; col?: string; src?: string | null }) {
  const user = useStrike((s) => s.user);
  const [errUrl, setErrUrl] = useState<string | null>(null);
  const url = src || (nm === "you" && user?.h ? avatarUrl(user.h, false) : null);
  return (
    <div className="av" style={{ background: `linear-gradient(135deg,${col || "#cfd2ff"},#23223d)` }}>
      <span>{(nm[0] || "?").toUpperCase()}</span>
      {url && url !== errUrl && (
        // Hide a broken pfp via state — not DOM .remove(), which races React's reconciliation.
        // A different url renders again since errUrl only matches the specific url that failed.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} onError={() => setErrUrl(url)} alt="" />
      )}
    </div>
  );
}
