import * as T from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import type { Decoration } from "./geometry";
const transform = new T.Object3D();
function instances(
  geometry: T.BufferGeometry,
  material: T.Material,
  points: number[][],
  scale: (p: number[]) => number,
) {
  const mesh = new T.InstancedMesh(geometry, material, points.length);
  points.forEach((p, i) => {
    transform.position.set(p[0], p[3] ?? 0, p[1]);
    transform.rotation.set(0, (p[2] ?? 0.5) * 20, 0);
    transform.scale.setScalar(scale(p));
    transform.updateMatrix();
    mesh.setMatrixAt(i, transform.matrix);
  });
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}
export function vegetation(points: number[][]) {
  const root = new T.Group();
  const palm = points.filter((p) => p[2] > 0.65),
    acacia = points.filter((p) => p[2] <= 0.65);
  const trunk = new T.CylinderGeometry(0.22, 0.38, 7, 5);
  trunk.translate(0, 3.5, 0);
  root.add(
    instances(
      trunk,
      new T.MeshStandardMaterial({ color: "#776b4c", roughness: 1 }),
      palm,
      (p) => 0.8 + p[2] * 0.5,
    ),
  );
  const fronds: T.BufferGeometry[] = [];
  for (let i = 0; i < 7; i++) {
    const geometry = new T.BufferGeometry();
    const p = [
      0, 7, 0, 1.1, 7.4, 1.6, 0, 6.2, 4.8, 0, 7, 0, 0, 6.2, 4.8, -1.1, 7.4, 1.6,
    ];
    geometry.setAttribute("position", new T.Float32BufferAttribute(p, 3));
    geometry.computeVertexNormals();
    geometry.rotateY((i / 7) * Math.PI * 2);
    fronds.push(geometry);
  }
  root.add(
    instances(
      mergeGeometries(fronds),
      new T.MeshStandardMaterial({
        color: "#556a3e",
        side: T.DoubleSide,
        roughness: 1,
      }),
      palm,
      (p) => 0.8 + p[2] * 0.5,
    ),
  );
  fronds.forEach((g) => g.dispose());
  const stem = new T.CylinderGeometry(0.2, 0.45, 5, 5);
  stem.translate(0, 2.5, 0);
  const crown = new T.IcosahedronGeometry(3, 1);
  crown.scale(1.5, 0.45, 1);
  crown.translate(0, 5, 0);
  root.add(
    instances(
      stem,
      new T.MeshStandardMaterial({ color: "#635746" }),
      acacia,
      (p) => 0.8 + p[2],
    ),
  );
  root.add(
    instances(
      crown,
      new T.MeshStandardMaterial({ color: "#53684b", flatShading: true }),
      acacia,
      (p) => 0.8 + p[2],
    ),
  );
  return root;
}
export function decorations(items: Decoration[], night: { value: number }) {
  const root = new T.Group(),
    tanks = items
      .filter((d) => d.kind === "tank")
      .map((d) => [d.x, d.z, d.seed, d.y + 0.9]);
  root.add(
    instances(
      new T.CylinderGeometry(0.8, 0.8, 1.8, 8),
      new T.MeshStandardMaterial({ color: "#555e60", roughness: 0.7 }),
      tanks,
      () => 1,
    ),
  );
  const stone = new T.MeshStandardMaterial({
    color: "#d7d1bd",
    roughness: 0.85,
  });
  for (const d of items.filter((d) => d.kind !== "tank")) {
    if (d.kind === "mosque") {
      const dome = new T.Mesh(
        new T.SphereGeometry(4, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2),
        new T.MeshStandardMaterial({ color: "#72887e", roughness: 0.6 }),
      );
      dome.position.set(d.x, d.y, d.z);
      dome.castShadow = true;
      root.add(dome);
      const tower = new T.Mesh(
        new T.CylinderGeometry(0.75, 1.1, d.y + 10, 8),
        stone,
      );
      tower.position.set(d.x + 6, (d.y + 10) / 2, d.z + 4);
      tower.castShadow = true;
      root.add(tower);
      const tip = new T.Mesh(new T.ConeGeometry(1.25, 3, 8), stone);
      tip.position.set(d.x + 6, d.y + 11.5, d.z + 4);
      root.add(tip);
    } else {
      const sign = new T.Group();
      for (const dims of [
        [4, 0.8, 0.3],
        [0.8, 4, 0.3],
      ]) {
        const mesh = new T.Mesh(
          new T.BoxGeometry(...(dims as [number, number, number])),
          new T.MeshStandardMaterial({
            color: "#85d6b2",
            emissive: "#60bb92",
            emissiveIntensity: 0.5 + night.value,
          }),
        );
        sign.add(mesh);
      }
      sign.position.set(d.x, d.y + 3, d.z);
      root.add(sign);
    }
  }
  return root;
}
