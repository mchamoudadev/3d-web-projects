import { useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Vector3, Group, Object3D } from "three";
import { useProgress } from "@/store/progress";
import { sampleAction, ease } from "@/config/choreography";
import { useSetParts } from "./useSetParts";
import type { Vec3 } from "@/config/timeline";
const up = new Vector3(0, 1, 0),
  forward = new Vector3(0, 0, 1);
function segment(
  mesh: Object3D | undefined,
  a: Vector3,
  b: Vector3,
  scratch: Vector3,
) {
  if (!mesh) return;
  mesh.position.copy(a).add(b).multiplyScalar(0.5);
  scratch.subVectors(b, a);
  mesh.scale.y = scratch.length();
  mesh.quaternion.setFromUnitVectors(up, scratch.normalize());
}
export function useHands() {
  const parts = useSetParts();
  const work = useMemo(
    () => ({
      shoulder: new Vector3(),
      wrist: new Vector3(),
      elbow: new Vector3(),
      sleeveEnd: new Vector3(),
      delta: new Vector3(),
      direction: new Vector3(),
      bend: new Vector3(),
    }),
    [],
  );
  useFrame(() => {
    const p = useProgress.getState().progress,
      action = sampleAction(p);
    function pose(
      root: Group | undefined,
      hands: Group | undefined,
      targets: Vec3[],
      customer: boolean,
    ) {
      if (!root || !hands) return;
      if (!customer) {
        const lean = ease((p - 0.7) / 0.06) * (1 - ease((p - 0.8) / 0.05));
        root.position.z = -1.25 + lean * 0.65;
        root.rotation.x = 0.1 + lean * 0.17;
      }
      hands.updateWorldMatrix(true, false);
      targets.forEach((target, index) => {
        const side = index === 0 ? "L" : "R",
          sign = customer ? (index === 0 ? 1 : -1) : index === 0 ? -1 : 1;
        work.shoulder.set(sign * 0.54, 2.14, 0);
        work.wrist.set(...target);
        hands.worldToLocal(work.wrist);
        work.direction.subVectors(work.wrist, work.shoulder);
        const distance = work.direction.length();
        work.direction.normalize();
        const upper = Math.max(customer ? 1.1 : 1.25, distance * 0.49);
        const lower = Math.max(customer ? 1.2 : 1.35, distance * 0.52);
        const along =
          (upper * upper - lower * lower + distance * distance) /
          (2 * distance);
        const height = Math.sqrt(Math.max(0, upper * upper - along * along));
        work.bend.set(sign * 0.45, -0.25, 0.85);
        if (!customer)
          work.bend.lerp(
            work.sleeveEnd.set(0.15, 1.8, 2.2),
            ease((target[0] - 0.2) / 0.4),
          );
        work.bend
          .addScaledVector(work.direction, -work.bend.dot(work.direction))
          .normalize();
        work.elbow
          .copy(work.shoulder)
          .addScaledVector(work.direction, along)
          .addScaledVector(work.bend, height);
        if (!customer)
          work.elbow.lerp(
            work.sleeveEnd.set(0.95, 2.58, 1.65),
            ease((target[0] - 0.3) / 0.3) * (1 - ease((target[2] - 0.6) / 0.3)),
          );
        segment(
          hands.getObjectByName(`upper${side}`),
          work.shoulder,
          work.elbow,
          work.delta,
        );
        work.sleeveEnd.copy(work.shoulder).lerp(work.elbow, 0.58);
        segment(
          hands.getObjectByName(`sleeve${side}`),
          work.shoulder,
          work.sleeveEnd,
          work.delta,
        );
        segment(
          hands.getObjectByName(`lower${side}`),
          work.elbow,
          work.wrist,
          work.delta,
        );
        const palm = hands.getObjectByName(`palm${side}`);
        if (palm) {
          palm.position.copy(work.wrist);
          work.delta.subVectors(work.wrist, work.elbow).normalize();
          palm.quaternion.setFromUnitVectors(forward, work.delta);
        }
      });
      const head = root.getObjectByName("head");
      if (head) {
        head.rotation.x = customer
          ? 0.08 + 0.12 * Math.sin(Math.PI * p)
          : 0.12 + 0.16 * Math.sin(Math.PI * p);
        head.rotation.y = customer
          ? -0.1
          : Math.max(-0.3, Math.min(0.3, (action.cup[0] + 0.35) * 0.12));
      }
    }
    pose(
      parts.get("barista"),
      parts.get("baristaHands"),
      [action.left, action.right],
      false,
    );
    pose(
      parts.get("customer"),
      parts.get("viewerHands"),
      [action.customerL, action.customerR],
      true,
    );
  }, -1);
}
