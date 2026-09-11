# 9 Bar 3D espresso machine study

## How it was made

Built as Phase 1 using Next.js 15, React, TypeScript, React Three Fiber, Drei, Three.js, GSAP ScrollTrigger, Lenis and Zustand. One canvas stays mounted across a 1200vh scroll document. A progress store drives CatmullRom camera curves, chapter copy and a pressure gauge. Procedural geometry registers fourteen named machine groups so a future GLB can replace the placeholder.

The machine remains assembled and the camera stays outside its shells. The gauge currently maps scroll linearly to 0–9 bar. Cutaways, exploded parts, detailed brewing actions, grounds, steam, milk art, final cup/title transition and commerce content are future phases. This is a structural prototype, not the completed five-phase story. The production build uses .next-production to keep its output separate from development.

## Setup and resources

- [Configuration and requirements](CONFIGURATION.md)
- [Assets and reference material](RESOURCES.md)
- [Original implementation README](README.md)

This folder is independently installable. No API calls or paid media generation are required by the collection setup itself.
