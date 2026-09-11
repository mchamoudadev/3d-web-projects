# Verification protocol

The updated brief in `BUILD-BRIEF.md` is the acceptance source. A phase is complete only after its recorded checks pass. Screenshots and frame timing measurements cannot be replaced by lint or unit tests.

## Data gate

- Geofabrik published checksum, then `osmium extract` with complete ways.
- Inspect PMTiles header, bounds, layers and a decoded zoom 15 tile.
- Open that exact file in the official PMTiles viewer and capture evidence.
- Build OSRM with extract, partition, customize. Request full geometry and steps from the local service.
- Verify nonempty Postgres places after the transactional seed.

## Journey gate

- Resolve all 30 documented phrases, including both origins and destinations, with Somali and English language results.
- Distinguish isolated parser tests, database integration tests and live OpenRouter evidence.
- Test Madina hospital, Wadajir/Madina district and ambiguous Madina as distinct cases.
- Verify missing services, missing credentials, malformed intents and no-route responses produce recoverable UI states.
- Sample camera position, gaze, altitude and bank around every maneuver and phase boundary.
- Capture take-off, cruise, a passing-place highlight and landing from a real local route.
- Scrub backwards, pause, replay and use 2x without a timeline discontinuity.
- Measure loading separately from the 25 to 60 second flight duration.

## City gate

- Test the Liido to Bakaara journey with traffic and shadows enabled.
- Record device, browser, viewport, pixel ratio, tile count, draw calls and frame-time percentiles.
- Record cold tile loading separately from warm-cache rendering.
- Inspect facades, roofs, palms, road junctions, coast and the destination landing at street level.
- Verify all geographic requests stay on localhost during app use.
- Check English and Somali UI, keyboard behavior, errors, and visible OSM attribution.

## After-landing gate

- Use the Banadir Hospital to Liido Beach route.
- Verify collision against building footprints, including holes and multipolygons.
- Verify movement over missing tiles is blocked until traversable surfaces are loaded.
- Check road and beach constraints, return to route, driving replay, and altitude scrolling.
- Record measured performance without claiming untested mid-range hardware results.
