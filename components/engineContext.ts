"use client";

import { createContext, useContext } from "react";
import type { Dir } from "@/lib/types";
import type { Signer } from "@/lib/drift/rail";

export interface EngineActions {
  makeCall: (d: Dir) => void;
  cashOut: () => void;
  setSigner: (s: Signer | null) => void;
}

export const EngineContext = createContext<EngineActions>({
  makeCall: () => {},
  cashOut: () => {},
  setSigner: () => {},
});

export const useEngine = () => useContext(EngineContext);
