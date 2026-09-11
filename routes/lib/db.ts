import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { pgTable, text, doublePrecision } from "drizzle-orm/pg-core";
const globalDb = globalThis as unknown as { muqdishoPool?: pg.Pool };
export const pool =
  globalDb.muqdishoPool ??
  new pg.Pool({
    connectionString:
      process.env.DATABASE_URL,
    max: 5,
    connectionTimeoutMillis: 2500,
  });
if (process.env.NODE_ENV !== "production") globalDb.muqdishoPool = pool;
export const placesTable = pgTable("places", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  aliases: text("aliases").array().notNull(),
  category: text("category").notNull(),
  district: text("district").notNull(),
  lat: doublePrecision("lat").notNull(),
  lng: doublePrecision("lng").notNull(),
  description: text("description").notNull(),
  source: text("source").notNull(),
  osm_id: text("osm_id"),
});
export const db = drizzle(pool);
