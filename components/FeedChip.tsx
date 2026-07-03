"use client";

import { useStrike } from "@/lib/store";

export function FeedChip() {
  const { status, source } = useStrike((s) => s.feedStatus);
  const cls = status === "down" ? "down" : status !== "live" ? "warn" : "";
  const label = status === "live" ? `live · ${source}` : status;
  return (
    <div id="feedchip" className={cls}>
      <span className="dot" />
      <span id="feedlabel">{label}</span>
    </div>
  );
}
