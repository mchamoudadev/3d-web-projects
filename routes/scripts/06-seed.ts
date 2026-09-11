import pg from "pg";
import { readFile } from "node:fs/promises";
const pool = new pg.Pool({
  connectionString:
    process.env.DATABASE_URL,
});
type Place = {
  id: string;
  name: string;
  aliases: string[];
  category: string;
  district: string;
  lat: number;
  lng: number;
  description: string;
  source: string;
  osm_id: string | null;
};
const osm: Place[] = JSON.parse(await readFile("data/osm-places.json", "utf8"));
const manual: Place[] = JSON.parse(
  await readFile("data/landmarks.json", "utf8"),
);
const corrections: {
  dropNames: string[];
  overrides: (Partial<Place> & { osm_id: string })[];
} = JSON.parse(await readFile("data/hospital-overrides.json", "utf8"));
const client = await pool.connect();
try {
  await client.query("BEGIN");
  await client.query(await readFile("scripts/schema.sql", "utf8"));
  const manualIds = new Set(manual.map((p) => p.osm_id).filter(Boolean));
  const rows = [
    ...osm.filter(
      (p) =>
        !corrections.dropNames.includes(p.name.toLowerCase()) &&
        !manualIds.has(p.osm_id),
    ),
    ...manual,
  ];
  for (const row of rows) {
    const p = {
      ...row,
      ...corrections.overrides.find((c) => c.osm_id === row.osm_id),
    };
    await client.query(
      `INSERT INTO places (id,name,aliases,category,district,lat,lng,description,source,osm_id)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) ON CONFLICT (id) DO UPDATE SET
      name=EXCLUDED.name, aliases=EXCLUDED.aliases, category=EXCLUDED.category, district=EXCLUDED.district,
      lat=EXCLUDED.lat, lng=EXCLUDED.lng, description=EXCLUDED.description, source=EXCLUDED.source, osm_id=EXCLUDED.osm_id`,
      [
        p.id,
        p.name,
        p.aliases,
        p.category,
        p.district,
        p.lat,
        p.lng,
        p.description ?? "",
        p.source,
        p.osm_id,
      ],
    );
  }
  // Remove rows from earlier snapshots and OSM rows superseded by manual canonical entries.
  await client.query("DELETE FROM places WHERE NOT (id = ANY($1::text[]))", [
    rows.map((p) => p.id),
  ]);
  await client.query("COMMIT");
  console.log(`Seeded ${rows.length} places`);
} catch (e) {
  await client.query("ROLLBACK");
  throw e;
} finally {
  client.release();
  await pool.end();
}
