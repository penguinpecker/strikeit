export const fmt = (n: number, d = 0) =>
  Number(n).toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });

export const fmt2 = (n: number) =>
  Number(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// SOL amounts (balance / stake / pnl) — the ◎ glyph + up to `d` decimals.
export const sol = (n: number, d = 3) =>
  "◎" + Number(n).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: d });
