import * as T from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { landmarks } from "@/config/landmarks";
import { toWorld } from "@/lib/geo";
import { facadeMaterial } from "./buildings";
import { referenceLandmark } from "./referenceLandmarks";
// Silhouettes are schematic; only footprint positions come from OSM.
export function createLandmarks(night = { value: 0 }) {
  const group = new T.Group(),
    stone = facadeMaterial(night),
    blue = new T.MeshStandardMaterial({ color: "#728e90", roughness: 0.7 }),
    roof = new T.MeshStandardMaterial({ color: "#969484" });
  stone.vertexColors = false;
  stone.color.set("#d4cab1");
  function box(
    root: T.Group,
    w: number,
    h: number,
    d: number,
    x = 0,
    z = 0,
    y = 0,
    material = stone,
  ) {
    const geometry = new T.BoxGeometry(w, h, d),
      uv = geometry.getAttribute("uv");
    for (let i = 0; i < uv.count; i++) {
      const face = Math.floor(i / 4);
      uv.setXY(
        i,
        uv.getX(i) * (face < 2 ? d : w),
        uv.getY(i) * (face === 2 || face === 3 ? d : h),
      );
    }
    const m = new T.Mesh(geometry, material);
    m.position.set(x, y + h / 2, z);
    m.castShadow = true;
    m.receiveShadow = true;
    root.add(m);
    return m;
  }
  for (const p of landmarks) {
    const root = new T.Group(),
      [x, z] = toWorld([p.lng, p.lat]);
    root.position.set(x, 0, z);
    root.rotation.y = (p.bearing * Math.PI) / 180;
    root.name = p.id;
    root.userData.place = p;
    const reference = referenceLandmark(p.id);
    if (p.model)
      new GLTFLoader().load(p.model, (glb) => {
        glb.scene.scale.setScalar(p.scale);
        root.add(glb.scene);
      });
    else if (reference) root.add(reference);
    else if (p.category === "airport") {
      box(root, 125, 11, 32);
      box(root, 135, 1, 37, 0, 0, 11, roof);
      box(root, 9, 27, 9, 58, -17);
      box(root, 14, 4, 14, 58, -17, 27, blue);
    } else if (p.category === "mosque") {
      box(root, 22, 7, 18);
      const dome = new T.Mesh(
        new T.SphereGeometry(7, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2),
        blue,
      );
      dome.position.y = 7;
      root.add(dome);
      const minaret = new T.Mesh(
        new T.CylinderGeometry(1.1, 1.5, 24, 8),
        stone,
      );
      minaret.position.set(13, 12, -8);
      root.add(minaret);
      const spire = new T.Mesh(new T.ConeGeometry(1.8, 4, 8), blue);
      spire.position.set(13, 26, -8);
      root.add(spire);
    } else if (p.id === "villa-somalia") {
      box(root, 42, 9, 12, 0, -15);
      box(root, 10, 8, 30, -21, 0);
      box(root, 10, 8, 30, 21, 0);
      box(root, 55, 1.3, 1, 0, 19);
      for (const x of [-13, -6, 1, 8, 15]) box(root, 0.8, 6, 1, x, -7);
    } else if (p.id === "national-theatre") {
      box(root, 38, 13, 25);
      for (let i = -3; i <= 3; i++) box(root, 1.3, 11, 1.3, i * 5, 15);
      box(root, 43, 1.5, 8, 0, 15, 11);
    } else if (p.category === "government") {
      box(root, 35, 11, 22);
      for (let i = -3; i <= 3; i++) box(root, 1, 8, 1, i * 4, 13);
      box(root, 38, 1, 6, 0, 13, 9);
    } else if (p.category === "hospital") {
      box(root, 32, 15, 12);
      box(root, 12, 12, 30);
      const sign = new T.MeshStandardMaterial({
        color: "#a3ddc1",
        emissive: "#84bda2",
        emissiveIntensity: 0.6,
      });
      box(root, 4, 0.9, 0.25, 0, 6.2, 11, sign);
      box(root, 0.9, 4, 0.25, 0, 6.2, 9.5, sign);
      box(root, 4, 3, 0.2, 0, -15.1, 0, blue);
      box(root, 7, 0.5, 4, 0, -16, 3.2, roof);
      box(root, 4, 0.9, 0.25, 0, -15.2, 8, sign);
      box(root, 0.9, 4, 0.25, 0, -15.2, 6.5, sign);
    } else if (p.category === "university" && p.id !== "jamhuriya-university") {
      box(root, 35, 10, 13);
      box(root, 13, 8, 26, -17, 6);
    } else if (p.category === "market") {
      for (let i = -2; i <= 2; i++)
        box(root, 9, 3, 18, i * 11, 0, 0, i % 2 ? roof : blue);
    } else if (p.id === "port") {
      for (let i = 0; i < 3; i++) {
        box(root, 2, 30, 2, i * 30, 0, 0, roof);
        box(root, 2, 2, 45, i * 30, 12, 28, roof);
      }
    }
    // Beach, junction and garden stay open rather than receiving invented buildings.
    group.add(root);
  }
  return group;
}
