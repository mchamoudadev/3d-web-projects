import { MapPin, ArrowRight } from "lucide-react";
import type { Language, Place } from "@/lib/types";
import { placeName, categories } from "@/lib/directions";
export default function Disambiguate({
  choices,
  language,
  role,
  onChoose,
}: {
  choices: Place[];
  language: Language;
  role: "origin" | "destination";
  onChoose: (place: Place) => void;
}) {
  const so = language === "so";
  return (
    <section className="disambiguation panel">
      <span className="eyebrow">{so ? "AAN HUBINNO" : "LET’S MAKE SURE"}</span>
      <h2>
        {so
          ? "Goobtee ayaad ula jeeddaa?"
          : `Which ${role === "origin" ? "starting place" : "place"} do you mean?`}
      </h2>
      {choices.length ? (
        choices.slice(0, 4).map((p) => (
          <button key={p.id} onClick={() => onChoose(p)}>
            <MapPin size={17} />
            <span>
              <strong>{placeName(p, language)}</strong>
              <small>
                {categories[language][p.category]} ·{" "}
                {p.district || `${p.lat.toFixed(4)}, ${p.lng.toFixed(4)}`}
              </small>
            </span>
            <ArrowRight size={16} />
          </button>
        ))
      ) : (
        <p>
          {so
            ? "Goobta lama helin. Isku day magac kale."
            : "No matching place was found. Try a more specific name."}
        </p>
      )}
    </section>
  );
}
