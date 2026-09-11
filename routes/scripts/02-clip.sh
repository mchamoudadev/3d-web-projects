#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
command -v osmium >/dev/null || { echo 'Install osmium-tool: brew install osmium-tool (macOS) or apt install osmium-tool (Linux)'; exit 1; }
mkdir -p data/osrm
# Keep every OSM object and tag in the coverage area, with complete ways.
coverage_bounds=$(node -p 'JSON.parse(require("fs").readFileSync("config/coverage.json")).bbox.join(",")')
osmium extract --bbox "$coverage_bounds" --strategy complete_ways data/raw/somalia-latest.osm.pbf -o data/osrm/mogadishu.osm.pbf --overwrite
osmium fileinfo data/osrm/mogadishu.osm.pbf
