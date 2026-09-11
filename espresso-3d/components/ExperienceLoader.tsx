"use client";
import dynamic from "next/dynamic";

const Experience = dynamic(() => import("./Experience"), {
  ssr: false,
  loading: () => <div className="fixed inset-0 grid place-items-center bg-espresso font-mono text-xs tracking-[0.25em] text-brass" role="status">PREPARING THE RITUAL</div>,
});

export default function ExperienceLoader() { return <Experience />; }
