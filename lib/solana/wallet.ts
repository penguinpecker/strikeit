// Solana address helpers. Privy's Solana embedded wallet gives a native base58 Ed25519 address
// directly — there is no key derivation or bridge to do (unlike the Initia ethsecp256k1 stack the
// original STRIKE needed). These are display-only utilities.

/** Loose base58 check — Solana addresses are 32-44 base58 chars, no 0/O/I/l. */
export function isSolanaAddress(addr: string): boolean {
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(addr.trim());
}

/** Short display form, e.g. 7xKQ…9aBc. */
export function shortAddress(addr: string, head = 4, tail = 4): string {
  if (!addr) return "";
  return addr.length <= head + tail + 1 ? addr : `${addr.slice(0, head)}…${addr.slice(-tail)}`;
}
