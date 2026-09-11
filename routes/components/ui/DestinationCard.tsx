import { MapPin, RotateCcw, ArrowUpRight } from "lucide-react";
import type { Language, Place } from "@/lib/types";
import { categories, placeName } from "@/lib/directions";
import { Button } from "./button";
import LandmarkPhoto from "./LandmarkPhoto";
export default function DestinationCard({
  place,
  language,
  onReplay,
  onReset,
  onExplore,
  onDrive,
}: {
  place: Place;
  language: Language;
  onReplay: () => void;
  onReset: () => void;
  onExplore?: () => void;
  onDrive?: () => void;
}) {
  const so = language === "so";
  return (
    <section className="destination-card panel">
      <span className="eyebrow">
        <MapPin size={12} />
        {so ? "WAAD TIMID" : "YOU HAVE ARRIVED"}
      </span>
      <h2>{placeName(place, language)}</h2>
      <p className="destination-meta">
        {categories[language][place.category]} · {place.district}
      </p>
      <p>{place.description}</p>
      <LandmarkPhoto placeId={place.id} language={language} />
      <div className="destination-actions">
        <Button onClick={onReplay}>
          <RotateCcw size={15} />
          {so ? "Mar kale duul" : "Fly again"}
        </Button>
        {onExplore && (
          <Button variant="outline" onClick={onExplore}>
            {so ? "Hareeraha eeg" : "Look around"}
            <ArrowUpRight size={15} />
          </Button>
        )}
        {onDrive && (
          <Button variant="outline" onClick={onDrive}>
            {so ? "Jidka heerka dhulka ka daawo" : "Street-level replay"}
          </Button>
        )}
      </div>
      {onDrive && (
        <p className="replay-explanation">
          {so
            ? "Si toos ah u daawo jidka adigoo heerka waddada jooga. Waad joojin kartaa oo ku celin kartaa."
            : "Follow the route automatically from road level. Pause or replay to learn each turn."}
        </p>
      )}
      <button className="text-link" onClick={onReset}>
        {so ? "Safar cusub bilow" : "Start a new journey"}
      </button>
    </section>
  );
}
