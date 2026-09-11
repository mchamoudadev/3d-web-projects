import { Color } from "three";
import { MeshBuilder, type Footprint } from "./geometry";

export const surfaceColors: Record<string, string> = {
  beach: "#e2cfad",
  park: "#75835e",
  garden: "#768466",
  grass: "#8a956d",
  forest: "#5b7156",
  meadow: "#a6ad77",
  recreation_ground: "#82946c",
  pitch: "#718668",
  playground: "#c6aa7c",
  stadium: "#a2957c",
  residential: "#bcab91",
  commercial: "#b4ab99",
  retail: "#b6a78d",
  industrial: "#a4a49b",
  construction: "#c7b491",
  farmland: "#a8a477",
  farmyard: "#b1a382",
  cemetery: "#9c9c83",
  parking: "#8a8b84",
  apron: "#999b96",
  pier: "#b2b2a5",
};
export function infrastructure(
  mesh: MeshBuilder,
  line: number[][],
  tags: Record<string, unknown>,
): Footprint[] {
  const kind = String(tags.class),
    wall = kind === "wall" || kind === "fence",
    runway = kind === "runway";
  const width = Math.max(
    0.3,
    Math.min(
      80,
      Number(tags.width) ||
        (wall ? 0.35 : runway ? 42 : kind === "taxiway" ? 18 : 7),
    ),
  );
  const height = wall
    ? Math.max(
        0.8,
        Math.min(5, Number(tags.height) || (kind === "fence" ? 1.6 : 2.2)),
      )
    : 0.14;
  const color = new Color(
      wall ? "#b8b09a" : runway || kind === "taxiway" ? "#626a6a" : "#a7a9a0",
    ),
    obstacles: Footprint[] = [];
  let along = 0;
  for (let i = 1; i < line.length; i++) {
    const a = line[i - 1],
      b = line[i],
      dx = b[0] - a[0],
      dz = b[1] - a[1],
      len = Math.hypot(dx, dz);
    if (len < 0.05) continue;
    const nx = ((-dz / len) * width) / 2,
      nz = ((dx / len) * width) / 2;
    const ring = [
      [a[0] + nx, a[1] + nz],
      [b[0] + nx, b[1] + nz],
      [b[0] - nx, b[1] - nz],
      [a[0] - nx, a[1] - nz],
      [a[0] + nx, a[1] + nz],
    ];
    mesh.polygon([ring], height, color);
    if (wall) {
      for (let j = 1; j < ring.length; j++)
        mesh.quad(
          [ring[j - 1][0], 0, ring[j - 1][1]],
          [ring[j][0], 0, ring[j][1]],
          [ring[j][0], height, ring[j][1]],
          [ring[j - 1][0], height, ring[j - 1][1]],
          color,
        );
      obstacles.push({ rings: [ring], height });
    }
    if (runway)
      for (let d = (45 - (along % 45)) % 45; d < len; d += 45) {
        const s = d / len,
          t = Math.min(len, d + 24) / len,
          n = 0.65;
        mesh.quad(
          [
            a[0] + dx * s - (dz / len) * n,
            0.16,
            a[1] + dz * s + (dx / len) * n,
          ],
          [
            a[0] + dx * t - (dz / len) * n,
            0.16,
            a[1] + dz * t + (dx / len) * n,
          ],
          [
            a[0] + dx * t + (dz / len) * n,
            0.16,
            a[1] + dz * t - (dx / len) * n,
          ],
          [
            a[0] + dx * s + (dz / len) * n,
            0.16,
            a[1] + dz * s - (dx / len) * n,
          ],
          new Color("#eee8d9"),
        );
      }
    along += len;
  }
  return obstacles;
}
