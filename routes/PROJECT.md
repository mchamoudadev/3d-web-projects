# Muqdisho 3D routes

## How it was made

Built with Next.js App Router, TypeScript, React, MapLibre, Three.js, PMTiles, Postgres/Drizzle and OSRM. Scripts download and clip OpenStreetMap Somalia data, generate tiles and a car-routing graph, export places and seed search records. The custom renderer builds city geometry from real map features, with procedural buildings, traffic and schematic landmarks.

Somali and English input is interpreted by a server-only OpenRouter request, then resolved against local places. OSRM supplies the driving route. Camera flight, junction learning, street replay, walking controls and landmark photographs build on that route. Fonts, map data, photos and browser workers are served locally; autocomplete makes no model request.

Buildings and schematic landmarks are approximations where OSM has no detail. Place provenance, attribution, route-learning revisions and performance limits are documented under docs/. A fully local search/map stack still needs a seeded database and OSRM graph; free-text intent needs your own provider key. Original laptop Docker volumes are not portable assets.

## Setup and resources

- [Configuration and requirements](CONFIGURATION.md)
- [Assets and reference material](RESOURCES.md)
- [Original implementation README](README.md)

This folder is independently installable. No API calls or paid media generation are required by the collection setup itself.
