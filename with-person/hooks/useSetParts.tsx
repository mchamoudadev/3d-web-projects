"use client";
import {
  createContext,
  useContext,
  useMemo,
  useCallback,
  type ReactNode,
} from "react";
import { Group } from "three";
export const partNames = [
  "barista",
  "customer",
  "body",
  "sidePanelL",
  "sidePanelR",
  "dripTray",
  "portafilter",
  "basket",
  "groupHead",
  "brewButton",
  "boiler",
  "heatingElement",
  "pump",
  "reservoir",
  "steamWand",
  "grinder",
  "cup",
  "saucer",
  "pitcher",
  "tamper",
  "baristaHands",
  "viewerHands",
] as const;
export type PartName = (typeof partNames)[number];
type Registry = Map<PartName, Group>;
const PartsContext = createContext<Registry | null>(null);
export function SetPartsProvider({ children }: { children: ReactNode }) {
  const registry = useMemo<Registry>(() => new Map(), []);
  return (
    <PartsContext.Provider value={registry}>{children}</PartsContext.Provider>
  );
}
// Replace Part internals with the corresponding DRACO GLB nodes at the asset phase.
export function useSetParts() {
  const parts = useContext(PartsContext);
  if (!parts) throw new Error("Set parts must be inside SetPartsProvider");
  return parts;
}
export function Part({
  name,
  children,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
}: {
  name: PartName;
  children: ReactNode;
  position?: [number, number, number];
  rotation?: [number, number, number];
}) {
  const parts = useSetParts();
  const register = useCallback(
    (group: Group | null) => {
      if (group) parts.set(name, group);
      else parts.delete(name);
    },
    [name, parts],
  );
  return (
    <group ref={register} name={name} position={position} rotation={rotation}>
      {children}
    </group>
  );
}
