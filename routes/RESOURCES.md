# Muqdisho resources

- public/tiles/mogadishu.pmtiles: bundled map archive (about 22 MB); regenerate with the data pipeline.
- public/data: local coast, boundary and traffic data.
- public/photos and config/landmark-media.json: four landmark photographs with source, license and hash records. See docs/landmark-media.md for attribution.
- data/landmarks.json, data/osm-places.json, data/hospital-overrides.json and data/nlu-cases.json: curated/search inputs and intent test cases.
- config/coverage.json and config/tiles.yml: geographic bounds and Planetiler profile.
- scripts: reproducible download, clipping, tiles, routing, places, seed and verification pipeline.
- docs/BUILD-BRIEF.md, docs/learning-revision.md and docs/place-provenance.md: original brief, revision and known location uncertainty.

Raw Somalia extracts, intermediate GeoJSON, OSRM graphs, local database volumes, logs and browser captures are excluded. Follow CONFIGURATION.md to recreate them. npm postinstall rebuilds public/vendor workers from installed dependencies.

OpenStreetMap-derived geography is subject to ODbL; retain on-screen attribution and database-license notices. Source: https://www.openstreetmap.org/copyright . Somalia extracts: https://download.geofabrik.de/africa/somalia.html . Each photograph keeps its own license; this collection does not relicense third-party media.
