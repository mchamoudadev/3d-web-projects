"use client";
import dynamic from "next/dynamic";
import Link from "next/link";
import ScrollEngine from "./ScrollEngine";
import Gauge from "./ui/Gauge";
import PinnedText from "./ui/PinnedText";
import { useProgress } from "@/store/progress";
const World = dynamic(() => import("./World"), { ssr: false });
export default function Experience() {
  const ready = useProgress((s) => s.ready);
  return (
    <main>
      <ScrollEngine />
      <div className={`world ${ready ? "is-ready" : ""}`}>
        <World />
      </div>
      <div className="atmosphere" aria-hidden="true" />
      <header className="masthead">
        <Link className="wordmark" href="/" aria-label="9 Bar home">
          9 bar<span>®</span>
        </Link>
        <div className="masthead-caption">
          THE ART OF
          <br />A SINGLE SHOT
        </div>
      </header>
      <div className="edition">
        AN INTERACTIVE COFFEE STORY<span>EST. IN THE MOMENT</span>
      </div>
      <PinnedText />
      <div className="bottom-note">
        <span className="small-rule" />
        <span>
          GOOD THINGS TAKE
          <br />
          <span className="note-italic">a little pressure.</span>
        </span>
      </div>
      <Gauge />
      <div className="origin-note">18 GRAMS · 93 DEGREES · 9 BARS</div>
      {!ready && (
        <div className="loading-screen" role="status">
          <span className="loading-mark">9 bar</span>
          <p>TAKING YOUR SEAT</p>
          <span className="loading-line" />
        </div>
      )}
      <div
        id="story-scroll"
        aria-label="Scroll to explore the espresso story"
      />
    </main>
  );
}
