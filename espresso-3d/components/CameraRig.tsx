import { useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Euler, Quaternion, Vector3 } from "three";
import { cameraPath, targetPath } from "@/config/timeline";
import { useProgress } from "@/store/progress";

export default function CameraRig() {
  const { camera, size } = useThree();
  const scratch = useMemo(() => ({ position: new Vector3(), target: new Vector3(), quaternion: new Quaternion(), euler: new Euler() }), []);
  useFrame(() => {
    const { progress, cursor, reducedMotion } = useProgress.getState();
    cameraPath.getPoint(progress, scratch.position);
    targetPath.getPoint(progress, scratch.target);
    if (size.width < 768) {
      scratch.target.x += 0.9;
      scratch.position.sub(scratch.target);
      scratch.position.multiplyScalar(Math.max(1.48, 19 / scratch.position.length())).add(scratch.target);
      scratch.target.y += 1.0;
    } else if (size.width / size.height < 1.5) {
      scratch.position.sub(scratch.target).multiplyScalar(1.2).add(scratch.target);
    }
    camera.position.copy(scratch.position);
    camera.lookAt(scratch.target);
    if (!reducedMotion) {
      const max = Math.PI / 180;
      scratch.euler.set(-cursor.y * max, -cursor.x * max, 0, "YXZ");
      scratch.quaternion.setFromEuler(scratch.euler);
      camera.quaternion.multiply(scratch.quaternion);
    }
  });
  return null;
}
