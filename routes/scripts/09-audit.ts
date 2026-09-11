import { createReadStream } from "node:fs";
import { readFile, writeFile, stat } from "node:fs/promises";
import { createInterface } from "node:readline";
import coverage from "../config/coverage.json";
const counts: Record<string, number> = {},
  names = new Set<string>(),
  roadIds = new Set<string>();
for await (const line of createInterface({
  input: createReadStream("data/raw/mogadishu.geojsonseq"),
  crlfDelay: Infinity,
})) {
  const feature = JSON.parse(line.replace(/^\x1e/, "")),
    tags = feature.properties ?? {},
    polygon = ["Polygon", "MultiPolygon"].includes(feature.geometry.type);
  if (tags.highway) {
    roadIds.add(tags["@id"] ?? feature.id);
    if (tags.name) names.add(tags.name);
  }
  if (tags.building && polygon) {
    counts.buildings = (counts.buildings ?? 0) + 1;
    for (const [key, condition] of Object.entries({
      heightOrLevels:
        parseFloat(tags.height) > 0 || parseFloat(tags["building:levels"]) > 0,
      roofShape: !!tags["roof:shape"],
      facadeColour: !!tags["building:colour"],
      roofColour: !!tags["roof:colour"],
    }))
      if (condition) counts[key] = (counts[key] ?? 0) + 1;
  }
  if (tags.aeroway === "runway" && feature.geometry.type === "LineString")
    counts.runways = (counts.runways ?? 0) + 1;
  if (tags.barrier === "wall" && feature.geometry.type === "LineString")
    counts.walls = (counts.walls ?? 0) + 1;
}
const places = JSON.parse(await readFile("data/osm-places.json", "utf8"));
const pbf = await stat("data/osrm/mogadishu.osm.pbf"),
  tiles = await stat("public/tiles/mogadishu.pmtiles");
const report = {
  generated: new Date().toISOString(),
  source: "Geofabrik Somalia / OpenStreetMap",
  coverage,
  counts: {
    ...counts,
    roadFeatures: roadIds.size,
    distinctRoadNames: names.size,
    osmSearchPlaces: places.length,
  },
  artifacts: {
    pbf: { path: "data/osrm/mogadishu.osm.pbf", bytes: pbf.size },
    fullGeometry: {
      path: "data/raw/mogadishu.geojsonseq",
      description:
        "Exported OSM geometries and their original tags. The PBF also preserves OSM relations and non-geometric objects.",
    },
    tiles: { path: "public/tiles/mogadishu.pmtiles", bytes: tiles.size },
  },
  limitations:
    "OSM coverage is incomplete. Unmapped heights, facades and entrances are estimates. This is not photographic 3D.",
};
await writeFile(
  "data/coverage-report.json",
  JSON.stringify(report, null, 2) + "\n",
);
console.log(JSON.stringify(report, null, 2));
