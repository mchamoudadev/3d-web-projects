# Build "Muqdisho 3D": a 3D navigable map of Mogadishu with natural-language routing

## Role

You are a senior full-stack and geospatial engineer with strong front-end craft. You have built production map applications with MapLibre, OpenStreetMap data, OSRM and Three.js. You ship working code, verify it in the browser, and keep the whole stack runnable on a single laptop.

## Goal

Build a desktop web app around one experience: **the journey**.

A person types where they want to go, in Somali or English, for example "I need to go to Medina hospital from Bakaara" or "waxaan rabaa inaan tago Isbitaalka Banaadir". The app resolves the place, and then the camera takes off from the origin, flies over the real 3D city along the actual driving route with cinematic camera work, points out the places being passed (mosques, markets, hospitals, the beach, landmarks), and lands at the destination. When it lands, the person is standing at the place they asked for.

The flight is the product. It has to feel like a film shot over Mogadishu, not a map animation. It exists so the person learns the way and sees the city on the way to their target. Text-based directions, street-level exploration after landing, and everything else support the flight.

Version one covers the Mogadishu city core and the main landmarks. Text input only. Voice comes later, so keep the input layer swappable.

## Non-negotiable constraints

- Everything runs locally except one call to an LLM through OpenRouter. No Google Maps APIs of any kind (licensing forbids showing Google places or routes on a non-Google map, and Google has no 3D buildings for Mogadishu anyway).
- Data sources: OpenStreetMap only (ODbL, attribute it in the UI). Our own places table for search.
- Do not use em dashes anywhere in copy, comments or docs.

## Stack

- Next.js (App Router) with TypeScript
- MapLibre GL JS as the geospatial engine (tiles, projection, camera, base ground)
- Three.js rendered inside a MapLibre custom layer for everything visible in 3D: buildings, roads, trees, water, vehicles, landmarks, lighting and shadows. MapLibre's own `fill-extrusion` is used only as a Phase 2 stepping stone and is replaced in Phase 7.
- PMTiles for vector tiles (a single static file, served from `/public`)
- Three.js for landmark models via a MapLibre custom layer
- OSRM in Docker for routing (car profile)
- Postgres in Docker with `pg_trgm` for the places database (Prisma or Drizzle)
- OpenRouter for intent parsing (OpenAI-compatible chat completions endpoint at `https://openrouter.ai/api/v1`, called from a server-side route handler). The key is provided by me as `OPENROUTER_API_KEY` in `.env.local`. Never expose it to the client. Put the model id in `OPENROUTER_MODEL` in `.env.local` with a sensible default so I can switch models without touching code.
- shadcn/ui (with Tailwind) for UI components

## Phase plan

Work in phases. Finish each, verify it runs, then continue. Provide a `README.md` with the exact commands at every phase.

### Phase 1: Data pipeline (scripts only, no UI)
Create `scripts/` with documented, re-runnable steps:
1. Download `somalia-latest.osm.pbf` from Geofabrik.
2. Clip to the Mogadishu bounding box `1.98,45.25,2.12,45.42` with `osmium extract`.
3. Generate vector tiles with Planetiler (preferred) or tilemaker into `public/tiles/mogadishu.pmtiles`. Include layers: buildings (with any `height` and `building:levels` tags), transportation, water, landuse, place names.
4. Build the OSRM graph from the clipped extract and provide a `docker-compose.yml` that runs OSRM on `localhost:5000` and Postgres on `localhost:5432`.
5. Export hospitals, clinics and named amenities from the clipped extract to `data/osm-places.json` (name, tags, centroid).
6. A seed script that loads `data/osm-places.json` plus `data/landmarks.json` (hand-written, see below) into the places table.

Verify: OSRM answers a route request between two Mogadishu coordinates; the PMTiles file opens in the PMTiles viewer.

### Phase 2: The 3D city
- Full-screen MapLibre map using the PMTiles source. Custom dark style: near-black ground, dark warm building fills, roads in muted cream, water deep blue, minimal labels. Attribution to OpenStreetMap visible.
- `fill-extrusion` layer for buildings. Height rule since OSM has almost no heights in Mogadishu: use `height` or `building:levels` when present; otherwise estimate from footprint area (small footprint 3.5 m, medium 7 m, large 10.5 m) and add a bonus for buildings adjacent to primary roads. Tune this until the skyline looks plausible, not uniform.
- Ambient lighting and a subtle fog toward the horizon. Pitch 60, bearing about 20, starting view over the city core (Hamar Weyne, Shangani, the port).
- Landmark layer: a Three.js custom layer that loads GLB models at fixed coordinates from `config/landmarks.ts`. Start with primitive placeholder models (a box with a name label) for every landmark. Real GLBs will replace them by changing the path only.

Verify: smooth pan and zoom at 60 fps with the full building layer visible at zoom 14 to 17. Treat this phase as the fast first look; Phase 7 replaces the extrusion layer with the full Three.js city.

### Phase 3: Places database and search
Schema for `places`:
- `id`, `name` (canonical), `aliases` (text array, Somali, English and Arabic variants), `category` (hospital, clinic, market, mosque, government, hotel, university, district, landmark, airport, beach), `district`, `lat`, `lng`, `description`, `source` (osm or manual), `osm_id` nullable.
- `pg_trgm` index on `name` and on a generated column that joins `name` and `aliases`.
- A `/api/places/search?q=` endpoint returning ranked fuzzy matches, tolerant of Somali spellings (Banaadir, Banadir, Benadir) and script differences.

Seed data:
- The OSM hospital export, cleaned by hand in `data/hospital-overrides.json` (fix names, add aliases, drop junk entries like "ex dugsi sare banadir").
- `data/landmarks.json` with at least these entries, each with coordinates you look up from OSM and aliases in Somali and English: Banadir Hospital, Madina Hospital, Recep Tayyip Erdogan (Turkish) Hospital, SOS Hospital, Kalkaal Hospital, Keysane Hospital, Aden Adde International Airport, Liido Beach, Bakaara Market, Villa Somalia, Somali Parliament, Mogadishu Port, Abdiaziz Mosque, Arba'a Rukun Mosque, Mogadishu Cathedral ruins, National Theatre, Somali National University, SIMAD University, Peace Garden, Daljirka Dahsoon, KM4 junction, the 17 districts of Banadir as `district` entries.

Verify: searching "isbitaalka madiina", "medina hospital" and "مستشفى المدينة" all return the same row first.

### Phase 4: Natural-language understanding
- `/api/understand` route handler. Input: the user's text. Output: strict JSON `{ origin: string | null, destination: string, mode: "driving", language: "so" | "en", confidence: number }`.
- Call OpenRouter's chat completions endpoint with the model from `OPENROUTER_MODEL`, using JSON mode where the model supports it and a strict JSON instruction otherwise. System prompt instructs the model to extract place names as written, not to translate them, to handle Somali phrasing ("waxaan rabaa inaan tago", "sidee ku tagaa", "meesha ugu dhow"), and to return JSON only.
- Resolve `origin` and `destination` through the places search. If the top match has a low score or several matches are close, return a disambiguation list to the UI ("Did you mean Madina Hospital or Madina district?"). If origin is null, use the current map center and say so in the UI.
- Add `docs/nlu-tests.md` with at least 30 test phrases in Somali and English and the expected resolution. Make them pass.

### Phase 5: Routing and the journey
This is the core of the product. Spend real effort on the camera.

- Call OSRM with origin and destination, request `steps=true` and `overview=full`.
- Draw the route as a glowing line (two layers: a wide soft blur and a thin bright core) above the buildings. The line reveals itself ahead of the camera during the flight, never fully drawn from the start.

**The journey, in four beats**

1. **Take-off (about 3 seconds).** The camera starts at street level at the origin, facing the direction of travel, and rises in a smooth arc to cruising altitude while the origin's name fades in as a caption. Ease: slow start, confident rise.
2. **Cruise.** The camera follows a smoothed spline along the route. Altitude scales with route length (minimum 120 m, maximum 500 m) and dips lower near points of interest so the person sees them properly. The camera looks slightly ahead of its position, banks gently on turns, slows at each maneuver, and speeds up on long straight stretches. Cruising speed is tuned so the whole journey takes 25 to 60 seconds regardless of distance.
3. **Passing places.** As the camera approaches any place from the database within 200 m of the route, the place is highlighted in the 3D world (a soft glow at its base and a floating label), a caption appears bottom-left with its name and category in the request's language, and the camera drifts its gaze toward it for a moment before returning to the route. Choose at most one place per 10 seconds so it never feels like a list. Prefer landmarks and hospitals over generic entries.
4. **Landing (about 4 seconds).** Near the destination the camera descends in a wide slow spiral, the destination glows, the camera settles to street level in front of it facing the entrance, and the destination card slides in. The landing must feel like arriving, not stopping.

**Camera quality rules**
- Position, look-at and altitude are all sampled from splines with continuous velocity. No visible keyframe corners. Test by scrubbing frame by frame at every maneuver.
- Speed changes are eased over at least 1.5 seconds.
- Banking is subtle (max 8 degrees) and follows the turn curvature.
- The horizon is always visible during cruise so the person feels the city's scale. Pitch between 55 and 70 degrees, never straight down.
- The flight is scrubbable with a timeline slider, pausable, replayable, and can be sped up 2x. Scrubbing backwards flies the route in reverse.

**Directions panel.** Landmark-based instructions built from the same passing-places logic. For each OSRM maneuver, find the nearest place in the database within 150 m and phrase the step as "Turn left after Abdiaziz Mosque" or "Continue past Bakaara Market". Fall back to street names where they exist (about 350 named roads), and to distance-only wording otherwise. Bilingual: Somali and English, following the language detected in the request. The panel highlights the current step during the flight.

**Destination card.** Name, category, district, description, a "Fly again" action, a "Look around" action (Phase 8) and "Start over".

Verify: "I need to go to Banadir Hospital from Liido" produces a route and a complete take-off, cruise, passing-places and landing sequence in under 3 seconds of loading, and the flight has no visible camera jerks when scrubbed frame by frame.

### Phase 6: UI polish and design
- Design direction: dark, cinematic, warm. Deep charcoal UI panels with a thin cream border, one accent color (warm sand #E8C79A) for the route and highlights. Headline font Fraunces, UI font Inter. Somali and English toggle in the top right.
- Layout: full-screen map. A single centered input at the bottom ("Xaggee rabtaa inaad tagto?" / "Where do you need to go?"). After a request, the input slides to the top and a directions panel docks on the left. Nothing else on screen.
- Loading states for understanding, resolving and routing, each with a one-word Somali and English label.
- Empty state: the camera drifts slowly over the city until the first request.
- Keyboard: Enter to submit, Escape to reset, space to pause the flight.

### Phase 7: The full 3D city in Three.js
Replace the `fill-extrusion` layer with a Three.js city rendered in a MapLibre custom layer, so the map camera and the 3D world stay perfectly aligned.

- **Tile streaming.** Read building, road, water, landuse and natural features from the PMTiles file per tile at zoom 15, build merged geometry per tile in a web worker, cache built tiles, and dispose tiles outside the view. Target 60 fps with the whole visible area loaded.
- **Buildings with procedural facades.** Extrude footprints with the Phase 2 height rule, then apply a facade shader that draws floors, window rows and wall variation from a seeded hash of the building id. Palette by district and building size: whitewashed and sand tones for old Hamar Weyne and Shangani, concrete greys and pastel blues for newer districts, flat roofs with parapets, occasional rooftop water tanks as instanced meshes. Tag-driven variation where OSM has it (`building=mosque` gets a dome and minaret primitive, `amenity=hospital` gets a taller block with a lit sign). No two adjacent buildings should look identical.
- **Roads as geometry.** Build road surfaces from the transportation layer as flat ribbons with width by class (primary, secondary, residential, unpaved). Asphalt shader with lane markings on primary and secondary roads, dusty sand shader on unpaved roads. Junctions merge cleanly.
- **Ocean and coast.** An ocean plane with a reflective animated water shader along the Indian Ocean edge, a soft foam line at the beach, and the harbour. Liido Beach must look like a beach.
- **Trees and vegetation.** Instanced palms and acacia-style trees placed from OSM `natural=tree`, `landuse=grass`, `leisure=park` and scattered lightly along primary roads and the beach.
- **Sun, sky and shadows.** A physical sky with a sun position driven by a time-of-day control (default late afternoon), cascaded shadow maps so buildings cast real shadows, warm fog toward the horizon, and a night mode where windows and street lights glow through the facade shader.
- **Traffic and life.** Instanced low-poly cars and the three-wheeled bajaj moving along the road graph using the OSRM network, with headlights at night. A small number of instanced pedestrians on main streets. Density adjustable in a debug panel.
- **Landmarks.** The placeholder landmark models are replaced with real GLBs as they arrive; until then, give each landmark a distinctive primitive silhouette (the airport as a long low hall, Villa Somalia as a compound, mosques with domes) so the skyline reads correctly even before real models exist.
- **Debug panel** (dev only): toggles for shadows, traffic, tree density, time of day, tile count, draw calls and frame time.

Verify: the Phase 5 journey from Liido to Bakaara plays over the full city with shadows and traffic on, holding 60 fps on a mid-range laptop.

### Phase 8: After landing, street-level mode
The journey lands the person at street level in front of the destination. From there, "Look around" lets them explore on foot, and "Drive it" replays the route at ground level. This phase is secondary to the flight and must never delay Phases 5 to 7.

- **Drive mode:** the camera sits 1.6 m above the road and follows the route at driving speed, with a slight look-ahead on turns, speed easing at maneuvers, and the landmark-based directions shown as on-screen captions at the right moments. Scrubbable and pausable like the flight.
- **Free roam:** WASD or arrow keys to walk, mouse to look, clamped to road surfaces and the beach, collision against buildings, a subtle head bob, and a "Return to route" action. Clicking a landmark opens its card.
- **Street-level rendering:** depth of field, contact shadows under vehicles, higher facade detail within 80 m, ambient occlusion, and fog tuned so the city fades gracefully at distance instead of popping.
- **Transitions:** landing already ends at street level, so entering this mode is seamless. Climbing back to rooftop height for a replay is one continuous camera move with easing, never a cut. Scroll wheel controls altitude between street and rooftop so the two modes feel like one space.

Verify: walk the full route from Banadir Hospital to Liido Beach at street level with no frame drops below 45 fps, no visible tile pop-in, and the camera never passing through a building.

## Suggested file structure

```
app/
  page.tsx
  api/understand/route.ts
  api/places/search/route.ts
  api/route/route.ts          (proxies OSRM)
components/
  Map.tsx                     (MapLibre init, style, PMTiles)
  Buildings.tsx               (Phase 2 extrusion layer and height rule)
  city/
    CityLayer.tsx             (Three.js custom layer, tile streaming, disposal)
    tileWorker.ts             (geometry building in a web worker)
    buildings.ts              (extrusion, facade shader, tag-driven variants)
    roads.ts
    water.ts
    vegetation.ts
    traffic.ts
    lighting.ts               (sun, sky, shadows, night mode)
    Landmarks.tsx
  StreetMode.tsx              (drive and free roam, controls, collision)
  RouteLayer.tsx
  Journey.tsx                 (take-off, cruise, passing places, landing, timeline)
  ui/
    AskBar.tsx
    DirectionsPanel.tsx
    DestinationCard.tsx
    Disambiguate.tsx
    LanguageToggle.tsx
lib/
  nlu.ts
  places.ts
  osrm.ts
  camera.ts
  directions.ts               (landmark-based phrasing)
config/
  landmarks.ts
  style.json                  (MapLibre style)
data/
  landmarks.json
  hospital-overrides.json
  osm-places.json             (generated)
scripts/
  01-download.sh
  02-clip.sh
  03-tiles.sh
  04-osrm.sh
  05-export-places.ts
  06-seed.ts
docker-compose.yml
docs/
  nlu-tests.md
README.md
```

## Acceptance criteria

- `docker compose up` plus `npm run dev` brings the whole thing up locally with only `OPENROUTER_API_KEY` and `OPENROUTER_MODEL` in `.env.local`. Historical request: an environment template. This collection instead documents the variables in CONFIGURATION.md and excludes all .env files.
- The full Three.js city (facades, roads, ocean, trees, shadows, traffic) holds 60 fps at rooftop height and 45 fps or better at street level on a mid-range laptop.
- Buildings vary by district and tags; no repeated uniform blocks.
- Landmarks appear at correct coordinates and can be swapped for real GLBs by changing a path.
- The flight and street-level mode share one continuous camera space with no cuts.
- Free roam stays on roads and the beach and never clips through buildings.
- Somali and English requests resolve correctly for all phrases in `docs/nlu-tests.md`.
- Ambiguous requests produce a disambiguation choice instead of a wrong route.
- The journey plays take-off, cruise, passing places and landing as one continuous shot with no camera jerks, and finishes at street level in front of the destination.
- Passing places are highlighted in the 3D world and captioned in the request's language, at most one per 10 seconds.
- Routes are drawn correctly and the flight is smooth, scrubbable in both directions and replayable.
- Directions reference landmarks where available and never show raw OSRM text.
- OpenStreetMap attribution is visible at all times.
- No console errors. Lint clean.

## How to work

- Start with Phase 1 and show me the data pipeline running before any UI.
- Phase 5 (the journey) and Phase 7 (the full 3D city) are the heart of the product. Get a beautiful flight over the Phase 2 city first, then make the city itself beautiful. Phase 8 comes last.
- After each phase, list what you built, what you left rough, and what you need from me (for example, landmark coordinates you could not confirm or GLB models).
- If a spec detail is ambiguous, choose the option that keeps everything local and note the assumption. Do not stop to ask unless it blocks you.
- Keep the input layer isolated so voice can be added later without touching NLU, routing or the map.