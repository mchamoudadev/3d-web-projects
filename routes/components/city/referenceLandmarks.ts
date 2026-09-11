import * as T from "three";

// Visual approximations from the dated, attributed photographs in landmark-media.json.
// Dimensions and unseen surfaces are estimates, not a survey or photogrammetry.
export function referenceLandmark(id: string): T.Group | null {
  if (id !== "daljirka" && id !== "cathedral") return null;
  const group = new T.Group();
  const stone = new T.MeshStandardMaterial({ color: id === "daljirka" ? "#b4b6ae" : "#b8ae94", roughness: 0.98 });
  stone.onBeforeCompile = shader => {
    shader.vertexShader = "varying vec3 vStone;\n" + shader.vertexShader.replace("#include <begin_vertex>", "#include <begin_vertex>\nvStone = position;");
    shader.fragmentShader = "varying vec3 vStone;\n" + shader.fragmentShader.replace("#include <color_fragment>", `#include <color_fragment>
      float course = step(0.96, fract(vStone.y * 1.35));
      float mottling = sin(vStone.x * 5.3 + sin(vStone.y * 3.7)) * sin(vStone.y * 8.1 + vStone.z * 5.0);
      diffuseColor.rgb *= 0.91 + 0.07 * mottling - 0.12 * course;
    `);
  };
  const trim = new T.MeshStandardMaterial({ color: "#c6b89c", roughness: 0.96 });
  const dark = new T.MeshStandardMaterial({ color: "#625e50", roughness: 1 });
  function mesh(geometry: T.BufferGeometry, material: T.Material, x = 0, y = 0, z = 0) {
    const m = new T.Mesh(geometry, material);
    m.position.set(x, y, z);
    m.castShadow = m.receiveShadow = true;
    group.add(m);
    return m;
  }
  function box(w: number, h: number, d: number, x = 0, y = 0, z = 0, material = stone) {
    return mesh(new T.BoxGeometry(w, h, d), material, x, y + h / 2, z);
  }
  function wall(points: [number, number][], depth: number, x = 0, z = 0, material = stone) {
    const shape = new T.Shape(points.map(p => new T.Vector2(...p)));
    shape.closePath();
    const geometry = new T.ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments: 8 });
    return mesh(geometry, material, x, 0, z);
  }
  if (id === "daljirka") {
    for (let i = 0; i < 3; i++) box(9 - i * 1.1, 0.3, 9 - i * 1.1, 0, i * 0.3);
    box(3.8, 3.5, 3.8, 0, 0.9);
    box(4.15, 0.3, 4.15, 0, 4.4);
    const shaft = new T.BoxGeometry(2.5, 18, 2.5), positions = shaft.getAttribute("position");
    for (let i = 0; i < positions.count; i++) {
      const scale = positions.getY(i) > 0 ? 0.47 : 1;
      positions.setX(i, positions.getX(i) * scale);
      positions.setZ(i, positions.getZ(i) * scale);
    }
    shaft.computeVertexNormals();
    mesh(shaft, stone, 0, 13.7, 0);
    const tip = mesh(new T.ConeGeometry(0.83, 0.5, 4), stone, 0, 22.95, 0);
    tip.rotation.y = Math.PI / 4;
    const blue = new T.MeshStandardMaterial({ color: "#70b5d1", roughness: 0.9 });
    box(2.3, 2.5, 0.06, 0, 1.25, 1.93, blue);
    const star = new T.Shape();
    for (let i = 0; i < 10; i++) {
      const a = Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 0.18 : 0.43;
      if (i === 0) star.moveTo(Math.cos(a) * r, Math.sin(a) * r);
      else star.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    star.closePath();
    mesh(new T.ShapeGeometry(star), new T.MeshStandardMaterial({ color: "#f4f1df", side: T.DoubleSide }), 0, 2.7, 1.97);
    // Low garden edges and the axial paved approach visible in the 2015 reference.
    box(3.2, 0.12, 14, 0, 0, 11, trim);
    for (const x of [-5, 5]) {
      box(0.25, 0.28, 15, x, 0, 11);
      box(3.2, 0.18, 12, x * 1.35, 0, 11, new T.MeshStandardMaterial({ color: "#697752", roughness: 1 }));
    }
  } else {
    // Surviving facade: a tall broken tower on the left, lost upper right tower,
    // open pointed window, recessed portal and roofless nave, as photographed in 2022.
    for (let i = 0; i < 6; i++) box(26, 0.25, 11 - i * 1.4, 0, i * 0.25, 7, trim);
    box(22, 1.5, 28, 0, 0, -8, dark);
    box(9, 13.5, 1.3, -6.5, 1.5, 0);
    box(9, 13.5, 1.3, 6.5, 1.5, 0);
    // Central window is an actual opening, not a black texture on a solid block.
    wall([[-2, 1.5], [-2, 7.7], [-1.55, 8.5], [0, 9.4], [1.55, 8.5], [2, 7.7], [2, 1.5], [3, 1.5], [3, 15], [-3, 15], [-3, 1.5]], 1.3);
    box(5.7, 2.3, 1.5, 0, 15, 0);
    box(0.45, 1.6, 0.1, 0, 15.3, 1.42, trim);
    box(1.4, 0.45, 0.1, 0, 16.0, 1.42, trim);
    // Portal surround in nested pointed bands, with a recessed doorway below.
    for (let i = 0; i < 3; i++) {
      const w = 3.0 + i * 0.3, h = 4.8 + i * 0.28;
      const path = new T.Shape();
      path.moveTo(-w, 1.5); path.lineTo(-w, h);
      path.quadraticCurveTo(-w * 0.9, h + 1.7, 0, h + 3.3);
      path.quadraticCurveTo(w * 0.9, h + 1.7, w, h);
      path.lineTo(w, 1.5); path.lineTo(w - 0.18, 1.5); path.lineTo(w - 0.18, h);
      path.quadraticCurveTo(w * 0.85, h + 1.5, 0, h + 3.08);
      path.quadraticCurveTo(-w * 0.85, h + 1.5, -w + 0.18, h);
      path.lineTo(-w + 0.18, 1.5); path.closePath();
      mesh(new T.ExtrudeGeometry(path, { depth: 0.22, bevelEnabled: false, curveSegments: 8 }), trim, 0, 0, 1.4 + i * 0.16);
    }
    box(3.2, 4.0, 0.4, 0, 1.5, -0.15, dark);
    box(1.0, 2.8, 0.1, 0, 1.5, 0.12, trim);
    for (const side of [-1, 1]) {
      for (let i = 0; i < 6; i++) {
        const x = side * (3.7 + i * 1.25);
        box(0.19, 1.3, 0.22, x, 12.7, 1.45, trim);
        const arc = mesh(new T.TorusGeometry(0.48, 0.08, 4, 10, Math.PI), trim, x + side * 0.6, 14, 1.58);
        arc.rotation.z = 0;
      }
      for (let i = 0; i < 5; i++) box(0.65, 0.85, 1.3, side * (3.8 + i * 1.65), 15);
      box(8.3, 0.25, 1.65, side * 6.65, 14.7, 0, trim);
    }
    wall([[-1.2, 1.5], [-1.6, 5], [-1.0, 7], [-1.3, 10], [-0.8, 12], [-1.0, 14.8], [-0.4, 16.5], [-0.6, 19.7], [0.1, 21.3], [0.05, 24], [0.9, 23.5], [1.2, 24.2], [1.6, 22.8], [1.6, 1.5]], 2.3, -11.2, -0.5);
    wall([[0, 1.5], [0, 6], [0.5, 7], [1.1, 6.5], [1.4, 8], [2.1, 8.4], [2.8, 7.8], [2.8, 1.5]], 2.5, 10.5, -1.5);
    for (const x of [-11.2, 11.2]) {
      for (let i = 0; i < 7; i++) {
        box(1.4, 5.5 + (i % 3) * 0.6, 3.7, x, 1.5, -3.5 - i * 3.4);
        box(1.8, 0.4, 3.8, x, 7.0 + (i % 3) * 0.6, -3.5 - i * 3.4, dark);
      }
    }
    for (let i = 0; i < 12; i++) {
      const block = box(0.6 + (i % 3) * 0.3, 0.6, 0.7, Math.sin(i * 6.7) * 11, 1.5, 2.8 + Math.cos(i * 2.2), i % 3 ? stone : dark);
      block.rotation.set(i * 0.22, i * 0.83, i * 0.12);
    }
  }
  group.userData.appearance = "reference approximation";
  return group;
}
