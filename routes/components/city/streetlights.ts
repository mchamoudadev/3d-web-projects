import * as T from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import type { Road } from "./geometry";
export function streetlights(roads: Road[], night: { value: number }) {
  const points: number[][] = [];
  for (const road of roads.filter((r) => r.major))
    for (let i = 1; i < road.points.length; i++) {
      const a = road.points[i - 1],
        b = road.points[i],
        dx = b[0] - a[0],
        dz = b[1] - a[1],
        len = Math.hypot(dx, dz);
      for (let d = 45; d < len; d += 95)
        points.push([
          a[0] + (dx * d) / len - (dz / len) * (road.width / 2 + 0.8),
          a[1] + (dz * d) / len + (dx / len) * (road.width / 2 + 0.8),
        ]);
    }
  const root = new T.Group(),
    pole = new T.CylinderGeometry(0.09, 0.16, 7, 5).translate(0, 3.5, 0),
    arm = new T.BoxGeometry(1.5, 0.12, 0.12).translate(0.7, 6.9, 0),
    merged = mergeGeometries([pole, arm]);
  pole.dispose();
  arm.dispose();
  const poles = new T.InstancedMesh(
      merged,
      new T.MeshStandardMaterial({ color: "#5f6763" }),
      points.length,
    ),
    bulb = new T.InstancedMesh(
      new T.BoxGeometry(0.8, 0.12, 0.4),
      new T.MeshBasicMaterial({ color: "#ffdcb1" }),
      points.length,
    );
  const material = new T.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: { uNight: night },
      vertexShader:
        "varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*instanceMatrix*vec4(position,1.);}",
      fragmentShader:
        "uniform float uNight;varying vec2 vUv;void main(){float d=length(vUv-.5)*2.;gl_FragColor=vec4(1.,.67,.31,pow(max(0.,1.-d),2.)*.22*uNight);}",
    }),
    pools = new T.InstancedMesh(
      new T.PlaneGeometry(18, 18).rotateX(-Math.PI / 2),
      material,
      points.length,
    ),
    dummy = new T.Object3D();
  points.forEach(([x, z], i) => {
    dummy.position.set(x, 0, z);
    dummy.updateMatrix();
    poles.setMatrixAt(i, dummy.matrix);
    dummy.position.set(x + 0.9, 7, z);
    dummy.updateMatrix();
    bulb.setMatrixAt(i, dummy.matrix);
    dummy.position.set(x + 0.9, 0.16, z);
    dummy.updateMatrix();
    pools.setMatrixAt(i, dummy.matrix);
  });
  root.add(poles, bulb, pools);
  return root;
}
