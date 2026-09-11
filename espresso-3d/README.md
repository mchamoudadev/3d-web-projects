# 9 Bar

A local, scroll-driven espresso machine study. Phase 1 is implemented. The later storyboard scenes are not yet implemented.

## Run

```sh
npm install
npm run dev
```

Open http://127.0.0.1:49173. Scroll, use arrow or page keys, or press Home and End. Reverse scrolling rewinds the camera and gauge.

```sh
npm run build
npm run lint
npm run typecheck
```

The production build uses `.next-production` so it can run alongside the development preview without overwriting its output. Stop the development server before using `npm start` on the same port.

## Phase 1

- Next.js App Router, TypeScript, R3F, Drei, Three.js, GSAP ScrollTrigger, Lenis, Zustand, and Tailwind.
- One continuously mounted canvas and a 1200vh document.
- `ScrollEngine` owns scroll input. `store/progress.ts` holds progress, clamped velocity, pointer position, and reduced-motion preference.
- `config/timeline.ts` defines every chapter range and all position and look-at keyframes. Both camera tracks are CatmullRom curves. The same progress always returns the same pose.
- Cursor parallax stays below two degrees and is disabled for reduced motion. Portrait framing keeps the placeholder visible.
- Fourteen stable groups register through `useMachineParts()`. A future GLB adapter replaces the source in `components/Machine/Machine.tsx` and registers the same names with equivalent local origins.
- Locally bundled Fraunces and JetBrains Mono. Procedural studio reflections require no HDR download or external API.
- Pinned chapter copy and a fixed SVG pressure gauge. No navigation or premature CTA.

## Deliberately provisional

The complete machine is still assembled throughout the camera route. Chapter copy marks the future scene positions. The camera remains outside the solid placeholder shells until the cutaway and exploded scenes exist. The gauge maps progress linearly to 0 through 9 bar for Phase 1; later phases replace this with the storyboard's pressure profile. The cup is ceramic for the structural preview.

Scene-specific timelines, explosion and leaders, coffee grounds, water, boiler clipping, extraction drops, crema, steam, milk, rosetta, the final cup-to-letter transition, purchase content, and the asset-percentage cup preloader remain for later phases. The GLB is optional until model replacement. A real price and CTA destination will be needed for the final landing.

## Verification

See `notes/verification.md` for measured checks and limits. No 60 fps or physical-device performance claim is made for Phase 1.
