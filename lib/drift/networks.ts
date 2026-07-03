// Solana / Drift network constants for the STRIKE read + write layers.
//
// Drift perp market indices are NOT hardcoded here — they shift as Drift lists markets — so the
// live path resolves them at runtime from the SDK's `PerpMarkets[env]` by base symbol. What we
// pin here is the per-cluster USDC mint + a sane default RPC, and a market registry mapping our
// display symbol ("BTC/USD") to its base asset, Pyth feed id, and exchange fallbacks.

import type { SolanaCluster } from "../config";

export type DriftEnv = "mainnet-beta" | "devnet";

export interface ClusterConfig {
  driftEnv: DriftEnv;
  /** Default public RPC (override with NEXT_PUBLIC_SOLANA_RPC / server SOLANA_RPC). */
  rpcUrl: string;
  /** USDC SPL mint (6 decimals) — Drift's quote/collateral asset. */
  usdcMint: string;
  /** Drift USDC spot-market index (collateral market). 0 on both clusters. */
  usdcSpotMarketIndex: number;
}

export const CLUSTERS: Record<SolanaCluster, ClusterConfig> = {
  "mainnet-beta": {
    driftEnv: "mainnet-beta",
    rpcUrl: "https://api.mainnet-beta.solana.com",
    usdcMint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    usdcSpotMarketIndex: 0,
  },
  devnet: {
    driftEnv: "devnet",
    rpcUrl: "https://api.devnet.solana.com",
    usdcMint: "Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr",
    usdcSpotMarketIndex: 0,
  },
};

export interface MarketDef {
  /** Display symbol, e.g. "BTC/USD". */
  symbol: string;
  /** Drift base asset symbol (matches PerpMarkets[env].baseAssetSymbol). */
  base: string;
  /** Pyth Hermes price-feed id (hex, 0x-prefixed) — the SAME oracle Drift settles against. */
  pythFeedId: string;
  /** Binance ws pair (aesthetic fallback feed only). */
  binanceSymbol: string;
  /** Coinbase product (aesthetic fallback feed only). */
  coinbaseProduct: string;
}

// Pyth mainnet feed ids (stable across clusters via Hermes).
export const MARKETS: Record<string, MarketDef> = {
  "BTC/USD": {
    symbol: "BTC/USD",
    base: "BTC",
    pythFeedId: "0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43",
    binanceSymbol: "btcusdt",
    coinbaseProduct: "BTC-USD",
  },
  "ETH/USD": {
    symbol: "ETH/USD",
    base: "ETH",
    pythFeedId: "0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace",
    binanceSymbol: "ethusdt",
    coinbaseProduct: "ETH-USD",
  },
  "SOL/USD": {
    symbol: "SOL/USD",
    base: "SOL",
    pythFeedId: "0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d",
    binanceSymbol: "solusdt",
    coinbaseProduct: "SOL-USD",
  },
};

export function resolveCluster(net?: string): SolanaCluster {
  return net === "devnet" ? "devnet" : "mainnet-beta";
}

export function clusterConfig(net?: string): ClusterConfig {
  return CLUSTERS[resolveCluster(net)];
}

export function marketDef(symbol = "BTC/USD"): MarketDef {
  return MARKETS[symbol] ?? MARKETS["BTC/USD"];
}

/** Server RPC override (SOLANA_RPC) falls back to the public per-cluster default. */
export function rpcUrl(net?: string): string {
  return process.env.SOLANA_RPC || clusterConfig(net).rpcUrl;
}
