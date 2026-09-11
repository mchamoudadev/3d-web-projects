"use client";
import { useEffect, useRef, useState } from "react";
import { LngLat } from "maplibre-gl";
import { Vector3 } from "three";
import { ArrowUpRight, Footprints, X } from "lucide-react";
import { clamp, toLngLat } from "@/lib/geo";
import type { MapHandle } from "./Map";
import type { Language, Place } from "@/lib/types";
import { categories, placeName } from "@/lib/directions";
import { RouteVisual } from "./RouteLayer";
import type { RouteResult } from "@/lib/types";
import LandmarkPhoto from "./ui/LandmarkPhoto";
export default function StreetMode({
  handle,
  result,
  language,
  onReturn,
}: {
  handle: MapHandle;
  result: RouteResult;
  language: Language;
  onReturn: () => void;
}) {
  const [place, setPlace] = useState<Place | null>(null),
    [altitude, setAltitude] = useState(1.6);
  const returnRef = useRef(onReturn);
  useEffect(() => {
    returnRef.current = onReturn;
  }, [onReturn]);
  useEffect(() => {
    const { map, world } = handle,
      canvas = map.getCanvas(),
      position = world.camera.position.clone(),
      direction = world.camera.getWorldDirection(new Vector3());
    let yaw = Math.atan2(direction.x, -direction.z),
      pitch = Math.asin(direction.y),
      height = position.y,
      targetHeight = position.y,
      raf = 0,
      last = performance.now(),
      walked = 0,
      ui = 0;
    const keys = new Set<string>(),
      controls = [
        map.dragPan,
        map.dragRotate,
        map.scrollZoom,
        map.doubleClickZoom,
        map.keyboard,
        map.touchZoomRotate,
      ];
    const enabled = controls.map((c) => c.isEnabled());
    controls.forEach((c) => c.disable());
    const visual = new RouteVisual(world.scene, result);
    visual.setDrive(true);
    visual.reveal(1);
    const down = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (
        [
          "KeyW",
          "KeyA",
          "KeyS",
          "KeyD",
          "ArrowUp",
          "ArrowDown",
          "ArrowLeft",
          "ArrowRight",
          "ShiftLeft",
        ].includes(e.code)
      ) {
        e.preventDefault();
        keys.add(e.code);
      }
    };
    const up = (e: KeyboardEvent) => keys.delete(e.code);
    const blur = () => keys.clear();
    const mouse = (e: PointerEvent) => {
      if (e.buttons === 1) {
        yaw += e.movementX * 0.003;
        pitch = clamp(pitch - e.movementY * 0.002, -1.1, -0.025);
      }
    };
    const wheel = (e: WheelEvent) => {
      e.preventDefault();
      targetHeight = clamp(targetHeight - e.deltaY * 0.045, 1.6, 80);
    };
    const selected = (e: Event) => setPlace((e as CustomEvent<Place>).detail);
    canvas.addEventListener("pointermove", mouse);
    canvas.addEventListener("wheel", wheel, { passive: false });
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", blur);
    window.addEventListener("muqdisho:place", selected);
    const tick = (now: number) => {
      const dt = Math.min(0.04, (now - last) / 1000);
      last = now;
      const forward =
          Number(keys.has("KeyW") || keys.has("ArrowUp")) -
          Number(keys.has("KeyS") || keys.has("ArrowDown")),
        side =
          Number(keys.has("KeyD") || keys.has("ArrowRight")) -
          Number(keys.has("KeyA") || keys.has("ArrowLeft")),
        length = Math.hypot(forward, side) || 1,
        speed = keys.has("ShiftLeft") ? 3.2 : 1.55;
      const dx =
          ((Math.sin(yaw) * forward + Math.cos(yaw) * side) / length) *
          speed *
          dt,
        dz =
          ((-Math.cos(yaw) * forward + Math.sin(yaw) * side) / length) *
          speed *
          dt;
      // Sweep in small steps so even a slow frame cannot tunnel through a wall.
      const steps = Math.max(1, Math.ceil(Math.hypot(dx, dz) / 0.15));
      let moved = 0;
      for (let i = 0; i < steps; i++) {
        const x = position.x + dx / steps,
          z = position.z + dz / steps;
        if (world.canWalk(x, z)) {
          position.x = x;
          position.z = z;
          moved += Math.hypot(dx, dz) / steps;
        } else if (world.canWalk(x, position.z)) {
          position.x = x;
          moved += Math.abs(dx) / steps;
        } else if (world.canWalk(position.x, z)) {
          position.z = z;
          moved += Math.abs(dz) / steps;
        }
      }
      walked += moved;
      height += (targetHeight - height) * (1 - Math.exp(-dt * 5));
      position.y = height + (height < 2.5 ? Math.sin(walked * 7) * 0.022 : 0);
      const ahead = position.y / Math.tan(-Math.min(-0.025, pitch)),
        look = position
          .clone()
          .add(
            new Vector3(
              Math.sin(yaw) * ahead,
              -position.y,
              -Math.cos(yaw) * ahead,
            ),
          );
      look.y = 0;
      map.jumpTo({
        ...map.calculateCameraOptionsFromTo(
          LngLat.convert(toLngLat(position.x, position.z)),
          position.y,
          LngLat.convert(toLngLat(look.x, look.z)),
          look.y,
        ),
        roll: 0,
      });
      if (now - ui > 300) {
        setAltitude(height);
        ui = now;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      visual.dispose();
      canvas.removeEventListener("pointermove", mouse);
      canvas.removeEventListener("wheel", wheel);
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", blur);
      window.removeEventListener("muqdisho:place", selected);
      controls.forEach((c, i) => {
        if (enabled[i]) c.enable();
      });
    };
  }, [handle, result]);
  const so = language === "so";
  return (
    <>
      <div className="street-controls panel">
        <div className="street-mode-title">
          <Footprints size={17} />
          <span>{so ? "Hareeraha eeg" : "Look around"}</span>
          <small>{altitude.toFixed(1)} m</small>
        </div>
        <p>
          {so
            ? "WASD ama fallaaraha ku soco. Jiid si aad u eegto. Rog si aad kor ugu kacdo."
            : "WASD to walk · Drag to look · Scroll to rise"}
        </p>
        <button onClick={() => returnRef.current()}>
          {so ? "Ku noqo safarka" : "Return to route"}
          <ArrowUpRight size={14} />
        </button>
      </div>
      {place && (
        <div className="landmark-card panel">
          <button
            className="icon-button"
            aria-label="Close place"
            onClick={() => setPlace(null)}
          >
            <X size={15} />
          </button>
          <span className="eyebrow">
            {categories[language][place.category]}
          </span>
          <h2>{placeName(place, language)}</h2>
          <p>{place.district}</p>
          <p>{place.description}</p>
          <LandmarkPhoto placeId={place.id} language={language} />
        </div>
      )}
    </>
  );
}
