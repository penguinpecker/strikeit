// Client-readable config (NEXT_PUBLIC_*). Server-only values (RPC keys, etc.) live in the
// route handlers via non-public env vars. Nothing here is a secret.

export type StrikeMode = "paper" | "live";
export type SolanaCluster = "mainnet-beta" | "devnet";

export const config = {
  // Solana cluster the app trades against.
  network: (process.env.NEXT_PUBLIC_SOLANA_CLUSTER as SolanaCluster) || "mainnet-beta",
  mode: (process.env.NEXT_PUBLIC_STRIKE_MODE as StrikeMode) || "paper",
  market: process.env.NEXT_PUBLIC_MARKET || "BTC/USD",
  // Chart/settlement price source. "pyth" (default) matches Drift's oracle exactly, so the
  // number you watch is the number your position fills against. "binance" is a smoother-looking
  // alternative but drifts from the on-chain fill — only for demo aesthetics.
  priceFeed: (process.env.NEXT_PUBLIC_PRICE_FEED as "pyth" | "binance") || "pyth",
  // Public Solana RPC. A dedicated RPC (Helius/Triton/QuickNode) is strongly recommended for
  // live trading; the public endpoint is rate-limited. Used client-side for the Drift SDK.
  solanaRpc: process.env.NEXT_PUBLIC_SOLANA_RPC || "https://api.mainnet-beta.solana.com",
  // Privy app id (public). When set, real 𝕏 OAuth login activates and a Solana embedded wallet
  // is created on login; otherwise the prototype handle-entry flow is used. Create at
  // dashboard.privy.io, enable Twitter login, and add your domains to Allowed origins.
  privyAppId: process.env.NEXT_PUBLIC_PRIVY_APP_ID || "",
  // round duration for one tap (ms) — the 30-second call
  roundMs: 30_000,
  // STRIKE platform fee, charged on the STAKE (collateral) per call — NOT on notional, so
  // leverage doesn't blow it up. Collected to the treasury as a USDC transfer bundled into the
  // trade tx in live mode. Default 0.69%.
  platformFeeRate: Number(process.env.NEXT_PUBLIC_STRIKE_FEE_RATE) || 0.0069,
  // STRIKE fee-treasury (Solana base58). Receives the platform fee on-chain in live mode. When
  // unset, no fee is charged (and the live path logs that it was skipped — never silent).
  treasury: process.env.NEXT_PUBLIC_STRIKE_TREASURY || "",
  // GO-LIVE GATE. Even in mode "live", no transaction is broadcast unless this is "true". Lets us
  // wire + dry-run the entire live path (build + Privy sign) against a funded wallet before any
  // real send. Flip to "true" only when ready to trade for real.
  liveBroadcast: process.env.NEXT_PUBLIC_STRIKE_LIVE_BROADCAST === "true",
} as const;

// The base symbol STRIKE trades, e.g. "BTC/USD" -> "BTC".
export function baseAsset(market = config.market): string {
  return market.split("/")[0]?.toUpperCase() || "BTC";
}
export function binanceSymbol(market = config.market): string {
  return `${baseAsset(market)}USDT`.toLowerCase();
}
export function coinbaseProduct(market = config.market): string {
  return `${baseAsset(market)}-USD`;
}
