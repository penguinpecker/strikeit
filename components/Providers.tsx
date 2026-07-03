"use client";

import { PrivyProvider } from "@privy-io/react-auth";
import { config } from "@/lib/config";
import { MockAuthProvider } from "./auth/MockAuthProvider";
import { PrivyAuthProvider } from "./auth/PrivyAuthProvider";

// Activates real 𝕏 OAuth (Privy) when NEXT_PUBLIC_PRIVY_APP_ID is set; otherwise the app runs the
// prototype handle-entry flow so it always works without credentials. On login Privy creates a
// Solana embedded wallet (base58, Ed25519) — the account we trade Drift perps with.
export function Providers({ children }: { children: React.ReactNode }) {
  if (config.privyAppId) {
    return (
      <PrivyProvider
        appId={config.privyAppId}
        config={{
          loginMethods: ["twitter"],
          appearance: { theme: "dark", accentColor: "#00FF85", walletChainType: "solana-only" },
          // create the Solana embedded wallet on login; no EVM wallet needed.
          embeddedWallets: {
            solana: { createOnLogin: "users-without-wallets" },
          },
        }}
      >
        <PrivyAuthProvider>{children}</PrivyAuthProvider>
      </PrivyProvider>
    );
  }
  return <MockAuthProvider>{children}</MockAuthProvider>;
}
