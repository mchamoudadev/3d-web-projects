import { CatmullRomCurve3, MathUtils, Vector3 } from "three";

export const chapters = [
  { id: "hero", start: 0, end: 0.05, label: "The anatomy of espresso", title: "Everything in between.", copy: "Nine bars. Twenty-five seconds." },
  { id: "exploded", start: 0.05, end: 0.18, label: "01 / The architecture", title: "Every part has one job.", copy: "Fourteen components. One outcome." },
  { id: "puck", start: 0.18, end: 0.28, label: "02 / The resistance", title: "Eighteen grams, ground fine enough to resist.", copy: "The puck is the only thing standing between water and cup." },
  { id: "water", start: 0.28, end: 0.42, label: "03 / The pressure", title: "Pressure is patience, compressed.", copy: "A vibration pump builds nine bars in under two seconds." },
  { id: "boiler", start: 0.42, end: 0.55, label: "04 / The temperature", title: "Ninety-three degrees, held steady.", copy: "Too hot burns. Too cool sours. The boiler holds the line." },
  { id: "extraction", start: 0.55, end: 0.75, label: "05 / The extraction", title: "Twenty-five seconds.", copy: "Watch it happen. Then watch it un-happen." },
  { id: "steam", start: 0.75, end: 0.85, label: "06 / The texture", title: "Steam, air, and a whirlpool.", copy: "Microfoam is a texture, not a topping." },
  { id: "pour", start: 0.85, end: 0.95, label: "07 / The ritual", title: "And then it is just coffee.", copy: "Everything, in one cup." },
  { id: "landing", start: 0.95, end: 1, label: "9 Bar", title: "Made for the moment.", copy: "Nine bars. Twenty-five seconds. One perfect ritual." },
] as const;

type Frame = { progress: number; position: [number, number, number]; lookAt: [number, number, number] };

// Phase 1 establishes the route. Interior distances will tighten with each scene.
export const cameraKeyframes: Frame[] = [
  { progress: 0, position: [6.6, 4.3, 10.8], lookAt: [-1.1, 0.35, 0] },
  { progress: 0.05, position: [6.2, 3.7, 10.2], lookAt: [-1.0, 0.4, 0] },
  { progress: 0.18, position: [5.3, 3.1, 8.2], lookAt: [-0.8, 0.3, 0.2] },
  { progress: 0.28, position: [2.8, 2.7, 6.8], lookAt: [-0.7, -0.2, 0.9] },
  { progress: 0.42, position: [-5.6, 3.5, 8.0], lookAt: [-0.8, 0.35, 0] },
  { progress: 0.55, position: [-2.8, 3.6, 7.2], lookAt: [-0.5, 0.6, 0] },
  { progress: 0.60, position: [0.8, 2.2, 5.3], lookAt: [-0.6, 0.0, 0.9] },
  { progress: 0.68, position: [1.4, 0.4, 5.1], lookAt: [-0.6, -0.7, 1.0] },
  { progress: 0.75, position: [2.5, 1.9, 5.6], lookAt: [-0.6, -0.8, 1.1] },
  { progress: 0.85, position: [5.0, 3.0, 6.0], lookAt: [0.1, -0.25, 0.7] },
  { progress: 0.95, position: [4.0, 4.0, 8.5], lookAt: [-0.9, -0.35, 0.7] },
  { progress: 1, position: [3.8, 3.9, 8.3], lookAt: [-0.9, -0.35, 0.7] },
];

// Densify on the time axis to preserve both timing and CatmullRom tangent continuity.
function sampleKeyframes(progress: number, field: "position" | "lookAt") {
  let index = cameraKeyframes.findIndex((frame) => frame.progress >= progress);
  if (index <= 0) index = progress === 0 ? 1 : cameraKeyframes.length - 1;
  const a = cameraKeyframes[index - 1];
  const b = cameraKeyframes[index];
  const t = MathUtils.smoothstep(progress, a.progress, b.progress);
  return new Vector3(...a[field]).lerp(new Vector3(...b[field]), t);
}

export const cameraPath = new CatmullRomCurve3(Array.from({ length: 401 }, (_, i) => sampleKeyframes(i / 400, "position")), false, "centripetal");
export const targetPath = new CatmullRomCurve3(Array.from({ length: 401 }, (_, i) => sampleKeyframes(i / 400, "lookAt")), false, "centripetal");
