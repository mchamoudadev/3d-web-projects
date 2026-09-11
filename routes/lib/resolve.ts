import { searchPlaces, needsChoice, nearestPlace } from "./places";
import type { Intent } from "./nlu";
import type { Coordinate, Place } from "./types";
export interface Resolution {
  origin: Place | null;
  destination: Place | null;
  originChoices: Place[];
  destinationChoices: Place[];
  useMapCenter: boolean;
}
export async function resolveIntent(
  intent: Intent,
  center: Coordinate,
): Promise<Resolution> {
  if (intent.confidence < 0.4)
    return {
      origin: null,
      destination: null,
      originChoices: [],
      destinationChoices: [],
      useMapCenter: !intent.origin,
    };
  const nearest = /nearest|ugu dhow|iigu dhow|meesha.*dhow/i.test(
    intent.destination,
  );
  const category = /hospital|isbitaa|isbitaalka|isbital/i.test(
    intent.destination,
  )
    ? "hospital"
    : /mosque|masjid/i.test(intent.destination)
      ? "mosque"
      : /beach|xeeb/i.test(intent.destination)
        ? "beach"
        : null;
  const origins = intent.origin ? await searchPlaces(intent.origin) : [];
  const reference =
    intent.origin && !needsChoice(origins)
      ? ([origins[0].lng, origins[0].lat] as Coordinate)
      : center;
  const destinations =
    nearest && category
      ? await nearestPlace(category, reference).then((p) =>
          p ? [{ ...p, score: 1 }] : [],
        )
      : await searchPlaces(intent.destination);
  return {
    origin: intent.origin && !needsChoice(origins) ? origins[0] : null,
    destination: !needsChoice(destinations) ? destinations[0] : null,
    originChoices: intent.origin && needsChoice(origins) ? origins : [],
    destinationChoices: needsChoice(destinations) ? destinations : [],
    useMapCenter: !intent.origin,
  };
}
