import { spawnSync } from "node:child_process";
import { createReadStream } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { createInterface } from "node:readline";
import type { Feature, Geometry, Position } from "geojson";
import { inBounds } from "../lib/geo";

await mkdir("data/raw", { recursive: true });
const result = spawnSync(
  "osmium",
  [
    "export",
    "data/osrm/mogadishu.osm.pbf",
    "-f",
    "geojsonseq",
    "-u",
    "type_id",
    "-o",
    "data/raw/mogadishu.geojsonseq",
    "--overwrite",
  ],
  { stdio: "inherit" },
);
if (result.status !== 0) throw new Error("osmium export failed");

function positions(g: Geometry): Position[] {
  if (g.type === "Point") return [g.coordinates];
  if (g.type === "MultiPoint" || g.type === "LineString") return g.coordinates;
  if (g.type === "Polygon" || g.type === "MultiLineString")
    return g.coordinates[0];
  if (g.type === "MultiPolygon") return g.coordinates[0][0];
  return [];
}
function centroid(g: Geometry): Position {
  const ring = positions(g);
  if (g.type === "Polygon" || g.type === "MultiPolygon") {
    let a = 0,
      x = 0,
      y = 0;
    for (let i = 0; i < ring.length - 1; i++) {
      const p = ring[i],
        q = ring[i + 1],
        cross = p[0] * q[1] - q[0] * p[1];
      a += cross;
      x += (p[0] + q[0]) * cross;
      y += (p[1] + q[1]) * cross;
    }
    if (Math.abs(a) > 1e-12) return [x / (3 * a), y / (3 * a)];
  }
  return [
    ring.reduce((s, p) => s + p[0], 0) / ring.length,
    ring.reduce((s, p) => s + p[1], 0) / ring.length,
  ];
}
const placeMap = new Map<string, Record<string, unknown>>(),
  coast: Feature[] = [];
const counts: Record<string, number> = {};
for await (const line of createInterface({
  input: createReadStream("data/raw/mogadishu.geojsonseq"),
  crlfDelay: Infinity,
})) {
  const text = line.replace(/^\x1e/, "").trim();
  if (!text) continue;
  const f: Feature = JSON.parse(text),
    t = f.properties ?? {};
  for (const key of ["highway", "amenity", "place", "natural"])
    if (t[key]) counts[key] = (counts[key] ?? 0) + 1;
  if (
    t.building &&
    ["Polygon", "MultiPolygon"].includes(f.geometry?.type ?? "")
  )
    counts.building = (counts.building ?? 0) + 1;
  if (t.natural === "coastline") coast.push(f);
  if (!f.geometry || !t.name) continue;
  if (
    !t.amenity &&
    !t.healthcare &&
    !t.place &&
    !t.tourism &&
    !t.aeroway &&
    !t.leisure &&
    !t.historic &&
    !t.shop &&
    !t.office &&
    !t.building &&
    !t.junction
  )
    continue;
  const [lng, lat] = centroid(f.geometry);
  if (!Number.isFinite(lng) || !Number.isFinite(lat) || !inBounds([lng, lat]))
    continue;
  const a = t.amenity || t.healthcare;
  const category =
    a === "hospital"
      ? "hospital"
      : ["clinic", "doctors", "health_post"].includes(a)
        ? "clinic"
        : a === "school"
          ? "school"
          : ["restaurant", "cafe"].includes(a)
            ? "restaurant"
            : a === "fuel"
              ? "fuel"
              : t.shop
                ? "shop"
                : a === "marketplace"
                  ? "market"
                  : a === "place_of_worship" && t.religion !== "christian"
                    ? "mosque"
                    : a === "university"
                      ? "university"
                      : t.place
                        ? "district"
                        : t.aeroway === "aerodrome"
                          ? "airport"
                          : t.tourism === "hotel"
                            ? "hotel"
                            : "landmark";
  // osmium area IDs encode a way as 2*id, and a relation as 2*id+1.
  // Canonicalizing them replaces a way's line centroid with its polygon centroid.
  let osmId = String(t["@id"] ?? f.id);
  if (osmId.startsWith("a")) {
    const n = BigInt(osmId.slice(1));
    osmId = (n % 2n === 0n ? "w" : "r") + String(n / 2n);
  }
  placeMap.set(osmId, {
    id: "osm-" + osmId,
    osm_id: osmId,
    name: t.name,
    aliases: [
      ...new Set(
        [
          t["name:so"],
          t["name:en"],
          t["name:ar"],
          t.alt_name,
          t.short_name,
        ].filter(Boolean),
      ),
    ],
    category,
    district: t["addr:district"] ?? t["addr:suburb"] ?? "",
    lat,
    lng,
    description: "",
    source: "osm",
    tags: t,
  });
}
const places = [...placeMap.values()];
await writeFile("data/osm-places.json", JSON.stringify(places, null, 2) + "\n");
await mkdir("public/data", { recursive: true });
await writeFile(
  "public/data/coast.geojson",
  JSON.stringify({ type: "FeatureCollection", features: coast }),
);
await mkdir("data/reports", { recursive: true });
await writeFile(
  "data/reports/export.json",
  JSON.stringify(
    {
      generated: new Date().toISOString(),
      counts,
      places: places.length,
      coast: coast.length,
    },
    null,
    2,
  ),
);
console.log({ counts, places: places.length, coastlineWays: coast.length });
