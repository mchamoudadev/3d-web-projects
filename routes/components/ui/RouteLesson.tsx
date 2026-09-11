import { useState } from "react";
import { ArrowLeft, ArrowRight, Check, MapPin, X } from "lucide-react";
import {
  landmarkCue,
  turnLabels,
  type learningSteps,
  type TurnAnswer,
} from "@/lib/learning";
import type { Language } from "@/lib/types";
import LandmarkPhoto from "./LandmarkPhoto";
type Lesson = ReturnType<typeof learningSteps>[number];
export default function RouteLesson({
  step,
  index,
  total,
  language,
  onSelect,
  onClose,
}: {
  step: Lesson;
  index: number;
  total: number;
  language: Language;
  onSelect: (index: number) => void;
  onClose: () => void;
}) {
  const [answer, setAnswer] = useState<TurnAnswer | null>(null),
    [revealed, setRevealed] = useState(false),
    so = language === "so",
    correct = answer === step.answer,
    cue = landmarkCue(step, language);
  const choices: TurnAnswer[] =
    step.answer === "roundabout"
      ? ["left", "right", "roundabout"]
      : step.answer === "uturn"
        ? ["left", "uturn", "right"]
        : ["left", "straight", "right"];
  return (
    <section
      className="route-lesson panel"
      aria-label={so ? "Baro leexashada" : "Learn this turn"}
    >
      <div className="lesson-heading">
        <span className="eyebrow">
          {so ? "BARO LEEXASHADA" : "LEARN THE TURN"} {index + 1} / {total}
        </span>
        <button
          className="icon-button"
          aria-label="Close route lesson"
          onClick={onClose}
        >
          <X size={16} />
        </button>
      </div>
      <h2>{so ? "Xaggee ayaad u leexanaysaa?" : "Which way next?"}</h2>
      <p>
        {so
          ? "Ka fiirso isgoyska. Dooro jihada aad u soconayso."
          : "Look at the junction. Choose the next direction."}
      </p>
      {cue && (
        <div className="lesson-landmark">
          <MapPin size={16} />
          <span>{cue}</span>
        </div>
      )}
      {step.road && (
        <p className="lesson-road">
          {so ? "Waddada" : "Road"}: {step.road}
        </p>
      )}
      {step.place && <LandmarkPhoto placeId={step.place.id} language={language} />}
      <div className="lesson-answers">
        {choices.map((choice) => (
          <button
            key={choice}
            className={
              answer === choice ? (correct ? "correct" : "incorrect") : ""
            }
            onClick={() => setAnswer(choice)}
          >
            {turnLabels[language][choice]}
          </button>
        ))}
      </div>
      <div className="lesson-feedback" aria-live="polite">
        {correct || revealed ? (
          <>
            <Check size={16} />
            <span>{step.text}</span>
          </>
        ) : answer ? (
          <span>
            {so
              ? "Mar kale eeg isgoyska. Isku day mar kale."
              : "Look at the junction again. Try another direction."}
          </span>
        ) : (
          <span>
            {so
              ? "Safarku wuu joogsaday si aad u barato."
              : "The journey is paused while you study."}
          </span>
        )}
      </div>
      {!(correct || revealed) && (
        <button className="text-link" onClick={() => setRevealed(true)}>
          {so ? "Jawaabta tus" : "Show the answer"}
        </button>
      )}
      <div className="lesson-navigation">
        <button disabled={index === 0} onClick={() => onSelect(index - 1)}>
          <ArrowLeft size={14} />
          {so ? "Hore" : "Previous"}
        </button>
        <button
          onClick={() => (index + 1 < total ? onSelect(index + 1) : onClose())}
        >
          {index + 1 < total
            ? so
              ? "Isgoyska xiga"
              : "Next junction"
            : so
              ? "Dhammee"
              : "Finish review"}
          <ArrowRight size={14} />
        </button>
      </div>
    </section>
  );
}
