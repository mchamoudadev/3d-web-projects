# Muqdisho 3D

A local, bilingual journey through Mogadishu: ask for a destination, fly over the real driving route, then study the junctions, explore on foot or replay at road level. Geographic data is OpenStreetMap, licensed under ODbL. No Google APIs or hosted map services.

## Phase 1: reproducible data pipeline

Prerequisites: Node 22+, Docker Desktop running, Python 3, and osmium-tool (`brew install osmium-tool` on macOS or `sudo apt install osmium-tool` on Debian). Allow 3 GB free storage for extract, containers and tiles.

```sh
npm install
npm run data:download
npm run data:clip
npm run data:tiles
npm run data:osrm
npm run data:places
docker compose up -d
npm run data:seed
npm run data:verify
```

The original city-core box was expanded after the route-learning review. `config/coverage.json` now sets `45.20,1.78,45.56,2.18` (west, south, east, north), covering Banaadir and the northern and western urban fringe. `complete_ways` preserves building footprints and road ways crossing the boundary. Planetiler 0.10.2 uses an OSM-only profile in `config/tiles.yml`, with original height, level and surface tags, zooms 10 to 15. Higher view zooms overzoom the archive. No Natural Earth data is downloaded.

The Geofabrik extract is downloaded only during setup. The downloader uses eight bounded HTTP ranges by default, reuses complete chunks after interruption, and checks the assembled file against the published MD5. Set `DOWNLOAD_CONNECTIONS=16` for a slow per-connection link. Re-running with an already verified snapshot skips the download. Steps overwrite their own generated artifacts. Seed operations upsert stable IDs and remove entries no longer present in the inputs.

Open `public/tiles/mogadishu.pmtiles` with the [official PMTiles viewer](https://pmtiles.io), using its local file picker. No upload is required. The application reads the same archive locally.

OSRM v26.9.0 uses its car profile and MLD graph. Its Docker image is pinned by digest, because the release has no matching version tag in GHCR. Postgres binds only to loopback with local development credentials. The key is server-only. See [CONFIGURATION.md](CONFIGURATION.md) for shell variables; no environment files are distributed.

```sh
curl 'http://localhost:5000/route/v1/driving/45.336,2.046;45.318,2.034?steps=true&overview=full&geometries=geojson'
docker compose logs --tail 50
docker compose down
```

Sources and tool documentation: [Geofabrik Somalia](https://download.geofabrik.de/africa/somalia.html), [Planetiler](https://github.com/onthegomap/planetiler), [OSRM](https://github.com/Project-OSRM/osrm-backend), [OpenStreetMap copyright](https://www.openstreetmap.org/copyright).

Phase verification and remaining work are tracked in `docs/progress.md`.

## Phase 2: first 3D city

```sh
npm run dev
# Open http://localhost:4319
npm run typecheck
npm run lint
```

MapLibre uses only local PMTiles and local worker modules copied by `postinstall`. Fonts are bundled from npm. The coast is joined from the 13 OSM coastline ways. The initial renderer uses area-derived fill extrusion heights and Three.js landmark placeholders. Phase 7 replaces this renderer. See `config/landmarks.ts` for model paths.

## Phase 3: search

```sh
npm run data:seed
npm test
curl 'http://localhost:4319/api/places/search?q=medina%20hospital'
```

Postgres and Drizzle back every search. Ranked aliases are normalized for Somali vowels, hospital vocabulary and Arabic diacritics. A match below 0.74 or with a margin below 0.1 requires a choice. Manual and OSM records sharing a canonical OSM ID are deduplicated. See `docs/place-provenance.md` for unresolved geographic details.

## Phase 4: intent extraction

```sh
# Fill OPENROUTER_API_KEY and OPENROUTER_MODEL in .env.local first.
npx tsx scripts/test-nlu.ts
curl http://localhost:4319/api/health
```

The test makes 32 small live OpenRouter calls, one per phrase. The app calls `/api/understand` exactly once per request, then `/api/resolve` locally. The input contract is text-only and independent of map controls, ready for a future voice-to-text adapter. Changing `OPENROUTER_MODEL` requires no source edit. Known JSON-mode model families receive `response_format`; other models receive the same strict JSON prompt and server-side Zod validation. No provider errors or secrets are logged.

### This laptop's port overrides

The web app uses dedicated port 4319, checked available when configured. macOS AirPlay uses port 5000. This workspace has `.env` containing `OSRM_PORT=5001`, and the app scripts use port 4319. The Compose default remains 5000 on a fresh machine. On this laptop use `http://localhost:5001` in OSRM curl commands and `http://localhost:4319` for the app. No existing services were stopped.

## Run the finished local app

The data files and Docker volumes have already been generated on this laptop. Keep the key in `.env.local`.

```sh
docker compose up -d
npm run dev
# Open http://localhost:4319
```

For a fresh checkout, run Phase 1 first, then `npm run data:traffic` and `npm run data:audit`. For a production build:

```sh
npm run build
npm run start
```

Stop the development server before starting production on the same port. The browser fetches fonts, workers, geometry, traffic and tiles locally. The server makes one OpenRouter completion request per submitted journey. It has no Google or remote map dependency. The external attribution link opens only when clicked.

## Phase 5: routing and flight

```sh
npx tsx --test tests/journey.test.ts tests/geometry.test.ts
curl -X POST http://localhost:4319/api/route \
  -H 'Content-Type: application/json' \
  -d '{"originId":"liido-beach","destinationId":"banadir-hospital","center":[45.34,2.04],"language":"en"}'
```

Try `I need to go to Banadir Hospital from Liido` or `Waxaan joogaa Isbitaalka Banaadir, waxaan rabaa inaan tago Xeebta Liido`. The camera rises for 3 seconds, cruises along the driving route, highlights selected nearby places at least 10 seconds apart, and spirals down over the final 4 seconds. Flight duration is 25 to 60 seconds. Curvature controls speed with a smoothing window, and both position and gaze are interpolated continuously. Cruise pitch stays at 64 degrees, with banking capped at 8 degrees.

The route progressively reveals a bright core and a wider translucent halo. Maneuver instructions are generated locally in either language, using nearby places and street names. OSRM's raw instruction text is never displayed. A missing origin uses the captured map center, identified in the panel. Road approaches to oversized schematic landmarks are used for the camera's start and finish so it begins and ends outside model geometry; OSRM geometry and distance remain unchanged.

## Phase 6: interface

```sh
npm run dev
# In the browser: test both example buttons, a Somali request, and "Take me to Madina".
# Verify the hospital/district choice, Space, Escape, timeline, replay and 2x.
```

Enter submits, Space pauses, and Escape starts over. The input moves from the bottom to the top when planning begins. Understanding, resolving and routing each have a loading label. SO and EN change visible captions and directions without another model request. The idle camera drifts unless reduced motion is preferred. `AskBar` is the isolated input adapter for adding voice later.

## Phase 7: Three.js city

```sh
npm run data:traffic
npm run dev
# Open City settings in the top-right corner of the development build.
# Try shadows, traffic, trees, and the time-of-day slider.
```

`CityLayer` replaces MapLibre fill extrusion entirely. Two workers read zoom-15 PMTiles features and merge geometry per tile. The view and route are prefetched, with a 55-tile memory cache and disposal of older off-view tiles. Building courtyards are preserved. Heights use OSM tags first, footprint estimates second, with an arterial-road bonus. Historic district palettes use the OSM Hamar Weyne and Shangani boundaries in `public/data/old-town.geojson`. Other areas use concrete and pastel variations. Windows, wall bands and night lighting are procedural shaders; tanks, domes, minarets and hospital signs are geometry.

Roads are class-width ribbons with round joins, asphalt markings and tagged unpaved surfaces. The OSM coastline defines the animated ocean and shoreline, while mapped beaches and parks drive land cover and vegetation. The sky uses the Three.js physical atmosphere shader. Three shadow cascades, warm fog, traffic, bajaj, pedestrians and street lamps complete the scene. Traffic paths are generated from the local OSRM graph by `scripts/08-traffic.ts`, then played locally without routing requests each frame.

Set a local GLB path, scale and bearing in `config/landmarks.ts` to replace a silhouette. The current silhouettes are schematic, not surveyed reconstructions. Reload the page after changing custom renderer classes during development; Fast Refresh can retain an existing MapLibre layer instance.

Primary implementation references: [MapLibre custom Three.js layers](https://maplibre.org/maplibre-gl-js/docs/examples/adding-3d-models-using-threejs-on-terrain/), [Three.js CSM](https://threejs.org/docs/pages/CSM.html).

## Phase 8: street exploration

```sh
npm run dev
# Complete a journey, then choose Look around or Street-level replay.
```

Look around: WASD or arrow keys walk, Shift walks faster, drag looks around, and the wheel raises or lowers the camera between eye height and 80 metres. Movement uses short swept steps, slides along obstructions, and requires a loaded road or beach surface. OSM building polygons, courtyard holes and schematic model bounds are collision obstacles. A landmark label opens its card. Return to route eases back to the arrival position.

Street-level replay automatically follows the route at eye height using the OSRM driving duration, with the same pause, scrub and speed controls. Replay returns through one eased camera movement. Street rendering adds a subtle depth blur, screen-space contact shading, vehicle ground shadows and full facade detail. Vertical mouse look stays below the horizon because the shared map camera targets ground; the field of view still includes the skyline.

## Verification and limits

```sh
npm run typecheck
npm run lint
npm test
npm run build
npx tsx scripts/test-nlu.ts
npm run data:verify
```

The NLU command makes live, billable provider requests. Other checks are local. Twenty automated checks cover search, ambiguity, camera sampling, projection, courtyard geometry, height rules, replay continuity distinct facade/shadow shader programs, pitched roofs, coastline islands, landmark sides and branch disambiguation. `docs/nlu-tests.md` records the live phrase results; Kalkaal Hospital requests now require a branch choice. The real route fixture in `tests/fixtures/` keeps camera tests independent of generated reports.

Browser evidence and measured timings are in `docs/progress.md`. This laptop is an Apple M3 Max with 64 GB RAM. Good results here do not establish the mid-range-laptop acceptance target. Provider latency occasionally exceeds 3 seconds. Long-session memory, cold tile streaming on slower hardware and the complete real-time walking journey need wider testing. Buildings and entrances remain estimates where OSM does not supply detail. Abdiaziz Mosque still needs a confirmed OSM feature or surveyed location; its district is not substituted for the mosque. See `docs/place-provenance.md`.

The data archive, raw extracts, OSRM graph, build output, credentials and browser captures are excluded by `.gitignore`. Recreate generated data with the documented scripts. Curated place data and small OSM coast/boundary/traffic files ship with the source. OpenStreetMap contributors are credited on screen at all times; derived geographical data remains subject to ODbL.

## Learn the route and inspect the full data

Choose **Learn the turns** after planning a journey. Select a junction, study the approach and nearby landmark, answer the direction question, then continue. **Street-level replay** is automatic road-level camera playback, not a driving simulator.

The expanded OSM dump, 512 place records, rendering changes, commands and data limits are described in [the route-learning revision](docs/learning-revision.md). The reusable binary dump is `data/osrm/mogadishu.osm.pbf`; the inventory is `data/coverage-report.json`.

## Landmark photographs

Choose **Explore landmark photos** on the opening screen, then select a place to compare its real photograph with its mapped location. **Learn the route from KM4** starts a normal journey. Photos also appear at matching learning junctions, arrival cards and street exploration. Four dated, attributed photographs are bundled locally. Daljirka Dahsoon and the cathedral have approximate reference-based geometry. The cathedral's erroneous 22-storey extrusion is suppressed without modifying the source dump. See [media provenance](docs/landmark-media.md) and `config/landmark-media.json` for sources, licences, download URLs and hashes.

## Place autocomplete

Type two or more characters in the journey input for local place suggestions. Results show the place category and district (or coordinates when the district is unmapped), support Somali and English aliases, and complete the place at the cursor within common route phrases. Use up/down and Enter, or click a suggestion. Selection fills the input; submit with Enter or the arrow button when ready. Escape dismisses suggestions without clearing the request. An explicitly selected branch is retained for routing; editing that place name invalidates the selection. Suggestions never call OpenRouter.

Destinations now use a green **B** pin and ground ring, separate from temporary passing-place captions. The marker persists during flight, route review, arrival and walking; the overview uses the same **B**. Selecting a destination from autocomplete previews its marker, and editing the selected name clears that preview. Jamhuriya University is labelled and searchable in English and Somali; the description identifies it as the existing OSM-mapped Hodan site near Banaadir Hospital.
