import { open, writeFile } from "node:fs/promises";
import { PMTiles, type Source } from "pmtiles";
import { VectorTile } from "@mapbox/vector-tile";
import { PbfReader } from "pbf";
import pg from "pg";
try {
  process.loadEnvFile(".env");
} catch {
  /* Port overrides are optional on a fresh machine. */
}
const file = await open("public/tiles/mogadishu.pmtiles", "r");
const source: Source = {
  getKey: () => "local-mogadishu",
  getBytes: async (offset, length) => {
    const b = Buffer.alloc(length);
    await file.read(b, 0, length, offset);
    return { data: b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength) };
  },
};
try {
  const archive = new PMTiles(source),
    header = await archive.getHeader(),
    metadata = await archive.getMetadata();
  const x = Math.floor(((45.34 + 180) / 360) * 2 ** 15);
  const y = Math.floor(
    ((1 - Math.asinh(Math.tan((2.04 * Math.PI) / 180)) / Math.PI) / 2) *
      2 ** 15,
  );
  const tile = await archive.getZxy(15, x, y);
  if (!tile) throw new Error("Missing central-city tile");
  const layers = new VectorTile(new PbfReader(tile.data)).layers;
  if (!layers.building?.length || !layers.transportation?.length)
    throw new Error("Missing building or road features");
  const routeResponse = await fetch(
    `http://127.0.0.1:${process.env.OSRM_PORT ?? 5000}/route/v1/driving/45.336,2.046;45.318,2.034?steps=true&overview=full&geometries=geojson`,
  );
  const route = await routeResponse.json();
  if (route.code !== "Ok" || !route.routes[0].geometry.coordinates.length)
    throw new Error("OSRM route failed");
  const pool = new pg.Pool({
    connectionString:
      process.env.DATABASE_URL,
  });
  const { rows } = await pool.query(
    "SELECT count(*)::int AS places FROM places",
  );
  await pool.end();
  if (rows[0].places === 0) throw new Error("Places database empty");
  const report = {
    verified: new Date().toISOString(),
    pmtiles: {
      header,
      metadata,
      sample: {
        x,
        y,
        layers: Object.fromEntries(
          Object.entries(layers).map(([k, v]) => [k, v.length]),
        ),
      },
    },
    osrm: {
      code: route.code,
      distance: route.routes[0].distance,
      duration: route.routes[0].duration,
      points: route.routes[0].geometry.coordinates.length,
      steps: route.routes[0].legs[0].steps.length,
    },
    database: rows[0],
  };
  await writeFile("data/reports/phase1.json", JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
} finally {
  await file.close();
}
