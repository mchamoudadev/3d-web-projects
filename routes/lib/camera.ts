import { CatmullRomCurve3, Vector3 } from "three";
import type { Place, RouteResult } from "./types";
import { clamp, mix, smooth, toWorld } from "./geo";
import { closestOnRoute } from "./directions";
export type Beat = "takeoff" | "cruise" | "landing" | "arrived";
export interface PassingPlace {
  place: Place;
  time: number;
  progress: number;
}
export interface CameraPose {
  position: Vector3;
  lookAt: Vector3;
  roll: number;
  progress: number;
  beat: Beat;
  passing: PassingPlace | null;
}
function inverseSmooth(value: number) {
  let a = 0,
    b = 1;
  for (let i = 0; i < 24; i++) {
    const mid = (a + b) / 2;
    if (smooth(mid) < value) a = mid;
    else b = mid;
  }
  return (a + b) / 2;
}
export class JourneyPlan {
  readonly duration: number;
  readonly altitude: number;
  readonly path: CatmullRomCurve3;
  readonly passing: PassingPlace[];
  private positions: CatmullRomCurve3;
  private targets: CatmullRomCurve3;
  private costs: number[];
  private rolls: number[] = [];
  private progresses: number[] = [];
  constructor(
    public result: RouteResult,
    public drive = false,
  ) {
    this.duration = drive
      ? Math.max(20, result.route.duration)
      : clamp(25 + result.route.distance / 350, 25, 60);
    this.altitude = clamp(result.route.distance / 22, 120, 500);
    const points = (result.cameraRoute ?? result.route.geometry.coordinates)
      .map((p) => {
        const [x, z] = toWorld(p);
        return new Vector3(x, 0, z);
      })
      .filter((p, i, a) => !i || p.distanceToSquared(a[i - 1]) > 0.01);
    if (points.length < 2)
      throw new Error("The route is too short for a journey.");
    this.path = new CatmullRomCurve3(
      points,
      false,
      drive ? "catmullrom" : "centripetal",
      drive ? 0.08 : 0.5,
    );
    this.path.arcLengthDivisions = 2500;
    this.path.updateArcLengths();
    const weights: number[] = [];
    for (let i = 0; i <= 600; i++) {
      const t = i / 600,
        a = this.path.getTangentAt(clamp(t - 0.008, 0, 1)),
        b = this.path.getTangentAt(clamp(t + 0.008, 0, 1));
      weights.push(1 + 3 * (1 - clamp(a.dot(b), -1, 1)));
    }
    this.costs = [0];
    for (let i = 1; i <= 600; i++) {
      let sum = 0,
        n = 0;
      const radius = Math.ceil((600 * 1.5) / this.duration);
      for (
        let j = Math.max(0, i - radius);
        j <= Math.min(600, i + radius);
        j++
      ) {
        const w = Math.exp(-Math.pow((j - i) / radius, 2) * 2);
        sum += weights[j] * w;
        n += w;
      }
      this.costs[i] = this.costs[i - 1] + sum / n;
    }
    const total = this.costs.at(-1)!;
    this.costs = this.costs.map((c) => c / total);
    const candidates = result.places
      .filter(
        (p) =>
          p.category !== "district" &&
          p.id !== result.origin?.id &&
          p.id !== result.destination.id,
      )
      .map((place) => ({
        place,
        ...closestOnRoute(
          [place.lng, place.lat],
          result.route.geometry.coordinates,
        ),
      }))
      .filter((p) => p.distance < 200 && p.progress > 0.08 && p.progress < 0.9)
      .map((p) => ({
        ...p,
        time:
          inverseSmooth(this.costs[Math.round(p.progress * 600)]) *
          this.duration,
      }))
      .filter((p) => p.time > 5 && p.time < this.duration - 5)
      .sort(
        (a, b) =>
          this.priority(b.place) - this.priority(a.place) ||
          a.distance - b.distance,
      );
    const chosen: PassingPlace[] = [];
    for (const p of candidates) {
      if (chosen.every((c) => Math.abs(c.time - p.time) >= 10))
        chosen.push({ place: p.place, time: p.time, progress: p.progress });
    }
    this.passing = chosen.sort((a, b) => a.time - b.time);
    const positions: Vector3[] = [],
      targets: Vector3[] = [],
      angles: number[] = [],
      pitches: number[] = [];
    // Dense time-domain splines keep position and gaze differentiable across all four beats.
    const count = Math.ceil(this.duration * 8);
    let previousAngle = 0;
    for (let i = 0; i <= count; i++) {
      const time = (i / count) * this.duration,
        p = this.routeProgress(time),
        base = this.path.getPointAt(p),
        tangent = this.path.getTangentAt(p);
      const rise = smooth(time / 3),
        land = smooth((time - (this.duration - 4)) / 4),
        u = clamp((time - (this.duration - 4)) / 4, 0, 1);
      let altitude = this.altitude;
      for (const poi of this.passing)
        altitude -=
          Math.min(35, this.altitude * 0.2) *
          Math.exp(-Math.pow((time - poi.time) / 2.5, 2));
      const y = 1.6 + (altitude - 1.6) * rise * (1 - land),
        spiral = Math.sin(Math.PI * u) ** 3 * 65;
      base.x += Math.cos(u * Math.PI * 2) * spiral;
      base.z += Math.sin(u * Math.PI * 2) * spiral;
      base.y = y;
      let angle = Math.atan2(tangent.x, -tangent.z);
      if (i) {
        while (angle - previousAngle > Math.PI) angle -= Math.PI * 2;
        while (angle - previousAngle < -Math.PI) angle += Math.PI * 2;
      }
      previousAngle = angle;
      for (const poi of this.passing) {
        const [px, pz] = toWorld([poi.place.lng, poi.place.lat]);
        let look = Math.atan2(px - base.x, -(pz - base.z));
        while (look - angle > Math.PI) look -= Math.PI * 2;
        while (look - angle < -Math.PI) look += Math.PI * 2;
        angle +=
          clamp(look - angle, -0.3, 0.3) *
          Math.exp(-Math.pow((time - poi.time) / 1.8, 2));
      }
      const [dx, dz] = toWorld([
        result.destination.lng,
        result.destination.lat,
      ]);
      let landingAngle = Math.atan2(dx - base.x, -(dz - base.z));
      while (landingAngle - angle > Math.PI) landingAngle -= Math.PI * 2;
      while (landingAngle - angle < -Math.PI) landingAngle += Math.PI * 2;
      angle = mix(angle, landingAngle, land);
      const pitch = mix(85, 64, rise * (1 - land)),
        ahead = Math.max(6, y * Math.tan((pitch * Math.PI) / 180));
      const target = base
        .clone()
        .add(
          new Vector3(Math.sin(angle) * ahead, -y, -Math.cos(angle) * ahead),
        );
      positions.push(base);
      targets.push(target);
      angles.push(angle);
      pitches.push(pitch);
      const before = this.path.getTangentAt(clamp(p - 0.006, 0, 1)),
        after = this.path.getTangentAt(clamp(p + 0.006, 0, 1));
      this.rolls.push(
        clamp((before.x * after.z - before.z * after.x) * -12, -8, 8) *
          rise *
          (1 - land),
      );
      this.progresses.push(p);
    }
    for (let i = 0; i <= count; i++) {
      let angle = 0,
        weight = 0;
      for (let j = Math.max(0, i - 12); j <= Math.min(count, i + 12); j++) {
        const w = Math.exp(-Math.pow((j - i) / 6, 2));
        angle += angles[j] * w;
        weight += w;
      }
      angle /= weight;
      const base = positions[i],
        ahead = Math.max(6, base.y * Math.tan((pitches[i] * Math.PI) / 180));
      targets[i] = base
        .clone()
        .add(
          new Vector3(
            Math.sin(angle) * ahead,
            -base.y,
            -Math.cos(angle) * ahead,
          ),
        );
    }
    this.positions = new CatmullRomCurve3(positions, false, "catmullrom", 0.5);
    this.targets = new CatmullRomCurve3(targets, false, "catmullrom", 0.5);
  }
  private priority(p: Place) {
    return (
      (p.source === "manual" ? 5 : 0) +
      (p.category === "hospital"
        ? 3
        : p.category === "mosque" || p.category === "landmark"
          ? 2
          : 0)
    );
  }
  routeProgress(time: number) {
    const target = smooth(clamp(time / this.duration, 0, 1));
    let low = 0,
      high = 600;
    while (low < high) {
      const mid = (low + high) >> 1;
      if (this.costs[mid] < target) low = mid + 1;
      else high = mid;
    }
    const i = Math.max(1, low),
      a = this.costs[i - 1],
      b = this.costs[i];
    return clamp((i - 1 + (b > a ? (target - a) / (b - a) : 0)) / 600, 0, 1);
  }
  sample(time: number, drive = this.drive): CameraPose {
    const t = clamp(time / this.duration, 0, 1),
      index = t * (this.rolls.length - 1),
      i = Math.floor(index),
      fraction = index - i;
    const progress = mix(
      this.progresses[i],
      this.progresses[Math.min(i + 1, this.progresses.length - 1)],
      fraction,
    );
    let position = this.positions.getPoint(t),
      lookAt = this.targets.getPoint(t);
    if (!drive) {
      const gaze = lookAt.clone().sub(position),
        rise = smooth(time / 3),
        land = smooth((time - (this.duration - 4)) / 4),
        pitch = mix(85, 64, rise * (1 - land));
      gaze.y = 0;
      gaze
        .normalize()
        .multiplyScalar(
          Math.max(6, position.y * Math.tan((pitch * Math.PI) / 180)),
        );
      lookAt = position.clone().add(gaze);
      lookAt.y = 0;
    }
    if (drive) {
      position = this.path.getPointAt(progress);
      position.y = 1.6;
      const tangent = this.path.getTangentAt(clamp(progress + 0.001, 0, 1));
      lookAt = position.clone().add(tangent.multiplyScalar(20));
      lookAt.y = 0;
    }
    return {
      position,
      lookAt,
      roll: drive
        ? 0
        : mix(
            this.rolls[i],
            this.rolls[Math.min(i + 1, this.rolls.length - 1)],
            fraction,
          ),
      progress,
      beat:
        t === 1
          ? "arrived"
          : time < 3
            ? "takeoff"
            : time > this.duration - 4
              ? "landing"
              : "cruise",
      passing: this.passing.find((p) => Math.abs(p.time - time) < 2.6) ?? null,
    };
  }
}
