import type { FillExtrusionLayerSpecification } from "maplibre-gl";
export function buildingHeight(
  tags: Record<string, unknown>,
  area: number,
  arterial = false,
) {
  const height = parseFloat(String(tags.height ?? "")),
    levels = parseFloat(String(tags.levels ?? tags["building:levels"] ?? ""));
  if (height > 0) return Math.min(height, 120);
  if (levels > 0) return Math.min(levels * 3.5, 100);
  return (area < 100 ? 3.5 : area < 350 ? 7 : 10.5) + (arterial ? 3.5 : 0);
}
export const buildingsLayer: FillExtrusionLayerSpecification = {
  id: "buildings",
  type: "fill-extrusion",
  source: "city",
  "source-layer": "building",
  minzoom: 13,
  paint: {
    "fill-extrusion-color": [
      "interpolate",
      ["linear"],
      ["get", "area"],
      20,
      "#6a6153",
      200,
      "#716654",
      700,
      "#8f7c62",
    ],
    "fill-extrusion-height": [
      "case",
      [">", ["to-number", ["get", "height"], 0], 0],
      ["to-number", ["get", "height"]],
      [">", ["to-number", ["get", "levels"], 0], 0],
      ["*", ["to-number", ["get", "levels"]], 3.5],
      ["step", ["get", "area"], 3.5, 100, 7, 350, 10.5],
    ],
    "fill-extrusion-opacity": 1,
    "fill-extrusion-vertical-gradient": true,
  },
};
