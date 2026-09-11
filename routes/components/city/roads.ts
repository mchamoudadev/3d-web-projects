import { Color, MeshStandardMaterial } from "three";
import { MeshBuilder, type Road } from "./geometry";
export function roadWidth(tags: Record<string, unknown>) {
  const explicit = Number(tags.width);
  if (explicit > 0) return Math.max(1, Math.min(35, explicit));
  const lanes = Number(tags.lanes);
  if (lanes > 0) return Math.max(3, Math.min(28, lanes * 3.2));
  const c = String(tags.class);
  return c === "motorway" || c === "trunk"
    ? 16
    : c === "primary"
      ? 13
      : c === "secondary"
        ? 10
        : c === "tertiary"
          ? 8
          : c === "footway" || c === "path"
            ? 2.5
            : c === "service"
              ? 4
              : 6;
}
export function buildRoad(
  mesh: MeshBuilder,
  points: number[][],
  tags: Record<string, unknown>,
): Road {
  const width = roadWidth(tags),
    major = ["primary", "secondary", "trunk", "motorway"].includes(
      String(tags.class),
    ),
    dust = ["unpaved", "dirt", "sand", "gravel", "earth"].includes(
      String(tags.surface),
    ),
    color = new Color(dust ? "#9e8965" : major ? "#515657" : "#65645b");
  let along = 0;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1],
      b = points[i],
      dx = b[0] - a[0],
      dz = b[1] - a[1],
      len = Math.hypot(dx, dz);
    if (len < 0.05) continue;
    const nx = ((-dz / len) * width) / 2,
      nz = ((dx / len) * width) / 2;
    const verts = [
      [a[0] + nx, 0.12, a[1] + nz],
      [b[0] + nx, 0.12, b[1] + nz],
      [b[0] - nx, 0.12, b[1] - nz],
      [a[0] - nx, 0.12, a[1] - nz],
    ];
    mesh.triangle(verts[0], verts[1], verts[2], color, [
      [major ? 0 : 2, along],
      [major ? 0 : 2, along + len],
      [major ? 1 : 3, along + len],
    ]);
    mesh.triangle(verts[0], verts[2], verts[3], color, [
      [major ? 0 : 2, along],
      [major ? 1 : 3, along + len],
      [major ? 1 : 3, along],
    ]);
    along += len;
    // Overlapping round ends seal intersections and curved joins without cracks.
    for (const p of [a, b])
      for (let j = 0; j < 10; j++) {
        const t = (j / 10) * Math.PI * 2,
          u = ((j + 1) / 10) * Math.PI * 2;
        mesh.triangle(
          [p[0], 0.115, p[1]],
          [
            p[0] + (Math.cos(u) * width) / 2,
            0.115,
            p[1] + (Math.sin(u) * width) / 2,
          ],
          [
            p[0] + (Math.cos(t) * width) / 2,
            0.115,
            p[1] + (Math.sin(t) * width) / 2,
          ],
          color,
        );
      }
  }
  return { points, width, major };
}
export function roadMaterial() {
  const m = new MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.99,
    side: 2,
  });
  m.onBeforeCompile = (s) => {
    s.vertexShader =
      "varying vec2 vRoad;\n" +
      s.vertexShader.replace(
        "#include <uv_vertex>",
        "#include <uv_vertex>\nvRoad=uv;",
      );
    s.fragmentShader = "varying vec2 vRoad;\n" + s.fragmentShader;
    s.fragmentShader = s.fragmentShader.replace(
      "#include <color_fragment>",
      `#include <color_fragment>
 float major=step(0.001,vRoad.x)*step(vRoad.x,.999);
 float dash=step(fract(vRoad.y/9.),.55)*step(abs(vRoad.x-.5),.011)*major;
 float edge=step(abs(abs(vRoad.x-.5)-.45),.007)*major;
 float grain=fract(sin(dot(vRoad,vec2(12.98,78.23)))*43758.5);
 diffuseColor.rgb*=.96+grain*.08;
 diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.72,.67,.52),max(dash,edge)*.7);`,
    );
  };
  return m;
}
