import places from "@/data/landmarks.json";
import type { Place } from "@/lib/types";
export interface Landmark extends Place {
  model: string | null;
  scale: number;
  bearing: number;
}
// Replace model with a local /models/name.glb path to load a surveyed model.
export const landmarks: Landmark[] = (places as Place[])
  .filter((p) => p.category !== "district")
  .map((p) => ({ ...p, model: null, scale: 1, bearing: 0 }));
