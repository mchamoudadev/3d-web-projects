import { Vector3 } from "three";
import { smooth, mix, clamp } from "./geo";
import type { CameraPose } from "./camera";
export class CameraTransition {
  duration: number;
  constructor(
    private from: CameraPose,
    private to: CameraPose,
  ) {
    this.duration = clamp(
      7 + from.position.distanceTo(to.position) / 900,
      8,
      20,
    );
  }
  sample(time: number): CameraPose {
    const t = smooth(time / this.duration);
    const horizontalDistance = Math.hypot(
      this.to.position.x - this.from.position.x,
      this.to.position.z - this.from.position.z,
    );
    const lift = smooth(time / 2),
      land = smooth((time - (this.duration - 2)) / 2);
    const across =
      horizontalDistance > 30 ? smooth((time - 2) / (this.duration - 4)) : t;
    const position = this.from.position.clone().lerp(this.to.position, across);
    if (horizontalDistance > 30) {
      const height = Math.min(
        500,
        Math.max(120, this.from.position.y, this.to.position.y) +
          horizontalDistance * 0.04,
      );
      position.y = mix(
        mix(this.from.position.y, height, lift),
        this.to.position.y,
        land,
      );
    }
    const fromGaze = this.from.lookAt
        .clone()
        .sub(this.from.position)
        .normalize(),
      toGaze = this.to.lookAt.clone().sub(this.to.position).normalize();
    const a = Math.atan2(fromGaze.x, -fromGaze.z);
    let b = Math.atan2(toGaze.x, -toGaze.z);
    while (b - a > Math.PI) b -= Math.PI * 2;
    while (b - a < -Math.PI) b += Math.PI * 2;
    const angle = mix(a, b, t),
      baseElevation = mix(
        Math.asin(clamp(fromGaze.y, -1, 1)),
        Math.asin(clamp(toGaze.y, -1, 1)),
        t,
      );
    const elevation =
      horizontalDistance > 30
        ? mix(baseElevation, (-26 * Math.PI) / 180, lift * (1 - land))
        : baseElevation;
    const gaze = new Vector3(
      Math.sin(angle) * Math.cos(elevation),
      Math.sin(elevation),
      -Math.cos(angle) * Math.cos(elevation),
    ).multiplyScalar(100);
    return {
      ...this.to,
      position,
      lookAt: position.clone().add(gaze),
      roll: mix(this.from.roll, this.to.roll, t),
      beat: "takeoff",
      progress: 0,
      passing: null,
    };
  }
}
