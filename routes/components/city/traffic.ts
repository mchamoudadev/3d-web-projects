import * as T from "three";
import { toWorld } from "@/lib/geo";
import { hash } from "./geometry";
type Path = { points: T.Vector3[]; lengths: number[]; length: number };
const transform = new T.Object3D();
export class Traffic {
  root = new T.Group();
  density = 1;
  private paths: Path[] = [];
  private body: T.InstancedMesh;
  private cabin: T.InstancedMesh;
  private wheels: T.InstancedMesh;
  private lights: T.InstancedMesh;
  private people: T.InstancedMesh;
  private shadows: T.InstancedMesh;
  private started = performance.now();
  private max = 180;
  constructor() {
    this.body = new T.InstancedMesh(
      new T.BoxGeometry(1.6, 0.65, 3.3),
      new T.MeshStandardMaterial({ roughness: 0.6 }),
      this.max,
    );
    this.cabin = new T.InstancedMesh(
      new T.BoxGeometry(1.35, 0.65, 1.7),
      new T.MeshStandardMaterial({
        color: "#253c42",
        metalness: 0.15,
        roughness: 0.4,
      }),
      this.max,
    );
    this.wheels = new T.InstancedMesh(
      new T.CylinderGeometry(0.35, 0.35, 1.65, 6).rotateZ(Math.PI / 2),
      new T.MeshStandardMaterial({ color: "#202423" }),
      this.max * 2,
    );
    this.lights = new T.InstancedMesh(
      new T.BoxGeometry(1.2, 0.14, 0.1),
      new T.MeshBasicMaterial({ color: "#ffdfa0" }),
      this.max,
    );
    this.people = new T.InstancedMesh(
      new T.CapsuleGeometry(0.22, 1, 0.5, 4),
      new T.MeshStandardMaterial({ color: "#afa68a" }),
      60,
    );
    this.shadows = new T.InstancedMesh(
      new T.PlaneGeometry(3, 5).rotateX(-Math.PI / 2),
      new T.MeshBasicMaterial({
        color: "#161c19",
        opacity: 0.2,
        transparent: true,
        depthWrite: false,
      }),
      this.max,
    );
    for (const m of [
      this.body,
      this.cabin,
      this.wheels,
      this.lights,
      this.people,
      this.shadows,
    ]) {
      m.count = 0;
      m.frustumCulled = false;
      this.root.add(m);
    }
    this.body.castShadow = true;
    this.cabin.castShadow = true;
    this.body.receiveShadow = true;
    fetch("/data/traffic.json")
      .then((r) => {
        if (!r.ok) throw new Error("Run npm run data:traffic");
        return r.json();
      })
      .then((routes: { coordinates: number[][] }[]) => {
        this.paths = routes.map((route) => {
          const points = route.coordinates.map((p) => {
              const [x, z] = toWorld(p);
              return new T.Vector3(x, 0, z);
            }),
            lengths = [0];
          for (let i = 1; i < points.length; i++)
            lengths.push(lengths[i - 1] + points[i].distanceTo(points[i - 1]));
          return { points, lengths, length: lengths.at(-1)! };
        });
      })
      .catch((e) => console.warn("Traffic:", e.message));
  }
  private at(path: Path, d: number) {
    d = ((d % path.length) + path.length) % path.length;
    let i = 1;
    while (i < path.lengths.length - 1 && path.lengths[i] < d) i++;
    const a = path.points[i - 1],
      b = path.points[i],
      t =
        (d - path.lengths[i - 1]) /
        (path.lengths[i] - path.lengths[i - 1] || 1);
    return {
      position: a.clone().lerp(b, t),
      direction: b.clone().sub(a).normalize(),
    };
  }
  update(now: number, camera: T.Vector3, night: number) {
    if (!this.paths.length) return;
    let count = 0,
      people = 0;
    const seconds = (now - this.started) / 1000;
    for (let i = 0; i < Math.floor(this.max * this.density); i++) {
      const path = this.paths[i % this.paths.length],
        speed = 5 + hash(i + 32) * 6,
        hit = this.at(path, hash(i + 121) * path.length + seconds * speed);
      if (hit.position.distanceTo(camera) > 2500) continue;
      const bajaj = i % 3 === 0,
        angle = Math.atan2(hit.direction.x, hit.direction.z),
        offset = new T.Vector3(
          hit.direction.z,
          0,
          -hit.direction.x,
        ).multiplyScalar(1.6);
      hit.position.add(offset);
      transform.position.copy(hit.position);
      transform.position.y = 0.65;
      transform.rotation.set(0, angle, 0);
      transform.scale.set(bajaj ? 0.75 : 1, 1, bajaj ? 0.68 : 1);
      transform.updateMatrix();
      this.body.setMatrixAt(count, transform.matrix);
      this.body.setColorAt(
        count,
        new T.Color(
          bajaj
            ? "#d6b95d"
            : ["#c7c7b8", "#888d85", "#769da3", "#b38674"][i % 4],
        ),
      );
      transform.position.y = 1.22;
      transform.updateMatrix();
      this.cabin.setMatrixAt(count, transform.matrix);
      for (let j = 0; j < 2; j++) {
        transform.position
          .copy(hit.position)
          .addScaledVector(hit.direction, (j ? 1 : -1) * (bajaj ? 0.75 : 1.1));
        transform.position.y = 0.35;
        transform.updateMatrix();
        this.wheels.setMatrixAt(count * 2 + j, transform.matrix);
      }
      transform.position
        .copy(hit.position)
        .addScaledVector(hit.direction, bajaj ? 1.12 : 1.66);
      transform.position.y = 0.7;
      transform.updateMatrix();
      this.lights.setMatrixAt(count, transform.matrix);
      transform.position.copy(hit.position);
      transform.position.y = 0.16;
      transform.updateMatrix();
      this.shadows.setMatrixAt(count, transform.matrix);
      count++;
      if (i % 3 === 0 && people < 60) {
        const walk = this.at(
          path,
          hash(i + 832) * path.length + seconds * 0.95,
        );
        transform.position
          .copy(walk.position)
          .add(
            new T.Vector3(
              walk.direction.z,
              0,
              -walk.direction.x,
            ).multiplyScalar(8),
          );
        transform.position.y = 0.95 + Math.sin(seconds * 7 + i) * 0.035;
        transform.scale.setScalar(1);
        transform.rotation.y = angle;
        transform.updateMatrix();
        this.people.setMatrixAt(people++, transform.matrix);
      }
    }
    this.body.count = this.cabin.count = this.shadows.count = count;
    this.wheels.count = count * 2;
    this.lights.count = night > 0.35 ? count : 0;
    this.people.count = people;
    for (const m of [
      this.body,
      this.cabin,
      this.wheels,
      this.lights,
      this.people,
      this.shadows,
    ])
      m.instanceMatrix.needsUpdate = true;
    if (this.body.instanceColor) this.body.instanceColor.needsUpdate = true;
  }
  dispose() {
    this.root.removeFromParent();
    this.root.traverse((o) => {
      if (o instanceof T.Mesh) {
        o.geometry.dispose();
        (o.material as T.Material).dispose();
      }
    });
  }
}
