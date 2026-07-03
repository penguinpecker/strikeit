"use client";

import { useStrike } from "@/lib/store";
import { useEngine } from "./engineContext";
import { ArrowDownGlyph, ArrowUpGlyph } from "./icons";

export function Arrows() {
  const live = useStrike((s) => !!s.call);
  const upN = useStrike((s) => s.upN);
  const downN = useStrike((s) => s.downN);
  const { makeCall } = useEngine();

  return (
    <div className="arrows" id="arrows" style={{ display: live ? "none" : "flex" }}>
      <button className="arrow" id="aDown" onClick={() => makeCall(-1)}>
        <ArrowDownGlyph />
        <span className="cnt">
          <b style={{ color: "var(--nr)" }}>{downN}</b> in ↓
        </span>
      </button>
      <button className="arrow" id="aUp" onClick={() => makeCall(1)}>
        <ArrowUpGlyph />
        <span className="cnt">
          <b style={{ color: "var(--ng)" }}>{upN}</b> in ↑
        </span>
      </button>
    </div>
  );
}
