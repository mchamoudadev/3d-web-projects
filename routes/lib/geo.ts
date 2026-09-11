import type { Coordinate } from "./types";
import coverage from "@/config/coverage.json";
export const BOUNDS = coverage.bbox;
export const ORIGIN: Coordinate = [45.34, 2.04];
const COS = Math.cos((ORIGIN[1] * Math.PI) / 180);
const R = 6378137,
  C = 2 * Math.PI * R,
  y0 = Math.log(Math.tan(Math.PI / 4 + (ORIGIN[1] * Math.PI) / 360)) * R;
export const meterScale = 1 / (C * Math.cos((ORIGIN[1] * Math.PI) / 180));
export function toWorld(p: number[]): [number, number] {
  return [
    (((p[0] - ORIGIN[0]) * Math.PI) / 180) * R * COS,
    (y0 - Math.log(Math.tan(Math.PI / 4 + (p[1] * Math.PI) / 360)) * R) * COS,
  ];
}
export function toLngLat(x: number, z: number): Coordinate {
  return [
    ORIGIN[0] + ((x / COS / R) * 180) / Math.PI,
    ((2 * Math.atan(Math.exp((y0 - z / COS) / R)) - Math.PI / 2) * 180) /
      Math.PI,
  ];
}
export function distance(a: number[], b: number[]) {
  const [x, z] = toWorld(a),
    [xx, zz] = toWorld(b);
  return Math.hypot(xx - x, zz - z);
}
export function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}
export function smooth(n: number) {
  const t = clamp(n, 0, 1);
  return t * t * t * (t * (t * 6 - 15) + 10);
}
export function mix(a: number, b: number, t: number) {
  return a + (b - a) * t;
}
export function inBounds(p: Coordinate) {
  return (
    p[0] >= BOUNDS[0] &&
    p[0] <= BOUNDS[2] &&
    p[1] >= BOUNDS[1] &&
    p[1] <= BOUNDS[3]
  );
}
export function segmentDistance(p: number[], a: number[], b: number[]) {
  const dx = b[0] - a[0],
    dy = b[1] - a[1],
    d = dx * dx + dy * dy;
  const t = d ? clamp(((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / d, 0, 1) : 0;
  return {
    distance: Math.hypot(p[0] - a[0] - dx * t, p[1] - a[1] - dy * t),
    t,
    point: [a[0] + dx * t, a[1] + dy * t],
  };
}
export function pointInRing(p: number[], ring: number[][]) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const a = ring[i],
      b = ring[j];
    if (
      a[1] > p[1] !== b[1] > p[1] &&
      p[0] < ((b[0] - a[0]) * (p[1] - a[1])) / (b[1] - a[1]) + a[0]
    )
      inside = !inside;
  }
  return inside;
}
