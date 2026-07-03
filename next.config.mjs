/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // unavatar (X pfps) is fetched as <img> on a canvas; allow the host for next/image too if we adopt it
  images: {
    remotePatterns: [{ protocol: 'https', hostname: 'unavatar.io' }],
  },
  // @drift-labs/sdk + @solana pull in node-ish deps; keep them external to the server bundle
  // and let the client dynamic-import the heavy trade path only when a live action fires.
  webpack: (config) => {
    config.externals = config.externals || [];
    config.resolve.fallback = { ...config.resolve.fallback, fs: false };
    // Optional Privy features we don't use (Farcaster mini-app, Stripe fiat onramp) — stub them
    // so the bundler doesn't warn about the unresolved optional imports.
    config.resolve.alias = {
      ...config.resolve.alias,
      "@farcaster/mini-app-solana": false,
      "@stripe/crypto": false,
    };
    return config;
  },
};

export default nextConfig;
