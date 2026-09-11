"use client";
import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { useProgress } from "@/store/progress";
export default function ScrollEngine() {
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncPreference = () =>
      useProgress.setState({ reducedMotion: media.matches });
    syncPreference();
    media.addEventListener("change", syncPreference);
    const lenis = new Lenis({
      lerp: 0.085,
      smoothWheel: true,
      syncTouch: false,
    });
    lenis.on("scroll", ScrollTrigger.update);
    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    const playhead = { progress: 0 };
    const animation = gsap.to(playhead, {
      progress: 1,
      ease: "none",
      scrollTrigger: {
        trigger: "#story-scroll",
        start: "top top",
        end: "bottom bottom",
        scrub: true,
      },
      onUpdate: () =>
        useProgress
          .getState()
          .setProgress(
            playhead.progress,
            media.matches ? 0 : lenis.velocity / 80,
          ),
    });
    const pointer = (event: PointerEvent) =>
      useProgress.setState({
        pointer: {
          x: (event.clientX / window.innerWidth - 0.5) * 2,
          y: (event.clientY / window.innerHeight - 0.5) * 2,
        },
      });
    const resetPointer = () =>
      useProgress.setState({ pointer: { x: 0, y: 0 } });
    window.addEventListener("pointermove", pointer);
    document.addEventListener("pointerleave", resetPointer);
    ScrollTrigger.refresh();
    return () => {
      animation.scrollTrigger?.kill();
      animation.kill();
      gsap.ticker.remove(tick);
      lenis.destroy();
      media.removeEventListener("change", syncPreference);
      window.removeEventListener("pointermove", pointer);
      document.removeEventListener("pointerleave", resetPointer);
    };
  }, []);
  return null;
}
