"use client";
import { useEffect } from "react";
import { Marker } from "maplibre-gl";
import { Mesh, MeshBasicMaterial, RingGeometry } from "three";
import { placeName } from "@/lib/directions";
import { toWorld } from "@/lib/geo";
import type { Place, Language } from "@/lib/types";
import type { MapHandle } from "./Map";

/** A destination is independent of the temporary passing-landmark label. */
export default function DestinationMarker({ handle, place, language }: {
  handle: MapHandle;
  place: Place;
  language: Language;
}) {
  useEffect(() => {
    const element = document.createElement("div");
    element.className = "destination-map-marker";
    element.dataset.placeId = place.id;
    element.dataset.lng = String(place.lng);
    element.dataset.lat = String(place.lat);
    const name = placeName(place, language), title = language === "so" ? "HALKA AAD U SOCOTO" : "DESTINATION";
    element.setAttribute("role", "img");
    element.setAttribute("aria-label", `${title}: ${name}`);
    const tag = document.createElement("div");
    tag.className = "destination-map-tag";
    const caption = document.createElement("small"), label = document.createElement("strong");
    caption.textContent = title;
    label.textContent = name;
    tag.append(caption, label);
    const pin = document.createElement("span");
    pin.className = "destination-map-pin";
    pin.textContent = "B";
    const stem = document.createElement("span");
    stem.className = "destination-map-stem";
    element.append(tag, pin, stem);
    const marker = new Marker({ element, anchor: "bottom", subpixelPositioning: true })
      .setLngLat([place.lng, place.lat]).addTo(handle.map);
    const ring = new Mesh(new RingGeometry(8, 10, 48), new MeshBasicMaterial({
      color: "#b8f0cd", transparent: true, opacity: 0.9, depthTest: false, depthWrite: false,
    }));
    const [x, z] = toWorld([place.lng, place.lat]);
    ring.name = "destination-ring";
    // At eye height the perspective flattens a ground ring into a bright bar.
    // Let the upright pin carry the destination marker at street level.
    ring.onBeforeRender = (_renderer, _scene, camera) => {
      ring.material.opacity = Math.min(0.9, Math.max(0, (camera.position.y - 3) / 20));
    };
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(x, 0.5, z);
    ring.renderOrder = 24;
    handle.world.scene.add(ring);
    handle.map.triggerRepaint();
    return () => {
      marker.remove();
      ring.removeFromParent();
      ring.geometry.dispose();
      ring.material.dispose();
    };
  }, [handle, place, language]);
  return null;
}
