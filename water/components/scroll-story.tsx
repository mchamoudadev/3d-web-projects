'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { ArrowDown, ArrowUpRight } from 'lucide-react';
import { FrameCache } from '@/lib/frame-cache';
import {
  clamp,
  copyOpacity,
  framePath,
  scenes,
  storyPosition,
  totalScrollVh,
  type MediaManifest,
} from '@/lib/story';

export default function ScrollStory() {
  const root = useRef<HTMLElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ index: 0, local: 0 });
  const [manifest, setManifest] = useState<MediaManifest | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [imageReady, setImageReady] = useState(false);
  const cache = useRef<FrameCache | null>(null);
  const current = scenes[position.index];

  useEffect(() => {
    cache.current = new FrameCache();
    const controller = new AbortController();
    fetch('/frames/manifest.json', { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error('Manifest unavailable');
        return response.json();
      })
      .then((data) => {
        const parsed = data as MediaManifest;
        if (parsed.version === 1 && Array.isArray(parsed.scenes))
          setManifest(parsed);
      })
      .catch(() => {
        /* The storyboard remains readable if media is unavailable. */
      });
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const small = window.matchMedia('(max-width: 760px)');
    const sync = () => {
      setReducedMotion(motion.matches);
      setMobile(small.matches);
    };
    sync();
    motion.addEventListener('change', sync);
    small.addEventListener('change', sync);
    return () => {
      controller.abort();
      cache.current?.dispose();
      motion.removeEventListener('change', sync);
      small.removeEventListener('change', sync);
    };
  }, []);

  useEffect(() => {
    let raf = 0;
    const sync = () => {
      raf = 0;
      if (!root.current) return;
      const rect = root.current.getBoundingClientRect();
      setPosition(
        storyPosition(
          clamp(
            -rect.top /
              Math.max(
                1,
                rect.height -
                  (stage.current?.clientHeight || window.innerHeight),
              ),
          ),
        ),
      );
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(sync);
    };
    sync();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
    };
  }, []);

  const media = manifest?.scenes.find((scene) => scene.id === current.id);
  const frames =
    media && (mobile && media.mobile.count ? media.mobile : media.desktop);
  const src = reducedMotion
    ? media?.poster
    : (frames && framePath(frames, position.local / current.motionEnd)) ||
      media?.poster;

  useEffect(() => {
    if (!src) {
      const frame = requestAnimationFrame(() => setImageReady(false));
      return () => cancelAnimationFrame(frame);
    }
    const draw = (img: HTMLImageElement) => {
      if (!canvas.current) return;
      const surface = canvas.current;
      if (surface.width !== img.naturalWidth) surface.width = img.naturalWidth;
      if (surface.height !== img.naturalHeight)
        surface.height = img.naturalHeight;
      surface.getContext('2d')?.drawImage(img, 0, 0);
      setImageReady(true);
    };
    const frame = requestAnimationFrame(() => {
      const neighbors: string[] = [];
      if (frames?.count && !reducedMotion) {
        const currentFrame = Math.round(
          clamp(position.local / current.motionEnd) * (frames.count - 1),
        );
        for (let step = 1; step <= 10; step++) {
          for (const number of [currentFrame + step, currentFrame - step]) {
            if (number >= 0 && number < frames.count)
              neighbors.push(
                frames.pattern.replace(
                  '{frame}',
                  String(number).padStart(4, '0'),
                ),
              );
          }
        }
      }
      cache.current?.request(src, neighbors, draw, () => {
        if (media?.poster && src !== media.poster)
          cache.current?.request(media.poster, [], draw, () =>
            setImageReady(false),
          );
        else setImageReady(false);
      });
    });
    return () => cancelAnimationFrame(frame);
  }, [
    src,
    frames,
    position.local,
    current.motionEnd,
    reducedMotion,
    media?.poster,
  ]);

  const opacity =
    reducedMotion && current.headline
      ? 1
      : copyOpacity(current, position.local);
  return (
    <section
      className="scroll-story"
      ref={root}
      aria-label="From fruit to first sip"
      style={{
        height: `calc(${totalScrollVh * 100}svh + max(100svh, var(--stage-min-height)))`,
      }}
    >
      {scenes.map((scene, index) => {
        const top = scenes
          .slice(0, index)
          .reduce((sum, previous) => sum + previous.scrollVh, 0);
        return (
          <span
            className="scene-anchor"
            id={`scene-${scene.id}`}
            key={scene.id}
            style={{ top: `${top * 100}svh` }}
          />
        );
      })}
      <div className="story-stage" ref={stage}>
        <Image
          className={`story-poster ${imageReady ? 'is-hidden' : ''}`}
          src={
            media?.poster ||
            (current.id === '01'
              ? '/stills/reference-melon.webp'
              : `/stills/end-${current.id}.webp`)
          }
          width={1536}
          height={864}
          alt=""
          fetchPriority="high"
          unoptimized
        />
        <canvas
          ref={canvas}
          className={`story-canvas ${imageReady ? 'is-ready' : ''}`}
          aria-hidden="true"
        />
        <p className="sr-only">{current.description}</p>
        <div
          className="story-copy"
          style={{
            opacity,
            visibility: current.headline ? 'visible' : 'hidden',
            pointerEvents: opacity > 0.5 ? 'auto' : 'none',
          }}
          aria-hidden={opacity < 0.1}
        >
          <p className="eyebrow">Sun-grown. Simply pressed.</p>
          {position.index === 0 ? (
            <h1>{current.headline}</h1>
          ) : (
            <h2>{current.headline}</h2>
          )}
          <p className="story-subline">{current.subline}</p>
          {current.cta && (
            <a
              className="pill-link"
              href={current.cta.href}
              tabIndex={opacity > 0.5 ? 0 : -1}
            >
              {current.cta.label}
              {current.id === '01' ? (
                <ArrowDown size={18} />
              ) : (
                <ArrowUpRight size={18} />
              )}
            </a>
          )}
        </div>
        <div className="story-bottom">
          <span className="scroll-hint">
            <ArrowDown size={15} /> Scroll to discover
          </span>
          <nav className="chapter-nav" aria-label="Story chapters">
            {scenes.map((scene, index) => (
              <a
                key={scene.id}
                href={`#scene-${scene.id}`}
                aria-label={`${scene.id}: ${scene.name}`}
                aria-current={position.index === index ? 'step' : undefined}
              >
                <span>{scene.id}</span>
                <i />
              </a>
            ))}
          </nav>
          <span className="chapter-name">{current.name}</span>
        </div>
      </div>
    </section>
  );
}
