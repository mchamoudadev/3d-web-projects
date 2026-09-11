"use client";
import { chapters } from "@/config/timeline";
import { useProgress } from "@/store/progress";

export default function PinnedText() {
  const progress = useProgress((state) => state.progress);
  const chapter = chapters.find((item) => progress >= item.start && progress < item.end) ?? chapters[chapters.length - 1];
  const local = (progress - chapter.start) / (chapter.end - chapter.start);
  const opacity = chapter.id === "hero" ? Math.min(1, (1 - local) / 0.22) : chapter.id === "landing" ? Math.min(1, local / 0.15) : Math.min(1, local / 0.12, (1 - local) / 0.12);

  return <>
    <div className="pointer-events-none fixed left-6 right-6 top-7 z-10 flex items-start justify-between md:left-12 md:right-12 md:top-10">
      <div className="font-serif text-[35px] leading-none tracking-[-3px] text-cream">9<span className="ml-1 text-[23px] italic tracking-[-1.8px]">bar</span><span className="ml-1 align-top font-mono text-[9px] tracking-normal text-brass">®</span></div>
      <p className="pt-1 text-right font-mono text-[10px] uppercase leading-[1.8] tracking-[0.18em] text-brass/75 md:text-[11px]">An exploration of<br />the everyday extraordinary</p>
    </div>
    <section className="scene-copy pointer-events-none fixed left-6 top-[17%] z-10 w-[86%] md:left-[7%] md:top-[30%] md:w-[36%]" style={{ opacity: Math.max(0, opacity) }} aria-label={chapter.label}>
      <p className="mb-5 flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.2em] text-brass md:mb-7 md:text-xs"><span className="inline-block h-px w-7 bg-brass/60" />{chapter.label}</p>
      {chapter.id === "hero" ? <>
        <p className="mb-3 font-serif text-xl font-light tracking-[-0.02em] text-cream/75 md:mb-4 md:text-[26px]">Nine bars. Twenty-five seconds.</p>
        <h1 className="editorial max-w-[560px] font-serif text-[clamp(3.3rem,6.6vw,7rem)] font-light leading-[0.99] tracking-[-0.065em]">Everything<br />in <em className="font-light text-brass">between.</em></h1>
      </> : <>
        <h2 className="editorial max-w-[550px] font-serif text-[clamp(2.7rem,5.3vw,5.5rem)] font-light leading-[1.04] tracking-[-0.055em]">{chapter.title}</h2>
        <p className="mt-6 max-w-[310px] font-serif text-lg font-light leading-relaxed text-cream/60">{chapter.copy}</p>
      </>}
    </section>
    <div className="pointer-events-none fixed bottom-9 left-6 z-10 font-mono text-[10px] uppercase leading-6 tracking-[0.13em] text-cream/40 md:bottom-12 md:left-12 md:text-[11px]">
      <p className="text-brass/80">Form. Function. Ritual.</p>
      <p>A study in the perfect shot</p>
    </div>
  </>;
}
