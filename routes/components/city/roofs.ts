import { Color, ShapeUtils, Vector2 } from "three";
import { MeshBuilder } from "./geometry";

// Split roof triangles at their ridges before lifting them. Footprints and holes stay intact.
export function roofGeometry(
  mesh: MeshBuilder,
  rings: number[][][],
  base: number,
  rise: number,
  shape: string,
  color: Color,
) {
  const outer = rings[0];
  let axis = [1, 0],
    longest = 0;
  for (let i = 1; i < outer.length; i++) {
    const dx = outer[i][0] - outer[i - 1][0],
      dz = outer[i][1] - outer[i - 1][1],
      length = Math.hypot(dx, dz);
    if (length > longest) {
      longest = length;
      axis = [dx / length, dz / length];
    }
  }
  const uv = (p: number[]) => [
    p[0] * axis[0] + p[1] * axis[1],
    -p[0] * axis[1] + p[1] * axis[0],
  ];
  const bounds = outer.map(uv),
    minU = Math.min(...bounds.map((p) => p[0])),
    maxU = Math.max(...bounds.map((p) => p[0])),
    minV = Math.min(...bounds.map((p) => p[1])),
    maxV = Math.max(...bounds.map((p) => p[1]));
  const midU = (minU + maxU) / 2,
    midV = (minV + maxV) / 2;
  const elevation = (p: number[]) => {
    const [u, v] = uv(p),
      across = Math.max(
        0,
        1 - Math.abs(v - midV) / Math.max(0.1, (maxV - minV) / 2),
      ),
      along = Math.max(
        0,
        1 - Math.abs(u - midU) / Math.max(0.1, (maxU - minU) / 2),
      );
    const profile =
      shape === "skillion"
        ? (v - minV) / Math.max(0.1, maxV - minV)
        : shape === "hipped" || shape === "pyramidal" || shape === "dome"
          ? Math.min(across, along)
          : shape === "round"
            ? Math.sqrt(Math.max(0, 1 - (1 - across) ** 2))
            : across;
    return base + rise * profile;
  };
  const split = (
    poly: number[][],
    coordinate: number,
    at: number,
    sign: number,
  ) => {
    const out: number[][] = [];
    for (let i = 0; i < poly.length; i++) {
      const a = poly[i],
        b = poly[(i + 1) % poly.length],
        da = (uv(a)[coordinate] - at) * sign,
        db = (uv(b)[coordinate] - at) * sign;
      if (da >= -1e-7) out.push(a);
      if ((da > 0 && db < 0) || (da < 0 && db > 0)) {
        const t = da / (da - db);
        out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
      }
    }
    return out;
  };
  const vectors = rings.map((r) =>
      r
        .slice(
          0,
          r[0][0] === r.at(-1)![0] && r[0][1] === r.at(-1)![1] ? -1 : undefined,
        )
        .map((p) => new Vector2(...(p as [number, number]))),
    ),
    all = vectors.flat();
  for (const triangle of ShapeUtils.triangulateShape(
    vectors[0],
    vectors.slice(1),
  )) {
    let pieces = [triangle.map((i) => [all[i].x, all[i].y])];
    for (const [coordinate, at] of [
      [0, midU],
      [1, midV],
    ])
      pieces = pieces
        .flatMap((p) => [
          split(p, coordinate, at, 1),
          split(p, coordinate, at, -1),
        ])
        .filter((p) => p.length >= 3);
    for (const p of pieces)
      for (let i = 1; i < p.length - 1; i++) {
        const pts = [p[0], p[i + 1], p[i]];
        mesh.triangle(
          ...(pts.map((q) => [q[0], elevation(q), q[1]]) as [
            number[],
            number[],
            number[],
          ]),
          color,
          pts.map(uv),
        );
      }
  }
  // Gable end infill follows the same roof profile, with no floating roof edges.
  for (const ring of rings)
    for (let i = 1; i < ring.length; i++) {
      const a = ring[i - 1],
        b = ring[i],
        points = [a, b];
      const av = uv(a)[1],
        bv = uv(b)[1];
      if ((av - midV) * (bv - midV) < 0) {
        const t = (midV - av) / (bv - av);
        points.splice(1, 0, [
          a[0] + (b[0] - a[0]) * t,
          a[1] + (b[1] - a[1]) * t,
        ]);
      }
      for (let j = 1; j < points.length; j++) {
        const p = points[j - 1],
          q = points[j];
        mesh.quad(
          [p[0], base, p[1]],
          [q[0], base, q[1]],
          [q[0], elevation(q), q[1]],
          [p[0], elevation(p), p[1]],
          color.clone().multiplyScalar(0.9),
        );
      }
    }
}
