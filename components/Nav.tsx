"use client";

import { useStrike } from "@/lib/store";
import type { Tab } from "@/lib/types";
import { NavCall, NavFeed, NavRanks, NavYou } from "./icons";

const TABS: { t: Tab; label: string; Icon: () => React.JSX.Element }[] = [
  { t: "call", label: "CALL", Icon: NavCall },
  { t: "feed", label: "FEED", Icon: NavFeed },
  { t: "ranks", label: "RANKS", Icon: NavRanks },
  { t: "you", label: "YOU", Icon: NavYou },
];

export function Nav() {
  const tab = useStrike((s) => s.tab);
  const setTab = useStrike((s) => s.setTab);
  const openSheet = useStrike((s) => s.openSheet);
  const closeSheet = useStrike((s) => s.closeSheet);

  return (
    <nav>
      {TABS.map(({ t, label, Icon }) => (
        <button
          key={t}
          className={tab === t ? "on" : undefined}
          onClick={() => {
            setTab(t);
            if (t === "call") closeSheet();
            else openSheet(t);
          }}
        >
          <Icon />
          {label}
        </button>
      ))}
    </nav>
  );
}
