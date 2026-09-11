import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowUp, CornerUpLeft, CornerUpRight, MapPin, X } from "lucide-react";
import type { RouteResult, Language } from "@/lib/types";
import { placeName, routeDirections } from "@/lib/directions";
import { learningSteps, routeLandmarks } from "@/lib/learning";
import RouteOverview from "./RouteOverview";
import RouteLesson from "./RouteLesson";
export default function DirectionsPanel({
  result,
  progress,
  onReset,
  language = result.language,
  canReview = true,
}: {
  result: RouteResult;
  progress: number;
  onReset: () => void;
  language?: Language;
  canReview?: boolean;
}) {
  const list = useRef<HTMLOListElement>(null);
  const so = language === "so";
  const directions = useMemo(
    () => routeDirections(result.route, result.places, language),
    [result, language],
  );
  const checkpoints = useMemo(
    () => learningSteps(result, language),
    [result, language],
  );
  const landmarks = useMemo(
    () =>
      routeLandmarks(result)
        .filter(
          (p) =>
            p.place.source === "manual" ||
            ["hospital", "mosque", "market"].includes(p.place.category),
        )
        .slice(0, 8),
    [result],
  );
  const [selectedLesson, setSelectedLesson] = useState<{
    result: RouteResult;
    index: number;
  } | null>(null);
  const lesson =
    selectedLesson?.result === result ? selectedLesson.index : null;
  const review = (index: number) => {
    if (!canReview || !checkpoints[index]) return;
    setSelectedLesson({ result, index });
    const step = checkpoints[index];
    window.dispatchEvent(
      new CustomEvent("muqdisho:review", {
        detail: {
          progress: step.progress,
          place: step.place,
          location: step.location,
          bearing: step.bearing,
          index,
        },
      }),
    );
  };
  const closeLesson = () => {
    setSelectedLesson(null);
    window.dispatchEvent(new Event("muqdisho:resume"));
  };
  let active = 0;
  directions.forEach((d, i) => {
    if (d.progress <= progress) active = i;
  });
  useEffect(() => {
    const element = list.current?.children[active] as HTMLElement | undefined;
    if (element && list.current)
      list.current.scrollTo({
        top: element.offsetTop - list.current.offsetTop - 30,
        behavior: "smooth",
      });
  }, [active]);
  return (
    <>
      <aside className="directions panel">
        <div className="directions-heading">
          <span className="eyebrow">
            {so ? "BARO JIDKAAGA" : "LEARN YOUR ROUTE"}
          </span>
          <button
            aria-label="Start over"
            className="icon-button"
            onClick={onReset}
          >
            <X size={17} />
          </button>
        </div>
        <RouteOverview
          coordinates={result.route.geometry.coordinates}
          progress={progress}
          checkpoints={checkpoints}
          onSelect={review}
        />
        {!!checkpoints.length && canReview && (
          <button
            className="learn-route-button"
            onClick={() => (lesson === null ? review(0) : closeLesson())}
          >
            {lesson === null
              ? so
                ? "Baro leexashooyinka"
                : "Learn the turns"
              : so
                ? "Safarka sii wad"
                : "Continue journey"}
            <span>
              {checkpoints.length} {so ? "isgoys" : "junctions"}
            </span>
          </button>
        )}
        <h2>{placeName(result.destination, language)}</h2>
        <div className="route-stats">
          <span>
            {(result.route.distance / 1000).toFixed(1)} <small>km</small>
          </span>
          <span>
            {Math.round(result.route.duration / 60)}{" "}
            <small>{so ? "daqiiqo" : "min drive"}</small>
          </span>
        </div>
        <div className="origin-note">
          <MapPin size={13} />
          <span>
            {result.origin
              ? placeName(result.origin, language)
              : so
                ? "Bilowga: bartamaha khariidadda"
                : "Starting from the map centre"}
          </span>
        </div>
        {lesson === null && (
          <ol ref={list} className="steps">
            {directions.map((d, i) => {
              const Icon = d.modifier.includes("left")
                ? CornerUpLeft
                : d.modifier.includes("right")
                  ? CornerUpRight
                  : ArrowUp;
              return (
                <li
                  key={i}
                  className={
                    i === active ? "current" : i < active ? "passed" : ""
                  }
                >
                  <button
                    className="step-review"
                    disabled={!canReview}
                    aria-label={`${so ? "Dib u eeg" : "Review"}: ${d.text}`}
                    onClick={() => {
                      const index = checkpoints.findIndex((s) => s.index === i);
                      if (index >= 0) review(index);
                      else
                        window.dispatchEvent(
                          new CustomEvent("muqdisho:review", {
                            detail: { progress: d.progress, place: d.place },
                          }),
                        );
                    }}
                  >
                    <div className="step-dot">
                      <Icon size={15} />
                    </div>
                    <div>
                      <p>{d.text}</p>
                      <small>{Math.round(d.distance)} m</small>
                    </div>
                  </button>
                </li>
              );
            })}
          </ol>
        )}
        {lesson !== null && (
          <div className="route-memory">
            <span className="eyebrow">
              {so ? "GOOBAHA JIDKA" : "LANDMARKS ALONG THE WAY"}
            </span>
            {landmarks.map(({ place, progress: at }) => (
              <div key={place.id}>
                <MapPin size={12} />
                <span>{placeName(place, language)}</span>
                <small>
                  {((at * result.route.distance) / 1000).toFixed(1)} km
                </small>
              </div>
            ))}
            {!landmarks.length && (
              <p>
                {so
                  ? "Isticmaal qaabka isgoysyada si aad u xasuusato jidka."
                  : "Use the junction shapes to remember this route."}
              </p>
            )}
          </div>
        )}
        <div className="directions-footer">
          {so
            ? "Waddooyinka dhabta ah. Aragti cusub."
            : "Select a turn to pause and study it."}
        </div>
      </aside>
      {lesson !== null && canReview && checkpoints[lesson] && (
        <RouteLesson
          key={`${result.destination.id}-${lesson}`}
          step={checkpoints[lesson]}
          index={lesson}
          total={checkpoints.length}
          language={language}
          onSelect={review}
          onClose={closeLesson}
        />
      )}
    </>
  );
}
