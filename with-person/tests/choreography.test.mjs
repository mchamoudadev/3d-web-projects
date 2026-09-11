import test from "node:test";
import assert from "node:assert/strict";
import { Vector3, Quaternion, CatmullRomCurve3 } from "three";
import { sampleAction } from "../config/choreography.ts";
import { cameraKeyframes, splineTime } from "../config/timeline.ts";
const distance = (a, b) => Math.hypot(...a.map((v, i) => v - b[i]));
test("all eight hand and prop paths stay continuous through the entire story", () => {
  let previous = sampleAction(0);
  for (let i = 1; i <= 100000; i++) {
    const state = sampleAction(i / 100000);
    for (const key of [
      "cup",
      "filter",
      "tamper",
      "pitcher",
      "left",
      "right",
      "customerL",
      "customerR",
    ]) {
      assert.ok(state[key].every(Number.isFinite));
      assert.ok(
        distance(state[key], previous[key]) < 0.01,
        `${key} jumps at ${i / 100000}`,
      );
    }
    assert.ok(state.pressure >= 0 && state.pressure <= 9);
    assert.ok(state.fill >= 0 && state.fill <= 1);
    previous = state;
  }
});
test("customer grip follows the handle through lift, tilt and lowering", () => {
  for (let i = 845; i <= 1000; i++) {
    const a = sampleAction(i / 1000),
      offset = new Vector3(0.33, 0.2, 0).applyAxisAngle(
        new Vector3(0, 0, 1),
        a.cupTilt,
      );
    assert.ok(
      distance(
        a.customerR,
        a.cup.map((v, j) => v + offset.getComponent(j)),
      ) < 1e-9,
    );
  }
});
test("liquid counter-rotation preserves a level surface at every sip angle", () => {
  for (let i = 890; i <= 980; i++) {
    const tilt = sampleAction(i / 1000).cupTilt;
    const cup = new Quaternion().setFromAxisAngle(new Vector3(0, 0, 1), tilt);
    const surface = new Quaternion()
      .setFromAxisAngle(new Vector3(0, 0, 1), -tilt)
      .multiply(
        new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), -Math.PI / 2),
      );
    const normal = new Vector3(0, 0, 1)
      .applyQuaternion(surface)
      .applyQuaternion(cup);
    assert.ok(normal.distanceTo(new Vector3(0, 1, 0)) < 1e-9);
  }
});
test("continuous camera never dives through the machine shell", () => {
  const path = new CatmullRomCurve3(
    cameraKeyframes.map((k) => new Vector3(...k.position)),
    false,
    "centripetal",
  );
  for (let i = 0; i <= 10000; i++) {
    const point = path.getPoint(splineTime(i / 10000));
    assert.ok(point.toArray().every(Number.isFinite));
    assert.ok(point.z > 6);
  }
  for (const key of cameraKeyframes.slice(1, -1))
    assert.ok(
      path
        .getPoint(splineTime(key.at - 1e-6))
        .distanceTo(path.getPoint(splineTime(key.at + 1e-6))) < 0.001,
    );
});
