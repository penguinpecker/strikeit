# STRIKE SOL

Tap-to-trade BTC perps on **Solana**. Call ↑ or ↓ on a giant live price, ride 30 seconds, cash out — or get liquidated. A neon chart, PnL floods, and 𝕏-pfp pins for every call.

This is the Solana port of STRIKE. Same game, same feel; the chain layer swaps Initia/Strat for:

- **Liquidity / execution:** [Drift Protocol v2](https://drift.trade) (`@drift-labs/sdk`), USDC collateral.
- **Price + chart:** [Pyth](https://pyth.network) Hermes stream — the *same oracle Drift settles against*, so the number you watch is the number your position fills at.
- **Wallet / auth:** [Privy](https://privy.io) 𝕏 OAuth + a native Solana embedded wallet (Ed25519). Privy signs; no key ever leaves it.

## Stack

Next.js 15 (App Router) · React 19 · Zustand · TypeScript · a hand-tuned canvas engine for the 60fps hot path (price / PnL / chart / timer live outside React, driven imperatively via refs).

## Run

```bash
npm install
cp .env.example .env.local   # fill in a Privy app id + a Solana RPC for the full experience
npm run dev                  # http://localhost:3000
```

Works with **zero config** out of the box: no Privy app id → a prototype handle-entry login; `paper` mode → real Pyth prices, a local bankroll, no on-chain settlement. That's the default and it's the safe demo.

## Modes & the go-live gate

- `NEXT_PUBLIC_STRIKE_MODE=paper` (default) — real prices, local bankroll, nothing on-chain.
- `NEXT_PUBLIC_STRIKE_MODE=live` — real Drift perps signed by the user's Privy wallet, **but** nothing is broadcast unless `NEXT_PUBLIC_STRIKE_LIVE_BROADCAST=true`. This lets you wire and dry-run the entire build+sign path against a funded wallet before a single real send. The live Drift path targets Drift's documented SDK methods and should be verified against a funded wallet before flipping the gate.

## Layout

```
app/                 Next.js routes + the read API (/api/drift/*)
components/          UI + the auth/live-signer bridge (Privy → Drift)
components/auth/     Privy Solana wallet → Anchor-compatible signer
lib/game/engine.ts   the imperative 60fps game engine (call / cash-out / resolve)
lib/feed/            Pyth Hermes price feed (+ Binance/Coinbase fallback, staleness watchdog)
lib/drift/           Drift read layer (server) + live trade path (client) + the rail/validation
lib/solana/          Solana address helpers
```

## Notes vs. the original

This port fixes several bugs found in the Initia original while keeping the game identical:

- The double-tap race that could open two real positions is guarded before the sign await.
- Live closes target the real Drift market (not a placeholder id) and wait for on-chain confirmation.
- One price source (Pyth) drives both the chart and the settlement oracle — no display-vs-fill drift.
- The price feed has a staleness watchdog so a frozen socket fails over instead of showing a dead "live" price.
- Toasts render as text, never HTML (no XSS from handles / chain error strings).
- The per-account transaction queue is actually wired into the signer.
