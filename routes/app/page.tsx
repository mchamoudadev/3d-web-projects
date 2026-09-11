"use client";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowUpRight, Camera, Compass } from "lucide-react";
import LandmarkExplorer from "@/components/ui/LandmarkExplorer";
import type { MapHandle } from "@/components/Map";
import AskBar from "@/components/ui/AskBar";
import DirectionsPanel from "@/components/ui/DirectionsPanel";
import DestinationCard from "@/components/ui/DestinationCard";
import Disambiguate from "@/components/ui/Disambiguate";
import StreetMode from "@/components/StreetMode";
import DestinationMarker from "@/components/DestinationMarker";
import CityDebug from "@/components/city/CityDebug";
import Journey, { type JourneyFrame } from "@/components/Journey";
import type { Language, Place, RouteResult, Coordinate } from "@/lib/types";
import type { Resolution } from "@/lib/resolve";
import { placeName } from "@/lib/directions";
import type { SelectedPlaces } from "@/lib/autocomplete";
const MapView = dynamic(() => import("@/components/Map"), { ssr: false });
type Stage =
  | "idle"
  | "understanding"
  | "resolving"
  | "routing"
  | "choosing"
  | "journey"
  | "error";
async function post(path: string, body: unknown, signal: AbortSignal) {
  const response = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal,
  });
  const data = await response.json();
  if (!response.ok)
    throw new Error(data.error ?? "Something went wrong. Please try again.");
  return data;
}
export default function Home() {
  const [handle, setHandle] = useState<MapHandle | null>(null),
    [language, setLanguage] = useState<Language>("en"),
    [text, setText] = useState(""),
    [stage, setStage] = useState<Stage>("idle"),
    [error, setError] = useState(""),
    [result, setResult] = useState<RouteResult | null>(null),
    [resolution, setResolution] = useState<Resolution | null>(null),
    [frame, setFrame] = useState<JourneyFrame | null>(null),
    [mode, setMode] = useState<"flight" | "drive" | "walk">("flight"),
    [returning, setReturning] = useState(false);
  const [previewDestination, setPreviewDestination] = useState<Place | null>(null);
  const request = useRef<AbortController | null>(null),
    originCenter = useRef<Coordinate>([45.34, 2.04]);
  const ready = useCallback((h: MapHandle) => setHandle(h), []);
  const mapError = useCallback((message: string) => setError(message), []);
  const reset = useCallback(() => {
    request.current?.abort();
    setResult(null);
    setResolution(null);
    setFrame(null);
    setText("");
    setError("");
    setStage("idle");
    setMode("flight");
    setReturning(false);
    setPreviewDestination(null);
    handle?.map.flyTo({
      center: [45.34, 2.034],
      zoom: 15.8,
      pitch: 60,
      bearing: 20,
      roll: 0,
      padding: { top: 0, right: 0, bottom: 0, left: 0 },
      duration: 1800,
    });
  }, [handle]);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") reset();
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [reset]);
  useEffect(() => {
    if (
      !handle ||
      stage !== "idle" ||
      matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;
    let raf = 0;
    const start = performance.now();
    const move = (now: number) => {
      if (!handle.map.isMoving() && document.documentElement.dataset.landmarkBrowse !== "true")
        handle.map.setBearing(20 + Math.sin((now - start) / 35000) * 5);
      raf = requestAnimationFrame(move);
    };
    raf = requestAnimationFrame(move);
    return () => cancelAnimationFrame(raf);
  }, [handle, stage]);
  const route = async (
    res: Resolution,
    lang: Language,
    signal: AbortSignal,
  ) => {
    if (!res.destination || (!res.useMapCenter && !res.origin)) {
      setResolution(res);
      setStage("choosing");
      return;
    }
    setStage("routing");
    const data = await post(
      "/api/route",
      {
        originId: res.origin?.id ?? null,
        destinationId: res.destination.id,
        center: originCenter.current,
        language: lang,
      },
      signal,
    );
    if (signal.aborted) return;
    handle?.world.prefetch(data.route.geometry.coordinates);
    await Promise.all([
      handle?.world.prepare(data.route.geometry.coordinates[0]),
      handle?.world.prepare(data.route.geometry.coordinates.at(-1)),
    ]);
    if (signal.aborted) return;
    data.cameraRoute = handle?.world.safeRoute(data.route.geometry.coordinates);
    setMode("flight");
    setReturning(false);
    setResult(data);
    setFrame(null);
    setStage("journey");
  };
  const submit = async (value = text, selected: SelectedPlaces = {}) => {
    if (!handle || value.trim().length < 2) return;
    request.current?.abort();
    const abort = new AbortController();
    request.current = abort;
    originCenter.current = handle.map.getCenter().toArray() as Coordinate;
    setText(value);
    setResult(null);
    setFrame(null);
    setError("");
    setResolution(null);
    setStage("understanding");
    try {
      const intent = await post(
        "/api/understand",
        { text: value },
        abort.signal,
      );
      if (intent.confidence < 0.4)
        throw new Error(
          language === "so"
            ? "Fadlan qor meesha aad rabto inaad tagto."
            : "Please name the place you want to visit.",
        );
      setLanguage(intent.language);
      setStage("resolving");
      const res = await post(
        "/api/resolve",
        { intent, center: originCenter.current },
        abort.signal,
      );
      if (selected.origin) {
        res.origin = selected.origin;
        res.originChoices = [];
        res.useMapCenter = false;
      }
      if (selected.destination) {
        res.destination = selected.destination;
        res.destinationChoices = [];
      }
      await route(res, intent.language, abort.signal);
    } catch (e) {
      if (!abort.signal.aborted) {
        setError(
          e instanceof Error ? e.message : "Could not plan the journey.",
        );
        setStage("error");
      }
    }
  };
  const choosingOrigin =
    !!resolution && !resolution.useMapCenter && !resolution.origin;
  const choose = async (place: Place) => {
    if (!resolution) return;
    const res = {
      ...resolution,
      ...(choosingOrigin
        ? { origin: place, originChoices: [] }
        : { destination: place, destinationChoices: [] }),
    };
    setResolution(res);
    try {
      await route(res, language, request.current!.signal);
    } catch (e) {
      setError(String(e));
      setStage("error");
    }
  };
  const so = language === "so",
    loading = ["understanding", "resolving", "routing"].includes(stage)
      ? (
          {
            understanding: so ? "Faham" : "Understanding",
            resolving: so ? "Raadin" : "Resolving",
            routing: so ? "Jihayn" : "Routing",
          } as Record<string, string>
        )[stage]
      : null;
  return (
    <main
      className={
        stage === "journey"
          ? `journey-running ${mode === "walk" ? "street-exploring" : ""}`
          : ""
      }
    >
      <MapView onReady={ready} onError={mapError} />
      {handle && (result?.destination ?? previewDestination) && <DestinationMarker
        handle={handle} place={(result?.destination ?? previewDestination)!} language={language} />}
      {handle && process.env.NODE_ENV === "development" && (
        <CityDebug world={handle.world} />
      )}
      <div className="vignette" />
      <header>
        <div className="wordmark">
          Muqdisho <span>3D</span>
        </div>
        <div className="language-toggle" aria-label="Language">
          <button
            className={so ? "selected" : ""}
            onClick={() => setLanguage("so")}
          >
            SO
          </button>
          <span>/</span>
          <button
            className={!so ? "selected" : ""}
            onClick={() => setLanguage("en")}
          >
            EN
          </button>
        </div>
      </header>
      {stage === "idle" && (
        <section className="welcome">
          <div className="eyebrow">
            <Compass size={13} />
            {so ? "MUQDISHO, SOOMAALIYA" : "MOGADISHU, SOMALIA"}
          </div>
          <h1>
            {so ? (
              <>
                Baro magaaladaada.
                <br />
                <em>Xusuuso jidka.</em>
              </>
            ) : (
              <>
                Know the city.
                <br />
                <em>Remember the way.</em>
              </>
            )}
          </h1>
          <p>
            {so
              ? "Duul magaalada dusheeda. Baro jidkaaga."
              : "Learn the turns. Recognize the landmarks. Find your way."}
          </p>
          <div className="suggestions">
            <button
              onClick={() =>
                submit(
                  so
                    ? "Ka tag Liido ilaa Isbitaalka Banaadir"
                    : "I need to go to Banadir Hospital from Liido",
                )
              }
            >
              Liido <span>→</span>{" "}
              {so ? "Isbitaalka Banaadir" : "Banadir Hospital"}
              <ArrowUpRight size={14} />
            </button>
            <button
              onClick={() =>
                submit(
                  so
                    ? "Waxaan joogaa KM4, waxaan rabaa inaan tago Suuqa Bakaaraha"
                    : "Take me to Bakaara Market from KM4",
                )
              }
            >
              KM4 <span>→</span> {so ? "Bakaaraha" : "Bakaara"}
              <ArrowUpRight size={14} />
            </button>
          </div>
          <button className="photo-explorer-button" onClick={() => window.dispatchEvent(new Event("muqdisho:photos"))}>
            <Camera size={16} />{so ? "Eeg sawirrada astaamaha" : "Explore landmark photos"}<ArrowUpRight size={14} />
          </button>
        </section>
      )}
      {stage === "idle" && <LandmarkExplorer handle={handle} language={language} onRoute={(place) => {
        handle?.map.setPadding({ top: 0, right: 0, bottom: 0, left: 0 });
        submit(so ? `Ka tag KM4 ilaa ${placeName(place, language)}` : `Take me to ${place.name} from KM4`);
      }} />}
      <AskBar
        text={text}
        setText={setText}
        onSubmit={(selected) => submit(text, selected)}
        onDestinationSelect={setPreviewDestination}
        language={language}
        loading={
          loading ?? (!handle ? (so ? "Magaalada" : "Loading city") : null)
        }
        active={stage !== "idle"}
      />
      {error && (
        <div className="error-card panel" role="alert">
          <strong>
            {so ? "Aan mar kale isku dayno" : "Let’s try that again"}
          </strong>
          <p>{error}</p>
          <button className="text-link" onClick={reset}>
            {so ? "Dib u bilow" : "Start over"}
          </button>
        </div>
      )}
      {stage === "choosing" && resolution && (
        <Disambiguate
          choices={
            choosingOrigin
              ? resolution.originChoices
              : resolution.destinationChoices
          }
          role={choosingOrigin ? "origin" : "destination"}
          language={language}
          onChoose={choose}
        />
      )}
      {result && handle && (
        <>
          <DirectionsPanel
            key={result.destination.id + result.origin?.id}
            result={result}
            language={language}
            progress={frame?.pose.progress ?? 0}
            onReset={reset}
            canReview={mode !== "walk"}
          />
          {mode === "walk" ? (
            <StreetMode
              handle={handle}
              result={result}
              language={language}
              onReturn={() => {
                setReturning(true);
                setMode("flight");
              }}
            />
          ) : (
            <Journey
              result={result}
              handle={handle}
              language={language}
              onFrame={setFrame}
              drive={mode === "drive"}
              startAtEnd={returning}
              continuous={!!frame}
            />
          )}{" "}
          {mode !== "walk" && frame?.pose.beat === "arrived" && (
            <DestinationCard
              place={result.destination}
              language={language}
              onReplay={() => {
                if (mode !== "flight") {
                  setReturning(false);
                  setMode("flight");
                } else window.dispatchEvent(new Event("muqdisho:replay"));
              }}
              onExplore={() => {
                setReturning(false);
                setMode("walk");
              }}
              onDrive={() => {
                setReturning(false);
                setMode("drive");
              }}
              onReset={reset}
            />
          )}
        </>
      )}
    </main>
  );
}
