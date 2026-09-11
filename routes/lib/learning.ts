import { toWorld } from "./geo";
import { closestOnRoute, placeName, routeDirections } from "./directions";
import type { Direction, Language, RouteResult } from "./types";
export type TurnAnswer = "left" | "right" | "straight" | "uturn" | "roundabout";
export function turnAnswer(modifier: string, type = ""): TurnAnswer {
  if (type.includes("roundabout") || type.includes("rotary"))
    return "roundabout";
  if (modifier === "uturn") return "uturn";
  if (modifier.includes("left")) return "left";
  if (modifier.includes("right")) return "right";
  return "straight";
}
export const turnLabels: Record<Language, Record<TurnAnswer, string>> = {
  en: {
    left: "Turn left",
    right: "Turn right",
    straight: "Continue straight",
    uturn: "Make a U-turn",
    roundabout: "Use the roundabout",
  },
  so: {
    left: "Bidix u leexo",
    right: "Midig u leexo",
    straight: "Hore u soco",
    uturn: "Dib u laabo",
    roundabout: "Wareegga mar",
  },
};
export function learningSteps(result: RouteResult, language: Language) {
  const steps = result.route.legs.flatMap((l) => l.steps),
    directions = routeDirections(result.route, result.places, language);
  return directions.flatMap((direction, index) => {
    const step = steps[index];
    if (["depart", "arrive", "notification"].includes(step.maneuver.type))
      return [];
    return [
      {
        ...direction,
        index,
        road: step.name,
        type: step.maneuver.type,
        answer: turnAnswer(direction.modifier, step.maneuver.type),
        exit: step.maneuver.exit,
        bearing: step.maneuver.bearing_before,
      },
    ];
  });
}
export function landmarkCue(
  direction: Direction & { bearing: number },
  language: Language,
) {
  if (!direction.place) return null;
  const origin = toWorld(direction.location),
    target = toWorld([direction.place.lng, direction.place.lat]),
    dx = target[0] - origin[0],
    dz = target[1] - origin[1];
  const theta = (direction.bearing * Math.PI) / 180,
    cross = Math.sin(theta) * dz + Math.cos(theta) * dx;
  const name = placeName(direction.place, language),
    metres = Math.round(Math.hypot(dx, dz) / 5) * 5;
  const side =
    Math.abs(cross) < 12
      ? language === "so"
        ? "agagaarka isgoyska"
        : "near the junction"
      : cross > 0
        ? language === "so"
          ? "dhinaca midig"
          : "on your right"
        : language === "so"
          ? "dhinaca bidix"
          : "on your left";
  return `${name} · ${side} · ${metres} m`;
}
export function routeLandmarks(result: RouteResult) {
  return result.places
    .filter(
      (p) =>
        p.category !== "district" &&
        p.id !== result.origin?.id &&
        p.id !== result.destination.id,
    )
    .map((place) => ({
      place,
      ...closestOnRoute(
        [place.lng, place.lat],
        result.route.geometry.coordinates,
      ),
    }))
    .filter((p) => p.distance < 200 && p.progress > 0.03 && p.progress < 0.97)
    .sort((a, b) => a.progress - b.progress);
}
