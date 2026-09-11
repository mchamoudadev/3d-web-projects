/// <reference lib="webworker" />
import { PMTiles } from "pmtiles";
import { PbfReader } from "pbf";
import { VectorTile, classifyRings } from "@mapbox/vector-tile";
import { Color } from "three";
import { toWorld, pointInRing } from "@/lib/geo";
import { MeshBuilder, hash, type BuiltTile, type Road } from "./geometry";
import { extrudeBuilding } from "./buildings";
import { buildRoad } from "./roads";
import { infrastructure, surfaceColors } from "./context";
let archive: PMTiles;
let oldTown: Promise<number[][][]>;
self.onmessage = async (
  e: MessageEvent<{ key: string; x: number; y: number; url: string }>,
) => {
  const { key, x, y, url } = e.data;
  try {
    archive ??= new PMTiles(url);
    oldTown ??= fetch(new URL("../data/old-town.geojson", url))
      .then((r) => r.json())
      .then((data: GeoJSON.FeatureCollection) =>
        data.features.flatMap((f) =>
          f.geometry.type === "Polygon"
            ? [f.geometry.coordinates[0].map(toWorld)]
            : f.geometry.type === "MultiPolygon"
              ? f.geometry.coordinates.map((p) => p[0].map(toWorld))
              : [],
        ),
      );
    const historic = await oldTown;
    const response = await archive.getZxy(15, x, y);
    if (!response) {
      self.postMessage({ key, empty: true });
      return;
    }
    const tile = new VectorTile(new PbfReader(new Uint8Array(response.data))),
      building = new MeshBuilder(),
      roads = new MeshBuilder(),
      land = new MeshBuilder(),
      water = new MeshBuilder();
    const result: BuiltTile = {
      key,
      buildings: building.finish(),
      roads: roads.finish(),
      land: land.finish(),
      water: water.finish(),
      footprints: [],
      walkways: [],
      beaches: [],
      trees: [],
      decorations: [],
      buildingCount: 0,
    };
    const xy = (p: { x: number; y: number }, extent: number) =>
      toWorld([
        ((x + p.x / extent) / 32768) * 360 - 180,
        (Math.atan(
          Math.sinh(Math.PI * (1 - (2 * (y + p.y / extent)) / 32768)),
        ) *
          180) /
          Math.PI,
      ]);
    const roadLayer = tile.layers.transportation;
    if (roadLayer)
      for (let i = 0; i < roadLayer.length; i++) {
        const f = roadLayer.feature(i);
        for (const line of f.loadGeometry())
          result.walkways.push(
            buildRoad(
              roads,
              line.map((p) => xy(p, f.extent)),
              f.properties,
            ),
          );
      }
    const majors: Road[] = result.walkways.filter((r) => r.major);
    const context = tile.layers.infrastructure;
    if (context)
      for (let i = 0; i < context.length; i++) {
        const feature = context.feature(i);
        for (const line of feature.loadGeometry())
          result.footprints.push(
            ...infrastructure(
              land,
              line.map((p) => xy(p, feature.extent)),
              feature.properties,
            ),
          );
      }
    const b = tile.layers.building;
    if (b)
      for (let i = 0; i < b.length; i++) {
        const f = b.feature(i);
        for (const polygon of classifyRings(f.loadGeometry())) {
          const rings = polygon.map((r) => r.map((p) => xy(p, f.extent)));
          const cx = rings[0]?.reduce((s, p) => s + p[0], 0) / rings[0]?.length;
          if (!Number.isFinite(cx)) continue;
          // Planetiler ID for OSM way 126234890. Its 22-level tag contradicts
          // the dated ruin photograph. The reference model replaces this mesh;
          // retain the mapped footprint for collision and the untouched raw OSM.
          if (f.id === 1262348902) {
            result.buildingCount++;
            result.footprints.push({ rings, height: 24 });
            continue;
          }
          const info = extrudeBuilding(
            building,
            rings,
            f.properties,
            Number(f.id) ||
              Math.round(rings[0][0][0] * 71 + rings[0][0][1] * 31),
            majors,
            historic.some((r) => pointInRing(rings[0][0], r)),
          );
          if (!info) continue;
          result.buildingCount++;
          result.footprints.push({ rings, height: info.height });
          if (
            f.properties.building === "mosque" ||
            (f.properties.amenity === "place_of_worship" &&
              f.properties.religion !== "christian")
          )
            result.decorations.push({
              x: info.x,
              z: info.z,
              y: info.height,
              kind: "mosque",
              seed: info.seed,
            });
          else if (f.properties.amenity === "hospital")
            result.decorations.push({
              x: info.x,
              z: info.z,
              y: info.height,
              kind: "hospital",
              seed: info.seed,
            });
          else if (
            !info.pitched &&
            info.seed > 0.94 &&
            Number(f.properties.area) > 65
          )
            result.decorations.push({
              x: info.x,
              z: info.z,
              y: info.height,
              kind: "tank",
              seed: info.seed,
            });
        }
      }
    const l = tile.layers.landuse;
    if (l)
      for (let i = 0; i < l.length; i++) {
        const f = l.feature(i),
          kind = String(f.properties.class),
          rings = f.loadGeometry().map((r) => r.map((p) => xy(p, f.extent)));
        if (!surfaceColors[kind]) continue;
        for (const polygon of classifyRings(f.loadGeometry()))
          land.polygon(
            polygon.map((r) => r.map((p) => xy(p, f.extent))),
            kind === "pier" ? 0.13 : 0.06,
            new Color(surfaceColors[kind]),
          );
        if (kind === "beach") result.beaches.push(...rings);
        if (
          ![
            "beach",
            "park",
            "garden",
            "forest",
            "grass",
            "recreation_ground",
          ].includes(kind)
        )
          continue;
        const box = rings[0];
        if (!box?.length) continue;
        const minX = Math.min(...box.map((p) => p[0])),
          maxX = Math.max(...box.map((p) => p[0])),
          minZ = Math.min(...box.map((p) => p[1])),
          maxZ = Math.max(...box.map((p) => p[1]));
        const n = Math.min(
          200,
          Math.ceil(
            ((maxX - minX) * (maxZ - minZ)) / (kind === "beach" ? 1500 : 400),
          ),
        );
        for (let j = 0; j < n; j++) {
          const p = [
            minX + hash(i * 213 + j * 17 + 1) * (maxX - minX),
            minZ + hash(i * 441 + j * 23 + 2) * (maxZ - minZ),
          ];
          if (pointInRing(p, box))
            result.trees.push([...p, kind === "beach" ? 1 : hash(j + 212)]);
        }
      }
    const w = tile.layers.water;
    if (w)
      for (let i = 0; i < w.length; i++) {
        const f = w.feature(i);
        water.polygon(
          f.loadGeometry().map((r) => r.map((p) => xy(p, f.extent))),
          0.09,
          new Color("#28454a"),
        );
      }
    const n = tile.layers.natural;
    if (n)
      for (let i = 0; i < n.length; i++) {
        const f = n.feature(i);
        for (const line of f.loadGeometry())
          for (const p of line)
            result.trees.push([...xy(p, f.extent), hash(i + 15)]);
      }
    for (const road of majors)
      for (let i = 1; i < road.points.length; i++) {
        const a = road.points[i - 1],
          b = road.points[i],
          dx = b[0] - a[0],
          dz = b[1] - a[1],
          length = Math.hypot(dx, dz);
        for (let d = 30; d < length; d += 65) {
          const p = [
            a[0] + (dx * d) / length - (dz / length) * (road.width / 2 + 3),
            a[1] + (dz * d) / length + (dx / length) * (road.width / 2 + 3),
          ];
          if (!result.footprints.some((f) => pointInRing(p, f.rings[0])))
            result.trees.push([...p, 0.95]);
        }
      }
    result.buildings = building.finish();
    result.roads = roads.finish();
    result.land = land.finish();
    result.water = water.finish();
    const buffers = [
      result.buildings,
      result.roads,
      result.land,
      result.water,
    ].flatMap((m) => Object.values(m).map((v) => v.buffer));
    self.postMessage(result, { transfer: buffers });
  } catch (error) {
    self.postMessage({ key, error: String(error) });
  }
};
