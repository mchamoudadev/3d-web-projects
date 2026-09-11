import type { Coordinate, DrivingRoute } from "./types";
import { inBounds } from "./geo";
export async function drivingRoute(
  origin: Coordinate,
  destination: Coordinate,
): Promise<DrivingRoute> {
  if (!inBounds(origin) || !inBounds(destination))
    throw new Error("This place is outside the available Mogadishu city core.");
  const coordinates = `${origin.join(",")};${destination.join(",")}`;
  const response = await fetch(
    `http://127.0.0.1:${process.env.OSRM_PORT ?? 5000}/route/v1/driving/${coordinates}?steps=true&overview=full&geometries=geojson&radiuses=350;350`,
    { signal: AbortSignal.timeout(5000) },
  ).catch(() => {
    throw new Error(
      "The local routing engine is unavailable. Start Docker Compose.",
    );
  });
  const result = await response.json();
  if (!response.ok || result.code !== "Ok" || !result.routes?.length)
    throw new Error(
      "No connected driving route was found. Choose another nearby starting point.",
    );
  if (result.routes[0].distance < 15)
    throw new Error(
      "You are already near this place. Choose another starting point.",
    );
  return result.routes[0];
}
