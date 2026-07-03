// 𝕏 avatar helpers. avatarUrl resolves a REAL Twitter handle's pfp via unavatar — and it is
// only ever called with the connected user's own handle (from Privy 𝕏 OAuth). No fake bots.

export const avatarUrl = (handle: string, fallback = true) =>
  `https://unavatar.io/twitter/${handle}${fallback ? "" : "?fallback=false"}`;

// Deterministic avatar gradient color from an address (real traders, no 𝕏 pfp).
export function addrColor(a: string): string {
  let h = 0;
  for (let i = 0; i < a.length; i++) h = (h * 31 + a.charCodeAt(i)) % 360;
  return `hsl(${h},70%,62%)`;
}

// Preloaded <Image> cache for canvas drawImage (chart pins). Browser-only.
const imgs: Record<string, HTMLImageElement> = {};
export function loadAvatar(handle: string): HTMLImageElement | null {
  if (!handle || typeof window === "undefined") return null;
  if (!imgs[handle]) {
    // no crossOrigin: unavatar doesn't send ACAO, and we only drawImage (never read
    // pixels back), so a tainted canvas is fine — this lets the pfp pins actually render.
    const i = new Image();
    i.src = avatarUrl(handle);
    imgs[handle] = i;
  }
  return imgs[handle];
}
export const avatarImage = (handle: string) => imgs[handle];
