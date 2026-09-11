#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
image=ghcr.io/project-osrm/osrm-backend@sha256:8a1b1bc938412f15f9b5b32d794c4ec6bf4a85dfbbabfa0a014b70b187edb53b
docker run --rm -v "$PWD/data/osrm:/data" "$image" osrm-extract -t 4 -p /opt/car.lua /data/mogadishu.osm.pbf
docker run --rm -v "$PWD/data/osrm:/data" "$image" osrm-partition -t 4 /data/mogadishu.osrm
docker run --rm -v "$PWD/data/osrm:/data" "$image" osrm-customize -t 4 /data/mogadishu.osrm
