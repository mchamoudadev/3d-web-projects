import { useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { CatmullRomCurve3, Vector3, MathUtils } from "three";
import { cameraKeyframes, splineTime, insideMachine } from "@/config/timeline";
import { useProgress } from "@/store/progress";
export default function CameraRig() {
  const paths = useMemo(
    () => ({
      position: new CatmullRomCurve3(
        cameraKeyframes.map((k) => new Vector3(...k.position)),
        false,
        "centripetal",
      ),
      target: new CatmullRomCurve3(
        cameraKeyframes.map((k) => new Vector3(...k.target)),
        false,
        "centripetal",
      ),
      aim: new Vector3(),
    }),
    [],
  );
  useFrame(({ camera, clock, size }) => {
    const { progress, pointer, reducedMotion } = useProgress.getState();
    const t = splineTime(progress);
    paths.position.getPoint(t, camera.position);
    paths.target.getPoint(t, paths.aim);
    const outside = 1 - insideMachine();
    if (size.width < 700) {
      camera.position.z += 6.5 * outside;
      camera.position.x += 0.9 * outside;
      paths.aim.setX(paths.aim.x - 0.2 * outside);
      paths.aim.setY(paths.aim.y + 1.4 * outside);
    }
    camera.lookAt(paths.aim);
    if (!reducedMotion) {
      const breathing =
        Math.sin(clock.elapsedTime * 0.65) * MathUtils.degToRad(0.17);
      camera.rotateY(
        (pointer.x * MathUtils.degToRad(1.4) + breathing) * outside,
      );
      camera.rotateX(
        (pointer.y * MathUtils.degToRad(0.7) + breathing * 0.5) * outside,
      );
    }
  });
  return null;
}
