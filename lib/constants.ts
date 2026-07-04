// Stake + leverage chips. Stakes are in SOL (the wallet's native balance). 200x = FULL SEND.
export const STAKES = [0.01, 0.05, 0.1] as const;
export const LEVS: [lev: number, color: string][] = [
  [10, "#8A8F98"],
  [25, "#FFFFFF"],
  [50, "#AB9FF2"],
  [100, "#FF8A93"],
  [200, "#FF3B4E"],
];
