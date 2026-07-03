"use client";

import { useEffect, useState } from "react";
import { useStrike } from "@/lib/store";

export function Toast() {
  const toast = useStrike((s) => s.toast);
  const [on, setOn] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (!toast) return;
    setMsg(toast.msg);
    setOn(true);
    const h = setTimeout(() => setOn(false), 1800);
    return () => clearTimeout(h);
  }, [toast]);

  // Rendered as TEXT, never HTML — toast copy includes user-typed handles and raw chain/server
  // error strings, so injecting it as markup would be an XSS sink. React escapes {msg} for us.
  return (
    <div id="toast" className={on ? "on" : undefined}>
      {msg}
    </div>
  );
}
