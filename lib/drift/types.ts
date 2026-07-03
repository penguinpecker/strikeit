// Shared Drift domain types (the subset STRIKE consumes). Human/display units (USDC, 6-dec on
// chain but always human here). Mirrors the original's shape so the game/UI code is unchanged.

export interface DriftMarket {
  symbol: string; // display symbol, e.g. "BTC/USD"
  base: string; // "BTC"
  marketIndex: number; // Drift perp market index
  price: number; // oracle mark price (human units)
  oiLong: number;
  oiShort: number;
  volume: number; // 24h notional
  maxLeverage: number;
  status: "open" | "closed";
}

// Per-market trading config (fees + the min order) used to pre-validate a tap and preview cost.
export interface DriftPairConfig {
  symbol: string;
  marketIndex: number;
  takerFeeRate: number; // fraction, e.g. 0.001 (10 bps)
  makerFeeRate: number;
  minPositionValue: number; // human USDC notional the market will accept
  maxLeverage: number;
}

// A real on-chain trade (from the Drift trade tape) — drives the live feed, leaderboard, and pins.
export interface RecentTrade {
  account: string; // Solana authority (base58)
  symbol: string; // display symbol
  marketIndex: number;
  isLong: boolean;
  isOpen: boolean; // open vs close/reduce
  price: number;
  pnl: number; // realized pnl in USDC (close records), human units
  leverage: number; // notional / collateral (rounded)
  ts: number; // ms
  txhash?: string;
}

// A trader's live position on Drift (human units).
export interface DriftPosition {
  marketIndex: number;
  symbol: string;
  isLong: boolean;
  collateral: number;
  leverage: number;
  entryPrice: number;
  size: number; // base size
  pnl: number;
  liquidationPrice: number;
}

export interface DriftOrderResult {
  txhash: string;
  marketIndex: number;
  isLong: boolean;
}
