# Phase evidence

## Phase 1

Verified on 2026-09-09. `data/reports/phase1.json` contains the live report.

- Geofabrik checksum: `d27dd017ab49b4b6ede537c605dfba30`, 164,665,633 bytes.
- Mogadishu clip: 12,332,775 bytes. Export: 426,647 building polygons, 286 unique named places before one junk hospital is removed, 13 coastline ways.
- Planetiler completed in 11 seconds. PMTiles: 18,486,014 bytes, 258 tiles, zoom 10 to 15, all seven configured layers. The sample tile has 4,770 buildings and 246 road features.
- Official PMTiles viewer opened the local file and rendered it at zoom 14.06. Evidence: `output/playwright/phase1-pmtiles.png`. Its only console error is its own missing favicon.
- OSRM v26.9.0 extract, partition, customize succeeded. A live request returned `Ok`, 3,508.9 m, 219.9 seconds, 77 coordinates, 8 steps.
- Postgres has 285 seeded rows and the generated column and trigram indexes.
- TypeScript and lint exited successfully for the Phase 1 scripts. Next lint warned that no app/pages directory exists yet, as expected before UI work.

Rough: Planetiler reported 188 missing relation member ways and 23 invalid empty multipolygons from the clipped OSM source. Curated names, aliases and missing landmark metadata remain for Phase 3. Complete ways preserve individual footprints, not every large relation crossing the clip.

Needs from user: none for Phase 1. Local port overrides: OSRM 5001, app 3100, because 5000 and 3000 are occupied. The NLU key was configured and verified in Phase 4.

## Phase 2

Functional browser check passed: local PMTiles, varied area/level/height extrusions, OSM coastline, warm dark style, Three.js placeholders and local fonts. `output/playwright/phase2-city.png` records the initial view. At zoom 15.8 the map reports 34,683 visible building features. TypeScript and lint pass. Current browser console has no errors.

Foreground performance: rotating at zooms 14 through 17 measured 8.3 ms median, p95 9.2 to 9.3 ms at 1200 by 953 CSS pixels and DPR 2. Recorded in `data/reports/phase2-foreground.txt`. The earlier 30 fps reading was browser background throttling, confirmed against the idle baseline. This measures this laptop, not representative mid-range hardware.

Rough: primary-road height bonus is deferred to the Phase 7 geometry builder. One requested mosque is unplaced pending OSM confirmation. Landmarks are placeholders. No real GLB models were supplied.

## Phase 3

Implemented Postgres/Drizzle search with trigram shortlisting, normalized aliases, fuzzy ranking and disambiguation thresholds. Seven database integration checks pass, including all three required Madina Hospital spellings and plain Madina ambiguity. Seed contains 292 places after canonical overrides. There are 37 curated entries, including 17 districts.

Rough and user input: see `place-provenance.md` for the unconfirmed Abdiaziz Mosque location, campus specificity, district-label approximation and Kaxda outside the clip. These are not silently replaced with invented coordinates.

## Phase 4

All 32 live NLU cases pass after adding the missing Aden Adde Airport alias. Case 10 was rerun live after the alias fix; the other 31 already passed. See `nlu-tests.md` and `data/reports/nlu-live.json`. Each request makes one OpenRouter completion call and resolves locally. The user-supplied bare key was moved from `.env` to the named server-only variable in `.env.local` without disclosure. Health endpoint confirms database, routing and NLU configuration.

Rough: most live NLU plus resolution checks took 1 to 2 seconds, but a provider outlier exceeded 6 seconds. A guaranteed sub-3-second load is not established. No user input needed for NLU.

## Phase 5

Local OSRM route, bilingual landmark directions, time-domain camera splines, eased curvature speed, 3 second rise, 4 second spiral landing, passing places spaced at least 10 seconds, glowing route reveal, pause, scrub and 2x controls. Browser rendered the real 9.8 km Liido to Banadir route and street arrival. Three camera and directions tests pass across dense frame samples. `output/playwright/phase5-cruise.png` and `phase5-arrival.png` record browser views.

Rough: entrance orientation targets the known building centroid from the OSRM road endpoint. Provider loading has a long tail. Replay now uses a continuous eased return and passing labels are isolated from background labels.

## Phase 6

Dark warm panels, Fraunces/Inter, isolated AskBar, language controls, loading stages, choices, current-step directions, arrival card and keyboard controls implemented. Browser checks confirmed the Madina hospital/district choice, Somali UI, pause, scrub and arrival actions.

## Phase 7

Implemented worker tile streaming, merged footprint geometry and courtyard holes, facade shader, height/arterial variation, historic district palettes, parapets, tanks, mosque forms, hospital signs, class-width roads, asphalt markings, ocean waves and shoreline, beach/park vegetation, physical sky, three shadow cascades, night mode, OSRM traffic, pedestrians, street lamps, distinct schematic landmarks and development settings.

The real Liido to Bakaara flight completed. A 50 second foreground browser run measured 5,309 frames, 8.3 ms median, 16.7 ms p95 and 17.6 ms p99, with four frames over 33.4 ms. Report: `data/reports/phase7-flight-performance.txt`. Shadows and traffic were enabled. The initial view loaded approximately 105,000 buildings; the route cache reached about 280,000 across 55 tiles. This is an Apple M3 Max with 64 GB RAM, not a mid-range machine. Screenshot: `output/playwright/phase7-flight.png`.

Rough: silhouettes are schematic until GLBs arrive. Road junctions use overlapping round ribbons rather than a complete polygon-union road mesh. Traffic follows cached local OSRM routes and uses low-poly forms. Screen-space effects are deliberately subtle. The midpoint and street performance acceptance targets on other hardware remain unverified.

## Phase 8

Implemented eye-height drive playback using OSRM duration, pause and reverse scrubbing, walking controls, mouse look, scroll altitude, swept collision against footprints and schematic models, loaded-surface guard, courtyard support, head bob, clickable landmarks, return to route and continuous replay transitions. Added depth blur and contact shading at street height.

A separate headless browser walking check sampled 601 frames over 10 seconds: zero invalid walking positions, 16.7 ms p95, maximum 16.8 ms. Report: `data/reports/phase8-walk-check.txt`. The first full 9,035.5 m Banadir-to-Liido route audit found 16 blocked 2 m samples, all in the first 32 m inside the hospital silhouette. Camera approaches now trim both start and end to clear road positions. The final audit sampled 4,621 positions with zero blocked positions and an arrival height of 1.6 m. Report: `data/reports/final-walk-audit.txt`. This is a spatial test, not proof of walking the entire route in real time.

A high-zoom camera mismatch was fixed by deriving the Three camera pose from the map's public center, bearing, pitch, zoom and field of view, avoiding inverse-matrix precision loss. Ground-target look rays keep the map and Three altitude consistent. Night controls, Somali UI and scroll altitude were exercised in the browser. Screenshots include `phase8-final-arrival.png`, `phase8-somali-walk.png` and `phase7-night-rooftop.png`.

Rough: vertical mouse look stays just below the horizon, with scroll for rooftop access. A complete real-time Banadir-to-Liido walk and a mid-range-device performance run are not established. No GLBs were supplied. Abdiaziz Mosque remains unconfirmed as recorded in `place-provenance.md`.

## Final local checks

TypeScript, lint, 15 automated tests and the production build pass. The NLU suite has 32 live passes. Database and routing containers are running, and development serves port 3100. A scan of the client bundle found no OpenRouter key. Exact startup, regeneration and verification commands are in the README.

Final rendering fixes preserve the Three.js viewport after resizing, keep the driving route close to the road surface, and give facade and road shaders distinct program-cache keys under cascaded shadows. The latter fixes missing illuminated windows; it has a regression test. Replay lifts vertically before crossing the city and descends after horizontal movement to avoid crossing nearby buildings at eye height. Visual evidence: `output/playwright/final-production-resized.png`, `final-night-windows.png` and `final-bakaara-arrival.png`.

With the corrected facade shaders, a complete Liido-to-Bakaara flight at 1280 by 720 in a separate headless browser recorded 2,710 frames after the journey controls became ready: median 16.7 ms, p95 16.7 ms, p99 16.8 ms, maximum 33.4 ms. Shadows and traffic were on. The cache held 279,785 buildings across 55 tiles, with 375 draw calls and about 4.35 million triangles. Arrival was at 1.6 m on a valid walking surface. Loading took 3.1 seconds. Report: `data/reports/final-shader-flight.txt`. This result establishes neither zero dropped frames nor the mid-range-hardware target.

An earlier production request loaded in 2.92 seconds. Its combined request-and-flight sample included a 1.12 second stall, so it is not used as the flight-only performance result. The final production build received a fresh browser smoke check with zero console errors or warnings; `output/playwright/final-production-city.png` records the result at 1536 by 960. All 20 curated landmarks route successfully, and 16 of 17 district destinations do too. Kaxda correctly reports that it lies outside the supplied city-core bounds. Report: `data/reports/final-landmark-routes.json`.

## Route-learning revision

Expanded the coverage to Greater Mogadishu and regenerated the full PBF, geometry dump, PMTiles, OSRM graph, place database and traffic paths. The inventory is in `data/coverage-report.json`. Search now has 512 records and all 37 curated destinations route, including Kaxda. The previous Kaxda limitation above describes the original cutout.

Added a north-up route overview, selectable junctions, approach-framed review cameras, landmark side/distance cues and bilingual turn questions. The outgoing highlighted route is hidden during review. Playback pauses until the user continues. Street-level replay replaces the confusing Drive it label and explicitly describes automatic playback.

Rendering now preserves mapped roof shapes, road widths, walls, fences, airport surfaces, piers and broader land-cover classes. The expanded coast supports islands. Corrected shadow bias removes roof stripes, and windows fade at distance. Heights and facade colours remain largely unmapped, as the inventory makes explicit.

Twenty tests pass, covering the added roof, island, learning-direction and place-deduplication cases as well as the original checks. All 32 NLU cases were rerun live and passed against the expanded database, including two revised expectations requiring a choice between distant Kalkaal Hospital locations. The slowest provider request took 5.36 seconds. See `docs/nlu-tests.md`.

Browser verification exercised the real Liido-to-Banadir request, paused junction review, a correct turn answer, next-junction navigation and a Somali language switch while paused. A fresh browser console had zero errors or warnings. Earlier hot-reload sessions encountered stale worker bundles during rebuild; a fresh load was used for the final checks. Screenshots: `output/playwright/learning-junction-final.png` and `learning-somali-final.png`.

The resume-to-arrival browser sample recorded 2,840 frames at 1536 by 960: median 16.7 ms, p95 16.8 ms, p99 33.4 ms and maximum 116.7 ms. Shadows and traffic were enabled; the final cache held 299,014 buildings in 55 tiles. Arrival was 1.6 m above a valid walking surface. This includes the return from junction review and does not establish an uninterrupted 60 fps floor. Report: `data/reports/learning-flight-performance.txt`. The M3 Max hardware limitation still applies.

Street-level replay was opened from arrival, scrubbed to 340 seconds and paused. The rendered eye height was 1.6 m, and the interface described automatic playback. Screenshot: `output/playwright/street-replay-final.png`; report: `data/reports/learning-street-check.txt`. TypeScript, lint, the 20-test suite and the final production build pass.

## Licensed landmark references, 2026-09-09

User approved openly licensed photographs and models. Added four locally served photographs with visible date, author and licence, a bilingual landmark browser, map focus, a KM4 route action and photographs at matching turn lessons, arrivals and street-exploration cards. Daljirka and cathedral geometry now follows dated photo references. Corrected the cathedral's visual extrusion: OSM way 126234890 has 22 levels, contradicted by the inspected 2022 ruin photo. Its original tag and footprint remain in the dump; only the tile mesh is replaced. See `docs/landmark-media.md` for complete provenance and limits.

The four SHA-256 asset checks passed (`npm run data:media`), as did lint, type checking, all 20 existing tests and the production build. Browser verification loaded all four photos, switched EN/SO, started the real KM4-to-cathedral route (3.8 km, seven review junctions), showed the matching cathedral photo in the last-turn lesson, accepted the left-turn answer, resumed, scrubbed to arrival and entered street-level replay. Fresh production browser console: zero errors and warnings. A noninteractive start/end/current-position dot could obscure the last mini-map junction's click target; those dots now ignore pointer events, and clicking junction 7 was rechecked successfully in the browser.

Inspected desktop screenshots: `output/playwright/daljirka-reference.png`, `cathedral-photo-final.png`, `landmark-photo-lesson-final.png`, `landmark-photo-arrival-final.png`. Narrow 390 x 844 reference-card bounds and input separation passed; screenshots: `landmark-photo-mobile.png`, `landmark-browser-mobile.png`. Tall cards scroll internally. Desktop comparison confirmed removal of the erroneous tower block over the cathedral. Images remain dated recognition aids and models remain approximate; there is no full-city photographic reconstruction or imported Sketchfab model. Google satellite is a separate connected option needing a Maps key and billing; no Google integration was added.

## Place autocomplete, 2026-09-09

Added a debounced, cancellable local combobox to the existing journey input. Up to six results include category, district or fallback coordinates. Ranking supports two-character prefixes, Somali partial category names and aliases separately from intent-resolution confidence. Common English/Somali endpoint clauses preserve surrounding text when completed at the cursor. Keyboard navigation, mouse selection, Escape dismissal, loading, unavailable and no-match states are supported. The dropdown opens above the idle input and below the docked journey input.

Selected origin/destination records retain the exact branch for routing after the single existing NLU call. Editing a chosen name or resetting the input invalidates its selection. The route endpoint revalidates IDs against the local database. No autocomplete requests go to an external service.

Validation: 25 tests passed, including prefix ranking, endpoint replacement, Somali clauses and branch selection validity. Typecheck, lint and production build passed. Browser checks verified keyboard completion, editing a destination before an existing origin, EN/SO suggestions, empty results, Escape preserving input, a 390 x 844 viewport, and the docked dropdown. A real Liido to Kalkaal request retained the selected Hodan-side OSM branch; request observation confirmed zero NLU requests during typing/selection and exactly one on submit. Browser console: zero errors/warnings. Screenshots: `output/playwright/autocomplete-desktop.png`, `autocomplete-somali.png`, `autocomplete-mobile.png`, `autocomplete-branches.png`, `autocomplete-docked.png`.

## Jamhuriya and destination marking, 2026-09-09

Promoted the already imported Jamhuriya OSM university site (way 1373512386) into the curated search/map-label set, adding Somali and JUST aliases and Hodan context. The seeded total remains 512 because the curated record replaces its raw search duplicate. The university has multiple campuses; the app identifies this as the mapped site near Banaadir Hospital, without claiming a verified campus number or entrance. No new university geometry was invented.

Added a destination component independent of the passing-landmark caption: a green B pin, name, bilingual destination heading and ground ring. The ring fades at eye height to avoid a bright horizontal bar across the street view. The pin persists through flight, review, arrival and walking, and the route overview uses the same B marker. Autocomplete selections preview the marker; editing the chosen name clears that preview. Reset removes the pin and disposes the ring. Duplicate arrival captions on the map are suppressed.

Checks: all 26 tests passed, including English, Somali and JUST resolution. Type checking, lint and production build passed. Local Liido-to-Jamhuriya route: 8,949.8 m. Browser checks confirmed the map label, selected preview, edit invalidation, exactly one destination pin through review/arrival/walking, Somali label updates, and cleanup on reset. The marker remained inside the arrival viewport. Screenshots: `output/playwright/jamhuriya-destination.png` and `jamhuriya-destination-somali.png`. One unrelated fallback `/favicon.ico` 404 was observed during development refresh; no application exception was reported.
