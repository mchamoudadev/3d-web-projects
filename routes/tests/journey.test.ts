import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { JourneyPlan } from "../lib/camera";
import { routeDirections } from "../lib/directions";
import type { RouteResult } from "../lib/types";
const data = JSON.parse(
  readFileSync(
    new URL("./fixtures/liido-banadir.json", import.meta.url),
    "utf8",
  ),
) as RouteResult;
const plan = new JourneyPlan(data);
test("real Liido to Banadir flight starts and ends at eye height, banks subtly and keeps a cruise horizon", () => {
  assert.ok(plan.duration >= 25 && plan.duration <= 60);
  assert.ok(Math.abs(plan.sample(0).position.y - 1.6) < 0.01);
  assert.ok(Math.abs(plan.sample(plan.duration).position.y - 1.6) < 0.01);
  for (let t = 0; t <= plan.duration; t += 0.025) {
    const p = plan.sample(t);
    assert.ok(p.position.toArray().every(Number.isFinite));
    assert.ok(p.position.y >= 1.59);
    assert.ok(Math.abs(p.roll) <= 8.01);
    if (t > 3.1 && t < plan.duration - 4.1) {
      const gaze = p.lookAt.clone().sub(p.position);
      const pitch =
        (Math.atan2(Math.hypot(gaze.x, gaze.z), -gaze.y) * 180) / Math.PI;
      assert.ok(pitch >= 55 && pitch <= 70, `${t}: pitch ${pitch}`);
    }
  }
});
test("camera scrubs deterministically backwards and velocity stays continuous through maneuvers and beats", () => {
  for (let t = 0.1; t < plan.duration - 0.1; t += 0.05) {
    const a = plan.sample(t - 0.001),
      b = plan.sample(t),
      c = plan.sample(t + 0.001);
    const v1 = b.position.clone().sub(a.position).multiplyScalar(1000),
      v2 = c.position.clone().sub(b.position).multiplyScalar(1000);
    assert.ok(v1.distanceTo(v2) < 25, `velocity jump at ${t}`);
    assert.deepEqual(plan.sample(t).position.toArray(), b.position.toArray());
    assert.ok(c.progress >= a.progress);
  }
  const points = [1, 3, 12, plan.duration - 4, plan.duration].map((t) =>
    plan.sample(t).position.toArray(),
  );
  assert.deepEqual(
    [plan.duration, plan.duration - 4, 12, 3, 1]
      .map((t) => plan.sample(t).position.toArray())
      .reverse(),
    points,
  );
});
test("passing captions are spaced and directions localize without raw routing instructions", () => {
  for (let i = 1; i < plan.passing.length; i++)
    assert.ok(plan.passing[i].time - plan.passing[i - 1].time >= 10);
  assert.ok(plan.passing.length > 0);
  const so = routeDirections(data.route, data.places, "so");
  assert.ok(so.some((d) => d.text.includes("u leexo")));
  assert.ok(so.some((d) => d.place));
  assert.equal(so.length, data.directions.length);
});
