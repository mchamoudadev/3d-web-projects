import { Color, ShapeUtils, Vector2 } from "three";
export interface MeshData {
  position: Float32Array;
  normal: Float32Array;
  color: Float32Array;
  uv: Float32Array;
}
export class MeshBuilder {
  p: number[] = [];
  n: number[] = [];
  c: number[] = [];
  u: number[] = [];
  triangle(
    a: number[],
    b: number[],
    c: number[],
    color: Color,
    uv: number[][] = [
      [0, 0],
      [0, 0],
      [0, 0],
    ],
  ) {
    const ux = b[0] - a[0],
      uy = b[1] - a[1],
      uz = b[2] - a[2],
      vx = c[0] - a[0],
      vy = c[1] - a[1],
      vz = c[2] - a[2];
    let nx = uy * vz - uz * vy,
      ny = uz * vx - ux * vz,
      nz = ux * vy - uy * vx;
    const len = Math.hypot(nx, ny, nz) || 1;
    nx /= len;
    ny /= len;
    nz /= len;
    for (const [i, v] of [a, b, c].entries()) {
      this.p.push(...v);
      this.n.push(nx, ny, nz);
      this.c.push(color.r, color.g, color.b);
      this.u.push(...uv[i]);
    }
  }
  quad(
    a: number[],
    b: number[],
    c: number[],
    d: number[],
    color: Color,
    width = 1,
    height = 1,
  ) {
    this.triangle(a, b, c, color, [
      [0, 0],
      [width, 0],
      [width, height],
    ]);
    this.triangle(a, c, d, color, [
      [0, 0],
      [width, height],
      [0, height],
    ]);
  }
  polygon(rings: number[][][], height: number, color: Color) {
    if (!rings[0] || rings[0].length < 3) return;
    const vectors = rings.map((r) =>
        r
          .slice(
            0,
            r.length -
              Number(
                r.length > 1 &&
                  r[0][0] === r.at(-1)![0] &&
                  r[0][1] === r.at(-1)![1],
              ),
          )
          .map((p) => new Vector2(p[0], p[1])),
      ),
      all = vectors.flat();
    for (const t of ShapeUtils.triangulateShape(vectors[0], vectors.slice(1))) {
      const points = t.map((i) => [all[i].x, height, all[i].y]);
      this.triangle(
        points[0],
        points[2],
        points[1],
        color,
        points.map((p) => [p[0], p[2]]),
      );
    }
  }
  finish(): MeshData {
    return {
      position: new Float32Array(this.p),
      normal: new Float32Array(this.n),
      color: new Float32Array(this.c),
      uv: new Float32Array(this.u),
    };
  }
}
export function hash(id: number) {
  let n = id | 0;
  n = Math.imul(n ^ (n >>> 16), 0x45d9f3b);
  n = Math.imul(n ^ (n >>> 16), 0x45d9f3b);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
}
export type Road = { points: number[][]; width: number; major: boolean };
export type Footprint = { rings: number[][][]; height: number };
export type Decoration = {
  x: number;
  z: number;
  y: number;
  kind: "tank" | "mosque" | "hospital";
  seed: number;
};
export interface BuiltTile {
  key: string;
  buildings: MeshData;
  roads: MeshData;
  land: MeshData;
  water: MeshData;
  footprints: Footprint[];
  walkways: Road[];
  beaches: number[][][];
  trees: number[][];
  decorations: Decoration[];
  buildingCount: number;
}
