CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE OR REPLACE FUNCTION immutable_array_join(text[]) RETURNS text
LANGUAGE sql IMMUTABLE PARALLEL SAFE AS $$ SELECT array_to_string($1, ' ') $$;
CREATE TABLE IF NOT EXISTS places (
  id text PRIMARY KEY,
  name text NOT NULL,
  aliases text[] NOT NULL DEFAULT '{}',
  category text NOT NULL,
  district text NOT NULL DEFAULT '',
  lat double precision NOT NULL CHECK (lat BETWEEN -90 AND 90),
  lng double precision NOT NULL CHECK (lng BETWEEN -180 AND 180),
  description text NOT NULL DEFAULT '',
  source text NOT NULL CHECK (source IN ('osm','manual')),
  osm_id text,
  search_text text GENERATED ALWAYS AS (lower(name || ' ' || immutable_array_join(aliases))) STORED
);
CREATE INDEX IF NOT EXISTS places_name_trgm ON places USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS places_search_trgm ON places USING gin (search_text gin_trgm_ops);
