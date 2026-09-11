# Build "9 Bar": a first-person, scroll-driven 3D espresso website

## Role

You are a senior creative developer. You build award-level (Awwwards / FWA quality) scroll-driven 3D websites with React Three Fiber, GSAP and custom shaders. You care about timing, easing, lighting and typography as much as code. You ship working code, not descriptions.

## Goal

Build a single-page website that tells the story of one shot of espresso entirely in first person. The camera is the eyes of someone sitting at a cafe counter. A barista makes the shot in front of them, the camera dives inside the machine while it brews, comes back out with the coffee as it pours into the cup, and the site ends with the viewer lifting the cup and taking the first sip.

Everything is driven by scroll. Scrolling forward plays the story. Scrolling back rewinds it. The camera never cuts. The viewer feels like they are scrubbing time from their own seat.

This is a portfolio-grade "wow" piece. Every scene must have one visual moment people would screenshot.

## Stack (do not substitute)

- Next.js (App Router) with TypeScript
- React Three Fiber, Drei, three.js
- GSAP with ScrollTrigger (`scrub: true`), Lenis for smooth scrolling
- Custom GLSL shaders where needed (crema, steam, water, liquid surface)
- Postprocessing (depth of field, vignette) via @react-three/postprocessing
- Tailwind for layout and typography only. All 3D styling lives in materials and shaders.
- No paid services, no external APIs. Everything runs locally.

## Phase plan

Work in phases. Finish each phase, verify it runs in the browser with no console errors, then move to the next. Do not skip ahead.

### Phase 1: Skeleton and scroll engine
- Project setup, one full-screen fixed `<Canvas>`, HTML scroll container of about 1400vh behind it.
- One global `progress` value (0 to 1) derived from scroll via ScrollTrigger + Lenis. Everything in the scene reads from this value. No scene may own its own scroll listener.
- Camera is a first-person rig: position and lookAt sampled from a CatmullRom spline driven by `progress`, plus a subtle idle "breathing" sway (low-frequency noise, max 0.5 degrees) and cursor parallax (max 2 degrees). Both are disabled while inside the machine.
- Placeholder set built from primitives:
  - Counter, back wall, a soft window light source.
  - Espresso machine with every part as a named group: `body`, `sidePanelL`, `sidePanelR`, `dripTray`, `portafilter`, `basket`, `groupHead`, `brewButton`, `boiler`, `heatingElement`, `pump`, `reservoir`, `steamWand`, `grinder`, `cup`, `saucer`, `pitcher`, `tamper`.
  - Two pairs of hands as simple capsule rigs: `baristaHands` (across the counter) and `viewerHands` (bottom of the frame, only visible when they act).
  - Real GLBs will replace these later, so keep names stable and load everything through one `useSetParts()` hook.
- Fixed pressure gauge in the bottom right corner (SVG). Its needle maps to `progress`. This is the only scroll indicator.

### Phase 2: The carrying scenes
Build scenes 5, 8, 9 and 13 first (the dive into the machine, extraction, the return with the pour, and the sip). These are the transitions and payoffs. If they are not seamless and impressive, nothing else matters.

### Phase 3: Remaining scenes
Scenes 1, 2, 3, 4, 6, 7, 10, 11, 12, 14.

### Phase 4: Materials, shaders, particles, hands
Glass, brushed steel, emissive element, crema shader, steam particles, frozen drops, liquid surface, hand animation.

### Phase 5: Typography, readouts, polish, performance
Pinned text, mono readouts, preloader, mobile fallbacks, 60 fps on a mid-range laptop.

## Design system

- Background and environment: a dark, warm cafe. Walls near-black espresso #12100E, counter in dark walnut, one soft warm window light from the left, practical bulb glow above the machine. Never pure black.
- Cream: #F2E8D5 for text.
- Brass: #B8935A for leader lines, gauge, accents.
- Heat orange: #FF6A1F for temperature, pressure and emissive glow only.
- Headline font: Fraunces (variable, use optical size). Large, editorial, tight leading.
- Readout font: JetBrains Mono or IBM Plex Mono. Tabular numerals.
- Hands: stylized, low-poly, matte, no fingernails or skin detail, a single warm neutral tone. They must read as hands from a distance and never try to look photoreal.
- Depth of field is a storytelling tool: shallow when something is close (cup, drops), deep when looking across the counter.
- Text is pinned in the lower third or to one side, fades in at the start of a scene, holds, fades out at the end. Text never scrolls past the 3D scene.
- Minimal UI. No nav bar. No buttons until the final section.

## Scroll storyboard

Progress ranges are the share of total scroll. Each scene is a pinned section. Use GSAP timelines per scene, all driven by the same global `progress`.

### Scene 1: Preloader (before scroll)
Cup outline fills with dark liquid as assets load. Fill level equals load percentage. Fades to Scene 2 when complete.

### Scene 2: Seat at the counter (0.00 to 0.05)
Eye level, sitting. The machine is across the counter, slightly to the right. An empty cup on a saucer is in front of you. The barista's hands rest on the counter. Idle sway only. Headline: "Nine bars. Twenty-five seconds. Everything in between." Gauge needle at 0 with a small idle twitch as the scroll cue.

### Scene 3: Grind and dose (0.05 to 0.13)
The barista's hands take the portafilter, hold it under the grinder. Instanced coffee grounds (5,000 to 10,000 instances) pour into the basket. The camera tilts down slightly to follow, as a real head would. A tamper descends and compresses the grounds into a puck. Readouts: "18.0 g" and "200 um grind".

### Scene 4: Lock in (0.13 to 0.18)
The hands carry the portafilter to the group head and twist it in. Camera follows the motion and ends framed tightly on the group head and brew button. A finger presses the button. The button lights up in heat orange. Everything holds for a beat.

### Scene 5: The dive (0.18 to 0.22)
The camera pushes forward through the group head into the machine. Transition: the machine body passes through a clipping plane so the metal peels away around the camera as it enters. Idle sway and parallax fade out. The cafe sound (if any) muffles. You are now inside the machine, looking down the water path.

### Scene 6: Water path (0.22 to 0.34)
A glowing thread of water leaves the reservoir and travels through the tubing to the vibration pump. The tube is a tube geometry with an animated emissive gradient that travels with progress. The pump pulses; amplitude scales with scroll velocity (clamped). The gauge climbs from 0 to 9 bar and a mono readout ticks "0.0 bar" to "9.0 bar".

### Scene 7: Boiler (0.34 to 0.46)
The camera moves through the boiler. A clipping plane sweeps through the shell as progress increases. The heating element glows from dark to dull red to orange (emissive mapped to progress), the water surface shimmers (scrolling normal map), bubbles rise (instanced spheres). Readout climbs to "93.0 C". Copy is about temperature stability.

### Scene 8: Extraction, the hero moment (0.46 to 0.60)
Camera arrives inside the group head just above the puck.
- 0.46 to 0.50: water arrives, the puck surface darkens from the center outward (radial mask in the puck material) as pre-infusion.
- 0.50 to 0.56: first drops form under the basket. Time slows to near freeze. Drops are individual meshes whose fall position is driven directly by progress, so scrolling nudges them frame by frame and scrolling back pulls them back up. Camera drifts down past the hanging drops.
- 0.56 to 0.60: the drops join into two thin streams. The camera follows the streams downward. Mono readout "0:00" begins.

### Scene 9: The return (0.60 to 0.64)
The camera exits the bottom of the basket riding alongside the streams. As it passes the spouts, the machine body un-clips around it, the cafe environment fades back in, idle sway and parallax return, and the camera settles back into the seat, now looking down at the cup as the first espresso lands in it. This transition must be seamless: the viewer should not be able to say where the inside ended and the counter began.

### Scene 10: The pour, POV (0.64 to 0.74)
Two streams of espresso fall into the cup in slow motion, driven by progress. The cup fills from the bottom (rising fill plane inside the cup), crema builds on top using a custom shader: layered noise, tiger striping, a color ramp from deep brown to caramel, a slow swirl. Readout "0:00" to "0:25" tied to progress. Scrolling back un-pours the shot back into the spouts.

### Scene 11: Steam and pour (0.74 to 0.82)
The camera turns its head slightly to the right, toward the steam wand. The barista's hand holds a pitcher. Milk surface shows a vortex (rotating normal map plus displacement). Steam is a GPU sprite particle system, soft-edged, additive, density reacting to cursor movement and scroll velocity. The camera turns back as the barista pours milk into the cup and a rosetta is drawn as an animated path revealed on the crema surface.

### Scene 12: The lift (0.82 to 0.90)
The viewer's own hands enter from the bottom of the frame and lift the cup toward the camera. As it rises it grows to fill the frame. Depth of field shortens with progress so the cafe blurs away and only the crema surface and the rosetta are sharp.

### Scene 13: The sip (0.90 to 0.96)
The cup tilts toward the viewer. The liquid surface is a plane inside the cup that counter-rotates so it stays level, with a meniscus shader at the rim. The rim passes below the bottom of the frame, the liquid surface climbs toward the camera, and a postprocessing warm vignette and slight blur increase with progress. Readout "93 C" cools to "65 C". Copy: "The first sip." The cup lowers and the rosetta now has a bite taken out of it (the crema mask is shifted).

### Scene 14: Landing (0.96 to 1.00)
The cup is set back on the saucer, half empty. The camera pulls back to the seated view: machine, counter, the barista's hands resting again. The 3D cup shrinks and moves into position to become the "o" in the final headline (match the letter position exactly via a DOM measurement). Below it, normal HTML: short specs list, price, one CTA button, small footer. This is the only section with standard scrolling content.

## Interaction rules

- Scroll velocity influences: pump shake (Scene 6), steam density (Scene 11). Clamp all velocity effects so fast scrolling never breaks the look.
- Cursor influences: head parallax outside the machine, steam in Scene 11.
- Idle breathing sway is always on outside the machine, always off inside.
- Reduced motion: if `prefers-reduced-motion` is set, disable velocity effects, parallax and sway, keep scroll scrubbing.
- Mobile: same story, lower particle counts, transmission material replaced by a simple glass approximation, camera path adjusted for portrait framing so the cup and machine stay in frame.

## Technical rules

- One `<Canvas>`, always mounted. Scenes are not separate canvases and not separate routes.
- One global progress store (Zustand). Scenes subscribe to it. Do not read scroll position anywhere else.
- Camera path: a single CatmullRom curve with keyframes for each scene. Store keyframes in one config file so timing can be tuned without touching scene code. Inside-machine segments and outside segments are the same curve.
- Hands: in the placeholder phase, capsule rigs animated with GSAP keyframes. When real hand GLBs arrive, animate via baked Blender actions scrubbed with the animation mixer from `progress`. Keep a single `useHands()` hook so the swap does not touch scenes.
- Set parts are accessed by name through one hook so placeholders can be swapped for GLBs (DRACO compressed) without changing scene code.
- Materials: MeshTransmissionMaterial for glass reservoir and cup (desktop only), MeshPhysicalMaterial with anisotropy for brushed steel, emissive for the heating element and brew button. Custom ShaderMaterial for crema, water tube gradient, milk surface, liquid surface in the cup, and steam.
- Particles: InstancedMesh for coffee grounds and bubbles, a Points-based sprite shader for steam.
- Postprocessing: depth of field and vignette only. Both parameters are driven by progress, not constant.
- Performance targets: 60 fps on a mid-range laptop, under 4 MB initial JS, total GLB under 8 MB when real models arrive.
- No console errors or warnings in the final build. Lint clean.

## Suggested file structure

```
app/
  page.tsx
  layout.tsx
components/
  Experience.tsx          (Canvas, lights, postprocessing, camera rig)
  CameraRig.tsx           (spline, sway, parallax)
  Set/
    Cafe.tsx              (counter, walls, lights)
    Machine.tsx           (named parts)
    Hands.tsx             (barista and viewer hands)
    Placeholder.tsx
  scenes/
    Seat.tsx
    Grind.tsx
    LockIn.tsx
    Dive.tsx
    WaterPath.tsx
    Boiler.tsx
    Extraction.tsx
    Return.tsx
    Pour.tsx
    Steam.tsx
    Lift.tsx
    Sip.tsx
    Landing.tsx
  ui/
    Gauge.tsx
    Readout.tsx
    PinnedText.tsx
    Preloader.tsx
shaders/
  crema.frag / crema.vert
  steam.frag / steam.vert
  tube.frag / tube.vert
  milk.frag / milk.vert
  liquid.frag / liquid.vert
store/
  progress.ts
config/
  timeline.ts             (scene ranges, camera keyframes, DoF keyframes)
```

## Copy for pinned text

Keep each block to a headline and at most two short lines. Tone: calm, precise, a little poetic, written to the viewer. Examples:

- Scene 2: "Sit. This will take twenty-five seconds."
- Scene 3: "Eighteen grams, ground fine enough to resist."
- Scene 4: "Lock it in. Press once."
- Scene 5: "Now come inside."
- Scene 6: "Pressure is patience, compressed." / "Nine bars in under two seconds."
- Scene 7: "Ninety-three degrees, held steady." / "Too hot burns. Too cool sours."
- Scene 8: "Twenty-five seconds." / "Watch it happen. Then watch it un-happen."
- Scene 9: "Back out, with the coffee."
- Scene 10: "This is the part you came for."
- Scene 11: "Steam, air, and a whirlpool."
- Scene 12: "Yours now."
- Scene 13: "The first sip."
- Scene 14: "And then it is just coffee."

## Acceptance criteria

- Scrolling forward and back is perfectly symmetric. No state leaks between scenes.
- The camera path is continuous with no visible cuts or jumps, especially at the dive (Scene 5) and the return (Scene 9).
- The transition inside and back out of the machine is seamless; there is no moment where the environment visibly pops in or out.
- Scene 8 drops and Scene 10 crema respond to single scroll-wheel notches.
- The gauge needle and all readouts stay in sync with the scene.
- Hands never clip through the machine, cup or counter.
- The sip (Scene 13) keeps the liquid surface level while the cup tilts, at every progress value.
- The Scene 14 cup lands exactly in the "o" at every common viewport width.
- 60 fps on desktop, no jank on a recent phone.
- Works with placeholder geometry now and with real GLBs later by changing one loader.

## How to work

- Start with Phase 1. Show me the running result before moving on.
- After each phase, list what you built, what you deliberately left rough, and what you need from me (for example, the real GLBs or hand models).
- If a spec detail is ambiguous, pick the more cinematic option and note the assumption. Do not stop to ask unless it blocks you.
- Do not use em dashes anywhere in copy or comments.