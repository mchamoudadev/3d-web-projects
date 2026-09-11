"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { LngLat, Marker } from "maplibre-gl";
import { Pause, Play, RotateCcw } from "lucide-react";
import { Vector3 } from "three";
import type { MapHandle } from "./Map";
import { JourneyPlan, type CameraPose } from "@/lib/camera";
import { CameraTransition } from "@/lib/transition";
import { clamp, toLngLat, toWorld } from "@/lib/geo";
import { RouteVisual } from "./RouteLayer";
import { placeName, categories, routeDirections } from "@/lib/directions";
import type { RouteResult, Language, Place, Coordinate } from "@/lib/types";
export interface JourneyFrame {
  time: number;
  duration: number;
  paused: boolean;
  speed: number;
  pose: CameraPose;
  reviewing?: boolean;
}
function currentPose(handle: MapHandle): CameraPose {
  const position = handle.world.camera.position.clone(),
    gaze = handle.world.camera.getWorldDirection(new Vector3());
  return {
    position,
    lookAt: position.clone().add(gaze.multiplyScalar(100)),
    roll: handle.map.getRoll(),
    progress: 0,
    beat: "takeoff",
    passing: null,
  };
}
export class JourneyController {
  language: Language;
  time = 0;
  paused = false;
  speed = 1;
  suspended = false;
  private frame = 0;
  private last = 0;
  private lastUi = 0;
  private visual: RouteVisual;
  private disposed = false;
  private transition: CameraTransition | null = null;
  private transitionTime = 0;
  private label: Marker;
  private labelElement: HTMLDivElement;
  private reviewPlace: Place | null = null;
  private reviewPose: CameraPose | null = null;
  private reviewJunction: { location: Coordinate; index: number } | null = null;
  constructor(
    private handle: MapHandle,
    public plan: JourneyPlan,
    private onFrame: (frame: JourneyFrame) => void,
    startAtEnd = false,
    continuous = false,
  ) {
    this.language = plan.result.language;
    this.visual = new RouteVisual(handle.world.scene, plan.result);
    this.labelElement = document.createElement("div");
    this.labelElement.className = "passing-label";
    this.label = new Marker({ element: this.labelElement, anchor: "bottom" })
      .setLngLat([0, 0])
      .addTo(handle.map);
    this.labelElement.hidden = true;
    this.time = startAtEnd ? plan.duration : 0;
    if (plan.drive || startAtEnd || continuous)
      this.transition = new CameraTransition(
        currentPose(handle),
        plan.sample(this.time),
      );
    this.last = performance.now();
    this.render();
    this.frame = requestAnimationFrame(this.tick);
  }
  private tick = (now: number) => {
    const dt = Math.min(0.08, (now - this.last) / 1000);
    this.last = now;
    if (!this.paused && !this.suspended) {
      if (this.transition) {
        this.transitionTime += dt;
        if (this.transitionTime >= this.transition.duration) {
          this.transition = null;
          this.transitionTime = 0;
        }
        this.render(now);
      } else if (this.time < this.plan.duration) {
        this.time = clamp(this.time + dt * this.speed, 0, this.plan.duration);
        this.render(now);
      }
    }
    if (!this.disposed) this.frame = requestAnimationFrame(this.tick);
  };
  private render(now = performance.now()) {
    const pose =
        this.reviewPose ??
        (this.transition
          ? this.transition.sample(this.transitionTime)
          : this.plan.sample(this.time)),
      map = this.handle.map;
    const gaze = pose.lookAt.clone().sub(pose.position);
    const target = pose.position
      .clone()
      .add(gaze.multiplyScalar(pose.position.y / Math.max(0.001, -gaze.y)));
    target.y = 0;
    map.jumpTo({
      ...map.calculateCameraOptionsFromTo(
        LngLat.convert(toLngLat(pose.position.x, pose.position.z)),
        pose.position.y,
        LngLat.convert(toLngLat(target.x, target.z)),
        0,
      ),
      roll: pose.roll,
    });
    this.visual.reveal(
      this.reviewPose
        ? pose.progress
        : this.plan.drive
          ? 1
          : pose.progress === 0
            ? 0
            : Math.min(1, pose.progress + 0.15),
    );
    this.visual.setDrive(this.plan.drive || !!this.reviewPose);
    const place =
      this.reviewPlace ??
      (pose.beat === "landing" || pose.beat === "arrived"
        ? this.plan.result.destination
        : pose.passing?.place);
    if (this.reviewJunction) {
      const { location, index } = this.reviewJunction;
      this.visual.focus(...location);
      this.labelElement.textContent = `${this.language === "so" ? "Isgoyska" : "Junction"} ${index + 1}`;
      this.labelElement.hidden = false;
      this.label.setLngLat(location);
    } else if (place) {
      this.visual.focus(place.lng, place.lat);
      this.labelElement.textContent = placeName(place, this.language);
      this.labelElement.hidden = place.id === this.plan.result.destination.id;
      this.label.setLngLat([place.lng, place.lat]);
    } else {
      this.visual.clearFocus();
      this.labelElement.hidden = true;
    }
    if (now - this.lastUi > 70 || this.time === this.plan.duration) {
      this.lastUi = now;
      this.onFrame({
        time: this.time,
        duration: this.plan.duration,
        paused: this.paused,
        speed: this.speed,
        pose,
        reviewing: !!this.reviewPose,
      });
    }
  }
  seek(time: number) {
    this.reviewPose = null;
    this.reviewJunction = null;
    this.reviewPlace = null;
    this.transition = null;
    this.lastUi = 0;
    this.time = clamp(time, 0, this.plan.duration);
    this.render();
  }
  toggle() {
    if (this.reviewPose) return;
    this.reviewPlace = null;
    this.paused = !this.paused;
    this.lastUi = 0;
    this.render();
  }
  setSpeed() {
    this.speed = this.speed === 1 ? 2 : 1;
    this.lastUi = 0;
    this.render();
  }
  setLanguage(language: Language) {
    this.language = language;
    this.lastUi = 0;
    this.render();
  }
  review(
    progress: number,
    place?: Place,
    location?: Coordinate,
    bearing = 0,
    index = 0,
  ) {
    let low = 0,
      high = this.plan.duration;
    for (let i = 0; i < 30; i++) {
      const mid = (low + high) / 2;
      if (this.plan.routeProgress(mid) < progress) low = mid;
      else high = mid;
    }
    this.paused = true;
    this.seek((low + high) / 2);
    this.reviewPlace = place ?? null;
    if (location) {
      const [x, z] = toWorld(location),
        heading = (bearing * Math.PI) / 180;
      this.reviewPose = {
        position: new Vector3(
          x - Math.sin(heading) * 110,
          90,
          z + Math.cos(heading) * 110,
        ),
        lookAt: new Vector3(x, 0, z),
        roll: 0,
        progress,
        beat: "cruise",
        passing: null,
      };
      this.reviewJunction = { location, index };
      void this.handle.world.prepare(location);
    }
    this.lastUi = 0;
    this.render();
  }
  resume() {
    if (this.reviewPose) {
      this.transition = new CameraTransition(
        currentPose(this.handle),
        this.plan.sample(this.time),
      );
      this.transitionTime = 0;
    }
    this.reviewPose = null;
    this.reviewJunction = null;
    this.reviewPlace = null;
    this.paused = false;
    this.lastUi = 0;
    this.render();
  }
  replay() {
    this.reviewPose = null;
    this.reviewJunction = null;
    this.reviewPlace = null;
    this.transition = new CameraTransition(
      currentPose(this.handle),
      this.plan.sample(0),
    );
    this.transitionTime = 0;
    this.time = 0;
    this.paused = false;
    this.lastUi = 0;
    this.render();
  }
  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.frame);
    this.visual.dispose();
    this.label.remove();
  }
}
export default function Journey({
  handle,
  result,
  onFrame,
  drive = false,
  startAtEnd = false,
  continuous = false,
  language = result.language,
}: {
  handle: MapHandle;
  result: RouteResult;
  onFrame: (frame: JourneyFrame) => void;
  drive?: boolean;
  startAtEnd?: boolean;
  continuous?: boolean;
  language?: Language;
}) {
  const plan = useMemo(() => new JourneyPlan(result, drive), [result, drive]);
  const controller = useRef<JourneyController | null>(null);
  const [frame, setFrame] = useState<JourneyFrame>(() => ({
    time: 0,
    duration: plan.duration,
    paused: false,
    speed: 1,
    pose: plan.sample(0),
  }));
  const starting = useRef({ startAtEnd, continuous });
  useEffect(() => {
    starting.current = { startAtEnd, continuous };
  }, [startAtEnd, continuous]);
  const callback = useRef(onFrame);
  useEffect(() => {
    callback.current = onFrame;
  }, [onFrame]);
  useEffect(() => {
    const c = new JourneyController(
      handle,
      plan,
      (f) => {
        setFrame(f);
        callback.current(f);
      },
      starting.current.startAtEnd,
      starting.current.continuous,
    );
    controller.current = c;
    const keys = (e: KeyboardEvent) => {
      if (
        e.code === "Space" &&
        !(
          e.target instanceof HTMLElement &&
          e.target.closest(
            "button, input, textarea, select, a, [contenteditable]",
          )
        )
      ) {
        e.preventDefault();
        c.toggle();
      }
    };
    const replay = () => c.replay();
    const review = (event: Event) => {
      const { progress, place, location, bearing, index } = (
        event as CustomEvent<{
          progress: number;
          place?: Place;
          location?: Coordinate;
          bearing?: number;
          index?: number;
        }>
      ).detail;
      if (Number.isFinite(progress))
        c.review(clamp(progress, 0, 1), place, location, bearing, index);
    };
    const resume = () => c.resume();
    window.addEventListener("keydown", keys);
    window.addEventListener("muqdisho:replay", replay);
    window.addEventListener("muqdisho:review", review);
    window.addEventListener("muqdisho:resume", resume);
    return () => {
      window.removeEventListener("keydown", keys);
      window.removeEventListener("muqdisho:replay", replay);
      window.removeEventListener("muqdisho:review", review);
      window.removeEventListener("muqdisho:resume", resume);
      c.dispose();
    };
  }, [handle, plan]);
  useEffect(() => {
    controller.current?.setLanguage(language);
  }, [language]);
  const so = language === "so",
    beats = {
      takeoff: so ? "Duulid" : "Taking off",
      cruise: drive
        ? so
          ? "Wadista"
          : "Street-level replay · automatic"
        : so
          ? "Safarka"
          : "Along the way",
      landing: so ? "Degid" : "Coming in",
      arrived: so ? "Waad timid" : "You have arrived",
    };
  const current = routeDirections(result.route, result.places, language).reduce(
    (best, d) => (d.progress <= frame.pose.progress ? d : best),
    result.directions[0],
  );
  return (
    <>
      <div className="journey-caption" aria-live="polite">
        <span>
          {frame.pose.passing
            ? categories[language][frame.pose.passing.place.category]
            : beats[frame.pose.beat]}
        </span>
        <h2>
          {drive
            ? current.text
            : frame.pose.passing
              ? placeName(frame.pose.passing.place, language)
              : frame.pose.beat === "takeoff"
                ? result.origin
                  ? placeName(result.origin, language)
                  : so
                    ? "Halka aad ka bilaabayso"
                    : "Your starting point"
                : frame.pose.beat === "landing" || frame.pose.beat === "arrived"
                  ? placeName(result.destination, language)
                  : ""}
        </h2>
      </div>
      <div className="timeline panel">
        <button
          className="icon-button"
          title={so ? "Ku celi" : "Replay"}
          aria-label="Replay journey"
          disabled={frame.reviewing}
          onClick={() => controller.current?.replay()}
        >
          <RotateCcw size={16} />
        </button>
        <button
          className="play-button"
          disabled={frame.reviewing}
          aria-label={frame.paused ? "Play journey" : "Pause journey"}
          onClick={() => controller.current?.toggle()}
        >
          {frame.paused ? <Play size={17} /> : <Pause size={17} />}
        </button>
        <div className="timeline-track">
          <div className="timeline-label">
            <span>{beats[frame.pose.beat]}</span>
            <span>
              {Math.round(frame.time).toString().padStart(2, "0")} /{" "}
              {Math.round(frame.duration)} s
            </span>
          </div>
          <input
            aria-label="Journey progress"
            disabled={frame.reviewing}
            type="range"
            min="0"
            max={plan.duration}
            step="0.01"
            value={frame.time}
            onChange={(e) => controller.current?.seek(Number(e.target.value))}
          />
        </div>
        <button
          className="speed-button"
          aria-label="Change playback speed"
          onClick={() => controller.current?.setSpeed()}
        >
          {frame.speed}×
        </button>
      </div>
    </>
  );
}
