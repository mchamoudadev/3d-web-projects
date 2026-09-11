# Route learning and wider city data

The purpose is to recognize streets and landmarks and remember a route. The opening copy and journey controls now reflect that purpose.

## What changed

- A north-up route overview shows the whole journey and its junctions. Select a numbered junction or choose **Learn the turns**.
- Review pauses playback and frames the junction from its incoming approach at 90 m height. A marker identifies the junction. The outgoing route is hidden during the question. The road name and nearby landmark are shown where OSM provides them.
- Landmark cues say which side of the approach the mapped place lies on and its approximate distance from the junction. This does not establish that a facade is visible from the road.
- A short turn question, answer reveal, previous/next controls and a list of landmarks in route order help someone study the route. Closing review eases back into the journey.
- **Street-level replay** replaces **Drive it**. It is automatic camera playback along the driving route, with pause and scrub controls. It is not a vehicle simulator.
- Somali and English remain supported. Route review does not make another LLM call.

## The full local OSM extract

The coverage rectangle is now `45.20,1.78,45.56,2.18`, configured once in `config/coverage.json`. It contains the mapped Banaadir regional boundary and adds the northern and western urban fringe. It is a coverage rectangle, not an asserted city boundary. The original Somalia snapshot is already local; no second country download was needed.

- `data/osrm/mogadishu.osm.pbf`: 14,125,728 bytes. Complete ways with their original tags. This is the reusable OSM dump.
- `data/raw/mogadishu.geojsonseq`: the geometry export with original tags. The PBF also retains relations and objects without exportable geometry.
- `public/tiles/mogadishu.pmtiles`: 21,590,413 bytes, streamed locally by the application.
- `data/coverage-report.json`: reproducible inventory. Run `npm run data:audit` after regeneration.

The export contains 466,879 building polygons, 16,570 highway features and 172 distinct mapped road names. The database has 512 place records after curation. Search consolidates nearby map objects with identical names or aliases; the full dump retains them. All 37 curated destination routes, including Kaxda, now resolve through local OSRM.

## Rendering changes

The tiles now retain roof shape, colour and material tags, recorded road widths and lane counts, mapped walls, fences, runways, taxiways and piers. Land cover includes sports grounds, aprons, parking, residential areas, commercial areas and industrial areas.

The renderer uses supported mapped pitched-roof shapes, separate roof colours, facade variations, anti-aliased windows that fade at distance, building doors and sills, airport runway markings, walls and broader land-cover colours. Lighting has clearer contrast and less haze. Corrected shadow bias removes the diagonal stripes that previously appeared on flat roofs. Ocean rendering now applies the same colour-space conversion as the rest of the scene. Closed coastal islands remain land rather than being filled by the ocean.

## Data limits discovered

Only 158 building polygons have a positive height or level count. Only one records facade colour; 1,103 record roof shape. More OSM data provides better geography but does not provide photographic facades or surveyed entrances. Other building details remain illustrative. The user subsequently approved openly licensed photographs and models. Four local reference photographs now support landmark recognition, and two landmarks have reference-based approximate geometry. Geographic data stays OSM; photos are served locally with visible dates and credits. See `docs/landmark-media.md` for licences and appearance limits.

The expanded import includes another location named Kalkaal Hospital about 2.7 km from the curated Waaberi location. Requests without a branch now ask the user to choose. The NLU expectations were updated to require ambiguity for those two phrases, rather than suppressing the newly discovered location. The Hodan-side building records are grouped together in search and described in `data/hospital-overrides.json`.

## Rebuild

```sh
npm run data:clip
npm run data:places
npm run data:seed
npm run data:tiles
docker compose stop osrm
npm run data:osrm
docker compose up -d osrm
npm run data:traffic
npm run data:audit
npm run data:verify
```

The original download script remains available when a newer snapshot is desired. Regeneration uses the same snapshot until that file is explicitly refreshed.

## Verification

Verification results and screenshots for this revision are recorded in `docs/progress.md`. The previous phase measurements describe the earlier version and should not be treated as new measurements.

References: [Geofabrik Somalia](https://download.geofabrik.de/africa/somalia.html), [OSM Simple 3D Buildings](https://wiki.openstreetmap.org/wiki/Simple_3D_buildings).
