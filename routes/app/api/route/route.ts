import { z } from "zod";
import { getPlace, allPlaces } from "@/lib/places";
import { drivingRoute } from "@/lib/osrm";
import { routeDirections } from "@/lib/directions";
const schema = z.object({
  originId: z.string().nullable(),
  destinationId: z.string(),
  center: z.tuple([z.number(), z.number()]),
  language: z.enum(["so", "en"]),
});
export async function POST(request: Request) {
  let input;
  try {
    input = schema.parse(await request.json());
  } catch {
    return Response.json({ error: "Invalid route request." }, { status: 400 });
  }
  try {
    const [origin, destination, places] = await Promise.all([
      input.originId ? getPlace(input.originId) : Promise.resolve(null),
      getPlace(input.destinationId),
      allPlaces(),
    ]);
    if (!destination || (input.originId && !origin))
      return Response.json(
        { error: "That place no longer exists. Search again." },
        { status: 404 },
      );
    const route = await drivingRoute(
      origin ? [origin.lng, origin.lat] : input.center,
      [destination.lng, destination.lat],
    );
    return Response.json({
      route,
      directions: routeDirections(route, places, input.language),
      origin,
      destination,
      places,
      language: input.language,
    });
  } catch (e) {
    return Response.json(
      {
        error: e instanceof Error ? e.message : "Could not calculate a route.",
      },
      { status: 503 },
    );
  }
}
