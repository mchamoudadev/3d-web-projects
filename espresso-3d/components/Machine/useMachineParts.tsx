"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { Group } from "three";

export const partNames = ["body", "sidePanelL", "sidePanelR", "dripTray", "portafilter", "basket", "groupHead", "boiler", "heatingElement", "pump", "reservoir", "steamWand", "cup", "pitcher"] as const;
export type PartName = typeof partNames[number];
type MachineParts = { parts: Partial<Record<PartName, Group>>; register: (name: PartName, group: Group | null) => void };
const MachineContext = createContext<MachineParts | null>(null);

export function MachinePartsProvider({ children }: { children: ReactNode }) {
  const value = useMemo<MachineParts>(() => {
    const parts: MachineParts["parts"] = {};
    return { parts, register: (name, group) => { if (group) parts[name] = group; else delete parts[name]; } };
  }, []);
  return <MachineContext.Provider value={value}>{children}</MachineContext.Provider>;
}

export function useMachineParts() {
  const context = useContext(MachineContext);
  if (!context) throw new Error("Machine parts require MachinePartsProvider.");
  return context;
}
