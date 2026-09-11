import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { Color } from "three";
import { learningSteps, landmarkCue, turnAnswer } from "../lib/learning";
import { oceanPolygon } from "../lib/coast";
import { extrudeBuilding } from "../components/city/buildings";
import { MeshBuilder } from "../components/city/geometry";
import { inBounds } from "../lib/geo";
import type { RouteResult } from "../lib/types";
const result = JSON.parse(
  readFileSync(
    new URL("./fixtures/liido-banadir.json", import.meta.url),
    "utf8",
  ),
) as RouteResult;
test("learning junctions preserve actual maneuver order and special turn types", () => {
  const en = learningSteps(result, "en"),
    so = learningSteps(result, "so");
  assert.ok(en.length > 4);
  assert.deepEqual(
    en.map((s) => s.progress),
    so.map((s) => s.progress),
  );
  for (let i = 1; i < en.length; i++)
    assert.ok(en[i].progress >= en[i - 1].progress);
  assert.equal(turnAnswer("uturn"), "uturn");
  assert.equal(turnAnswer("right", "roundabout"), "roundabout");
  assert.ok(en.every((s) => s.type !== "depart" && s.type !== "arrive"));
});
test("landmark sides follow the incoming travel direction", () => {
  const place = { ...result.destination, lng: 45.341, lat: 2.04 };
  const direction = {
    text: "Turn",
    location: [45.34, 2.04] as [number, number],
    distance: 100,
    modifier: "left",
    progress: 0.5,
    place,
    bearing: 0,
  };
  assert.match(landmarkCue(direction, "en")!, /on your right/);
  assert.match(
    landmarkCue({ ...direction, bearing: 180 }, "en")!,
    /on your left/,
  );
  assert.match(landmarkCue(direction, "so")!, /dhinaca midig/);
});
test("mapped gabled roof has a ridge and preserves the recorded total height", () => {
  const mesh = new MeshBuilder(),
    rings = [
      [
        [0, 0],
        [16, 0],
        [16, 10],
        [0, 10],
        [0, 0],
      ],
    ];
  const info = extrudeBuilding(
    mesh,
    rings,
    {
      area: 160,
      height: 10,
      roof_shape: "gabled",
      roof_height: 3,
      colour: "white",
    },
    25,
    [],
    false,
  )!;
  assert.equal(info.height, 10);
  assert.ok(mesh.p.every(Number.isFinite));
  assert.ok(mesh.p.some((v, i) => i % 3 === 1 && v === 10));
  assert.ok(mesh.p.some((v, i) => i % 3 === 1 && v === 7));
  assert.ok(
    mesh.n.some(
      (v, i) => i % 3 === 1 && Math.abs(v) > 0.2 && Math.abs(v) < 0.99,
    ),
  );
  assert.ok(mesh.c.some((v) => Math.abs(v - new Color("white").r) < 0.01));
});
test("expanded coverage includes Kaxda and the coast keeps islands as holes", () => {
  assert.ok(inBounds([45.246698, 2.054]));
  assert.equal(inBounds([46, 2]), false);
  const feature = oceanPolygon({
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        properties: {},
        geometry: {
          type: "LineString",
          coordinates: [
            [45.2, 1.95],
            [45.3, 2.0],
          ],
        },
      },
      {
        type: "Feature",
        properties: {},
        geometry: {
          type: "LineString",
          coordinates: [
            [45.3, 2.0],
            [45.6, 2.2],
          ],
        },
      },
      {
        type: "Feature",
        properties: {},
        geometry: {
          type: "LineString",
          coordinates: [
            [45.3, 1.9],
            [45.31, 1.9],
            [45.31, 1.91],
            [45.3, 1.9],
          ],
        },
      },
    ],
  });
  assert.equal(feature.geometry.coordinates.length, 2);
  assert.deepEqual(
    feature.geometry.coordinates[1][0],
    feature.geometry.coordinates[1].at(-1),
  );
});
