import { distance, segmentDistance, toWorld } from "./geo";
import type {
  Coordinate,
  Direction,
  DrivingRoute,
  Language,
  Place,
} from "./types";
export const categories: Record<Language, Record<string, string>> = {
  en: {
    school: "School",
    restaurant: "Restaurant",
    fuel: "Fuel station",
    shop: "Shop",
    hospital: "Hospital",
    clinic: "Clinic",
    market: "Market",
    mosque: "Mosque",
    government: "Government",
    hotel: "Hotel",
    university: "University",
    district: "District",
    landmark: "Landmark",
    airport: "Airport",
    beach: "Beach",
  },
  so: {
    school: "Dugsi",
    restaurant: "Maqaayad",
    fuel: "Kaalin shidaal",
    shop: "Dukaan",
    hospital: "Isbitaal",
    clinic: "Rug caafimaad",
    market: "Suuq",
    mosque: "Masaajid",
    government: "Dowlad",
    hotel: "Huteel",
    university: "Jaamacad",
    district: "Degmo",
    landmark: "Goob caan ah",
    airport: "Garoon diyaaradeed",
    beach: "Xeeb",
  },
};
export const placeName = (p: Place, language: Language) =>
  language === "so" ? (p.name_so ?? p.name) : p.name;
export function closestOnRoute(
  location: Coordinate,
  coordinates: Coordinate[],
) {
  const world = coordinates.map(toWorld),
    p = toWorld(location);
  let min = Infinity,
    along = 0,
    cumulative = 0;
  const length = world
    .slice(1)
    .reduce(
      (s, p, i) => s + Math.hypot(p[0] - world[i][0], p[1] - world[i][1]),
      0,
    );
  for (let i = 1; i < world.length; i++) {
    const a = world[i - 1],
      b = world[i],
      segment = Math.hypot(b[0] - a[0], b[1] - a[1]),
      hit = segmentDistance(p, a, b);
    if (hit.distance < min) {
      min = hit.distance;
      along = cumulative + hit.t * segment;
    }
    cumulative += segment;
  }
  return { distance: min, progress: length ? along / length : 0 };
}
export function routeDirections(
  route: DrivingRoute,
  places: Place[],
  language: Language,
): Direction[] {
  let traveled = 0;
  return route.legs
    .flatMap((l) => l.steps)
    .map((step) => {
      const nearby = places
        .filter(
          (p) =>
            p.category !== "district" &&
            distance(step.maneuver.location, [p.lng, p.lat]) <= 150,
        )
        .sort(
          (a, b) =>
            Number(b.source === "manual") - Number(a.source === "manual") ||
            distance(step.maneuver.location, [a.lng, a.lat]) -
              distance(step.maneuver.location, [b.lng, b.lat]),
        )[0];
      const modifier = step.maneuver.modifier ?? "straight",
        left = modifier.includes("left"),
        right = modifier.includes("right"),
        arrive = step.maneuver.type === "arrive",
        depart = step.maneuver.type === "depart",
        round = step.maneuver.type.includes("roundabout");
      const instruction =
        language === "so"
          ? arrive
            ? "Waxaad timid"
            : depart
              ? "Ka bilow"
              : round
                ? `Ka bax wareegga, bixitaanka ${step.maneuver.exit ?? 1}`
                : left
                  ? "Bidix u leexo"
                  : right
                    ? "Midig u leexo"
                    : "Hore u soco"
          : arrive
            ? "You have arrived"
            : depart
              ? "Set off"
              : round
                ? `Take exit ${step.maneuver.exit ?? 1} at the roundabout`
                : left
                  ? "Turn left"
                  : right
                    ? "Turn right"
                    : "Continue";
      const reference = nearby
        ? language === "so"
          ? ` agagaarka ${placeName(nearby, language)}`
          : ` ${arrive ? "at" : depart ? "from" : "near"} ${placeName(nearby, language)}`
        : step.name
          ? language === "so"
            ? ` dhanka ${step.name}`
            : ` on ${step.name}`
          : arrive
            ? ""
            : ` ${Math.max(10, Math.round(step.distance / 10) * 10)} m`;
      const direction = {
        text: instruction + reference,
        location: step.maneuver.location,
        distance: step.distance,
        modifier,
        progress: traveled / Math.max(route.distance, 1),
        place: nearby,
      };
      traveled += step.distance;
      return direction;
    });
}
