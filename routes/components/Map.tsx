"use client";
import { useEffect, useRef } from "react";
import * as maplibregl from "maplibre-gl";
import { type Map as MLMap, type StyleSpecification } from "maplibre-gl";
import { Protocol } from "pmtiles";
import style from "@/config/style.json";
import { landmarks } from "@/config/landmarks";
import { CityLayer } from "./city/CityLayer";
import { BOUNDS } from "@/lib/geo";
export interface MapHandle {
  map: MLMap;
  world: CityLayer;
}
declare global {
  interface Window {
    __muqdisho?: MapHandle;
  }
}
export default function MapView({
  onReady,
  onError,
}: {
  onReady?: (handle: MapHandle) => void;
  onError?: (message: string) => void;
}) {
  const container = useRef<HTMLDivElement>(null);
  const callbacks = useRef({ onReady, onError });
  useEffect(() => {
    callbacks.current = { onReady, onError };
  }, [onReady, onError]);
  useEffect(() => {
    maplibregl.setWorkerUrl("/vendor/maplibre-gl-worker.mjs");
    maplibregl.setWorkerCount(2);
    const protocol = new Protocol();
    maplibregl.addProtocol("pmtiles", protocol.tilev4);
    const map = new maplibregl.Map({
      container: container.current!,
      style: style as StyleSpecification,
      center: [45.34, 2.034],
      zoom: 15.8,
      pitch: 60,
      bearing: 20,
      maxPitch: 110,
      minZoom: 13,
      maxZoom: 24,
      attributionControl: false,
      canvasContextAttributes: { antialias: true },
      maxBounds: [
        [BOUNDS[0], BOUNDS[1]],
        [BOUNDS[2], BOUNDS[3]],
      ],
    });
    const world = new CityLayer();
    map.setVerticalFieldOfView(60);
    if (process.env.NODE_ENV === "development")
      window.__muqdisho = { map, world };
    map.addControl(
      new maplibregl.AttributionControl({
        compact: false,
        customAttribution:
          '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap contributors</a>',
      }),
      "bottom-right",
    );
    map.on("error", (e) => {
      callbacks.current.onError?.(e.error.message);
      console.error("Map:", e.error.message);
    });
    map.on("load", async () => {
      map.addSource("city", {
        type: "vector",
        url: `pmtiles://${location.origin}/tiles/mogadishu.pmtiles`,
        maxzoom: 15,
      });
      map.addLayer(world);
      for (const p of landmarks) {
        const label = document.createElement("button");
        label.className = "world-label";
        label.textContent = p.name;
        label.dataset.placeId = p.id;
        label.type = "button";
        label.addEventListener("click", () =>
          window.dispatchEvent(
            new CustomEvent("muqdisho:place", { detail: p }),
          ),
        );
        label.setAttribute("aria-label", p.name);
        new maplibregl.Marker({ element: label, anchor: "bottom" })
          .setLngLat([p.lng, p.lat])
          .addTo(map);
      }
      callbacks.current.onReady?.({ map, world });
    });
    return () => {
      map.remove();
      maplibregl.removeProtocol("pmtiles");
    };
  }, []);
  return (
    <div
      ref={container}
      className="map-canvas"
      aria-label="3D map of Mogadishu"
    />
  );
}
