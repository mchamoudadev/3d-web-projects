import type { FeatureCollection, Feature, Polygon } from "geojson";
export function oceanPolygon(coast: FeatureCollection): Feature<Polygon> {
  const parts = coast.features.flatMap((f) =>
    f.geometry.type === "LineString" && f.geometry.coordinates.length > 1
      ? [f.geometry.coordinates]
      : [],
  );
  const remaining = new Set(parts),
    chains: number[][][] = [];
  while (remaining.size) {
    const endKeys = new Set([...remaining].map((p) => p.at(-1)!.join(",")));
    let current =
      [...remaining].find((p) => !endKeys.has(p[0].join(","))) ??
      [...remaining][0];
    const points = [...current];
    remaining.delete(current);
    while (remaining.size) {
      const next = [...remaining].find(
        (p) => p[0].join(",") === current.at(-1)!.join(","),
      );
      if (!next) break;
      points.push(...next.slice(1));
      remaining.delete(next);
      current = next;
    }
    chains.push(points);
  }
  const closed = (ring: number[][]) =>
    ring[0].join(",") === ring.at(-1)!.join(",");
  const mainland = chains.filter((r) => !closed(r));
  if (mainland.length !== 1)
    throw new Error(
      "Expected one connected mainland coastline in the Mogadishu extract",
    );
  const points = mainland[0],
    start = points[0],
    end = points.at(-1)!;
  return {
    type: "Feature",
    properties: { source: "OpenStreetMap coastline" },
    geometry: {
      type: "Polygon",
      coordinates: [
        [
          ...points,
          [end[0] + 2, end[1] - 2],
          [start[0] + 2, start[1] - 2],
          start,
        ],
        ...chains.filter(closed),
      ],
    },
  };
}
