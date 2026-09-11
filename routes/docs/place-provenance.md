# Curated place provenance

`data/landmarks.json` includes an `osm_id` and direct `osm_url` for each coordinate. The 37 entries comprise 20 landmarks and the 17 traditional Banaadir districts. Coordinates are node locations or polygon centroids from the downloaded OSM extract, not Google or a commercial geocoder.

`scripts/curate-landmarks.ts` records the hand-written canonical names and alias choices. It reads `data/raw/named.geojson`. To regenerate that source:

```sh
osmium tags-filter data/osrm/mogadishu.osm.pbf nwr/name -o data/raw/named.osm.pbf --overwrite
osmium export data/raw/named.osm.pbf -f geojson -u type_id -o data/raw/named.geojson --overwrite
npx tsx scripts/curate-landmarks.ts
npm run data:seed
```

## Outstanding geographic checks

- Abdiaziz Mosque: no named, confirmed feature was found in the extract or an OSM Nominatim query. It is intentionally not positioned at the district centroid. A confirmed OSM feature or surveyed coordinate is needed.
- SIMAD University: the mapped Institute of Modern Languages campus is used and identified in the description. This does not assert that all SIMAD campuses share that location.
- Kaxda: the revised coverage includes the district centroid and its routing network. A Liido-to-Kaxda route now succeeds.
- District labels initially use the nearest OSM district node; boundary-based classification will replace that approximation where complete OSM district polygons are present.
- Place centroids are not surveyed entrances. Landings use the OSRM road approach facing the destination footprint. They must not claim a verified door or enter a building.
- OSM tags are observations, not exact architectural dimensions. Heights without measurements are procedural estimates, and GLB placeholders are illustrative.

## Wider import revision

The city-core cutout was expanded to Greater Mogadishu. See `learning-revision.md` and `data/coverage-report.json`. Nearby identical-name map objects for KM4, Villa Somalia and Bakaara are consolidated in search while their original objects remain in the dump. Two distant locations named Kalkaal Hospital are retained as a disambiguation choice. The two named buildings near Hodan are approximately 20 m apart; the curated Waaberi site is about 2.7 km away. Source IDs and the descriptive correction are in `data/hospital-overrides.json`.

## Jamhuriya University, 2026-09-09

Promoted the existing OSM university record to a curated, labelled search destination: `jamhuriya-university`, replacing `osm-w1373512386` in the seeded database. Geometry comes from [OSM way 1373512386](https://www.openstreetmap.org/way/1373512386) in the local extract. The mapped polygon representative point remains 2.036274191227356 N, 45.30051282206849 E, near Banaadir Hospital. Added Hodan district and the Jamhuriya / Jamhuuriya / Jaamacadda Jamhuuriya / JUST aliases.

The [official university contact page](https://justportal.just.edu.so/studentPortal/views/contact.php) lists Digfer and Benadir campuses in Hodan. Its [2025 brochure](https://www.just.edu.so/assets/documents/Brochure-A5.pdf) labels three campuses. The local extract names this polygon as the university but does not identify a campus number or entrance. The app description states that limitation; no additional campus coordinates or new university model were invented. This is not a claim that the mapped point is the main campus.
