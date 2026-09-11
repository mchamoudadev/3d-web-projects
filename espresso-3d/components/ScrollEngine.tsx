"use client";

import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { useProgress } from "@/store/progress";

gsap.registerPlugin(ScrollTrigger);

export default function ScrollEngine() {
  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncPreference = () => useProgress.getState().setReducedMotion(preference.matches);
    syncPreference();
    preference.addEventListener("change", syncPreference);

    const lenis = new Lenis({ lerp: 0.085, smoothWheel: !preference.matches, syncTouch: false });
    lenis.on("scroll", ScrollTrigger.update);
    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    const clock = { progress: 0 };
    const animation = gsap.to(clock, {
      progress: 1, ease: "none",
      scrollTrigger: {
        trigger: "#scroll-story", start: "top top", end: "bottom bottom", scrub: true,
        invalidateOnRefresh: true,
        onUpdate: (trigger) => useProgress.getState().setScroll(trigger.progress, trigger.getVelocity()),
      },
    });
    const move = (event: PointerEvent) => useProgress.getState().setCursor(
      (event.clientX / window.innerWidth) * 2 - 1,
      (event.clientY / window.innerHeight) * 2 - 1,
    );
    const resetCursor = () => useProgress.getState().setCursor(0, 0);
    // Route keyboard navigation through Lenis so an in-flight wheel gesture
    // cannot pull the page away from the Home or End destination.
    const keydown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (target.isContentEditable || /INPUT|TEXTAREA|SELECT|BUTTON/.test(target.tagName) || event.metaKey || event.ctrlKey || event.altKey) return;
      const steps: Record<string, number> = { ArrowDown: 100, ArrowUp: -100, PageDown: window.innerHeight * 0.85, PageUp: -window.innerHeight * 0.85, " ": window.innerHeight * (event.shiftKey ? -0.85 : 0.85) };
      if (event.key === "Home" || event.key === "End") {
        event.preventDefault();
        lenis.scrollTo(event.key === "Home" ? 0 : lenis.limit, { immediate: true });
      } else if (event.key in steps) {
        event.preventDefault();
        lenis.scrollTo(lenis.targetScroll + steps[event.key], { immediate: preference.matches });
      }
    };
    window.addEventListener("keydown", keydown);
    window.addEventListener("pointermove", move, { passive: true });
    document.documentElement.addEventListener("pointerleave", resetCursor);
    const stopVelocity = () => { if (!lenis.isScrolling) useProgress.getState().setScroll(useProgress.getState().progress, 0); };
    const interval = window.setInterval(stopVelocity, 120);
    ScrollTrigger.refresh();

    return () => {
      window.clearInterval(interval);
      animation.scrollTrigger?.kill(); animation.kill();
      gsap.ticker.remove(tick); lenis.destroy();
      preference.removeEventListener("change", syncPreference);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("keydown", keydown);
      document.documentElement.removeEventListener("pointerleave", resetCursor);
    };
  }, []);
  return <div id="scroll-story" className="relative h-[1200vh]" aria-hidden="true" />;
}
