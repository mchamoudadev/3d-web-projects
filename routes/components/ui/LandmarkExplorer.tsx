"use client";
import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, ArrowUpRight, Camera, X } from "lucide-react";
import Image from "next/image";
import { landmarks } from "@/config/landmarks";
import { landmarkMedia } from "@/config/landmark-media";
import { placeName } from "@/lib/directions";
import type { Language, Place } from "@/lib/types";
import type { MapHandle } from "@/components/Map";
import LandmarkPhoto from "./LandmarkPhoto";

export default function LandmarkExplorer({ handle, language, onRoute }: {
  handle: MapHandle | null;
  language: Language;
  onRoute: (place: Place) => void;
}) {
  const [open, setOpen] = useState(false), [place, setPlace] = useState<Place | null>(null);
  const so = language === "so";
  useEffect(() => {
    document.documentElement.dataset.landmarkBrowse = String(open);
    return () => { delete document.documentElement.dataset.landmarkBrowse; };
  }, [open]);
  const focus = useCallback((p: Place) => {
    setOpen(true);
    setPlace(p);
    const zoom = p.id === "cathedral" ? 19 : p.id === "daljirka" ? 18.7 : p.id === "liido-beach" ? 17.6 : 18.1;
    handle?.map.flyTo({ center: [p.lng, p.lat], zoom, pitch: 64, bearing: 0, roll: 0,
      padding: { top: 0, right: innerWidth > 1100 ? 320 : 0, bottom: 0, left: 0 },
      duration: matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 1500 });
  }, [handle]);
  useEffect(() => {
    const photos = () => { setOpen(true); setPlace(null); };
    const selected = (event: Event) => focus((event as CustomEvent<Place>).detail);
    window.addEventListener("muqdisho:photos", photos);
    window.addEventListener("muqdisho:place", selected);
    return () => {
      window.removeEventListener("muqdisho:photos", photos);
      window.removeEventListener("muqdisho:place", selected);
      handle?.map.setPadding({ top: 0, right: 0, bottom: 0, left: 0 });
    };
  }, [handle, focus]);
  return open ? (
    <section className="reference-card panel" aria-label={so ? "Baro astaamaha magaalada" : "Explore landmarks"}>
      <div className="lesson-heading">
        <span className="eyebrow"><Camera size={13} />{so ? "BARO ASTAAMAHA" : "KNOW THE LANDMARKS"}</span>
        <button className="icon-button" aria-label={so ? "Xir sawirrada" : "Close landmark photos"} onClick={() => {
          setOpen(false);
          handle?.map.setPadding({ top: 0, right: 0, bottom: 0, left: 0 });
        }}><X size={16} /></button>
      </div>
      {place ? <>
        <button className="reference-back text-link" onClick={() => setPlace(null)}><ArrowLeft size={13} />{so ? "Sawirrada oo dhan" : "All landmark photos"}</button>
        <h2>{placeName(place, language)}</h2>
        <p className="reference-district">{place.district}</p>
        <LandmarkPhoto placeId={place.id} language={language} />
        <p>{landmarkMedia[place.id]?.cue[language] ?? place.description}</p>
        {!landmarkMedia[place.id] && <p>{so ? "Weli sawir la xaqiijiyay ma hayno." : "A verified reference photo is not available yet."}</p>}
        <small className="reference-model-note">{so ? "Qaabka 3D waa qiyaas." : "The 3D model is an approximation."}</small>
        <button className="reference-route" onClick={() => onRoute(place)}>{so ? "Baro jidka KM4 ka yimaada" : "Learn the route from KM4"}<ArrowUpRight size={15} /></button>
      </> : <>
        <h2>{so ? "Markaad aragto, garo." : "Know it when you see it."}</h2>
        <p>{so ? "Dooro sawir si aad goobtiisa khariidadda uga aragto." : "Choose a real photograph to find its place on the map."}</p>
        <div className="reference-list">{landmarks.filter(p => landmarkMedia[p.id]).map(p => <button key={p.id} onClick={() => focus(p)}>
          <Image src={landmarkMedia[p.id].src} alt="" width={72} height={62} unoptimized />
          <span><strong>{placeName(p, language)}</strong><small>{p.district} · {landmarkMedia[p.id].date.slice(0, 4)}</small></span><ArrowUpRight size={15} />
        </button>)}</div>
        <small className="reference-model-note">{so ? "4 sawir oo tixraac ah. Magaaladu way isbeddeli kartaa." : "4 dated references. The city changes over time."}</small>
      </>}
    </section>
  ) : null;
}
