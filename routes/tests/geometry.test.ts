import test from "node:test";
import assert from "node:assert/strict";
import { Color, Scene, PerspectiveCamera, MeshStandardMaterial } from "three";
import { Lighting } from "../components/city/lighting";
import { facadeMaterial } from "../components/city/buildings";
import { roadMaterial } from "../components/city/roads";
import { MeshBuilder } from "../components/city/geometry";
import { buildingHeight } from "../components/Buildings";
import { toWorld, toLngLat } from "../lib/geo";
import { CameraTransition } from "../lib/transition";
import { JourneyPlan } from "../lib/camera";
import { readFileSync } from "node:fs";
import type { RouteResult } from "../lib/types";
test("world projection round trips across the whole Mogadishu clip", () => {
  for (let lng = 45.25; lng <= 45.42; lng += 0.01)
    for (let lat = 1.98; lat <= 2.12; lat += 0.01) {
      const p = toLngLat(...toWorld([lng, lat]));
      assert.ok(Math.abs(p[0] - lng) < 1e-9);
      assert.ok(Math.abs(p[1] - lat) < 1e-9);
    }
});
test("roof triangulation preserves courtyard holes", () => {
  const b = new MeshBuilder();
  b.polygon(
    [
      [
        [0, 0],
        [10, 0],
        [10, 10],
        [0, 10],
        [0, 0],
      ],
      [
        [3, 3],
        [3, 7],
        [7, 7],
        [7, 3],
        [3, 3],
      ],
    ],
    7,
    new Color("white"),
  );
  const p = b.finish().position;
  let area = 0;
  for (let i = 0; i < p.length; i += 9) {
    area +=
      Math.abs(
        (p[i + 3] - p[i]) * (p[i + 8] - p[i + 2]) -
          (p[i + 6] - p[i]) * (p[i + 5] - p[i + 2]),
      ) / 2;
  }
  assert.equal(area, 84);
});
test("explicit OSM heights win and arterial bonus applies only to estimates", () => {
  assert.equal(buildingHeight({ height: "18" }, 500, true), 18);
  assert.equal(buildingHeight({ levels: "3" }, 50), 10.5);
  assert.equal(buildingHeight({}, 50, true), 7);
});
test("replay bridge has exact endpoint poses and no jump in position", () => {
  const r = JSON.parse(
      readFileSync(
        new URL("./fixtures/liido-banadir.json", import.meta.url),
        "utf8",
      ),
    ) as RouteResult,
    plan = new JourneyPlan(r),
    from = plan.sample(plan.duration),
    to = plan.sample(0),
    bridge = new CameraTransition(from, to);
  assert.ok(bridge.sample(0).position.distanceTo(from.position) < 1e-8);
  assert.ok(
    bridge.sample(bridge.duration).position.distanceTo(to.position) < 1e-8,
  );
  assert.ok(bridge.sample(0.001).position.distanceTo(from.position) < 0.001);
  const lifted = bridge.sample(2).position;
  assert.ok(lifted.y >= 120);
  assert.ok(
    Math.hypot(lifted.x - from.position.x, lifted.z - from.position.z) < 0.01,
  );
  assert.ok(
    bridge.sample(bridge.duration - 0.001).position.distanceTo(to.position) <
      0.001,
  );
});

test("facades, roads and land retain separate shader programs after adding shadows", () => {
  const lighting = new Lighting(
    new Scene(),
    new PerspectiveCamera(60, 1, 0.1, 10000),
  );
  const materials = [
    facadeMaterial(lighting.night),
    roadMaterial(),
    new MeshStandardMaterial({ vertexColors: true, side: 2 }),
  ];
  materials.forEach((m) => lighting.setup(m));
  const keys = materials.map((m) => m.customProgramCacheKey());
  assert.equal(new Set(keys).size, 3);
  materials.forEach((m) => lighting.setup(m));
  assert.deepEqual(
    materials.map((m) => m.customProgramCacheKey()),
    keys,
  );
  lighting.dispose();
  materials.forEach((m) => m.dispose());
});
