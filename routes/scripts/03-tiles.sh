#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p public/tiles data/raw/planetiler
coverage_bounds=$(node -p 'JSON.parse(require("fs").readFileSync("config/coverage.json")).bbox.join(",")')
docker run --rm -e JAVA_TOOL_OPTIONS=-Xmx3g -v "$PWD:/work" -w /work ghcr.io/onthegomap/planetiler:0.10.2 generate-custom --schema=/work/config/tiles.yml --output=/work/public/tiles/mogadishu.pmtiles --tmpdir=/work/data/raw/planetiler --bounds="$coverage_bounds" --minzoom=10 --maxzoom=15 --force
