# 9 Bar

A local scroll-driven espresso story with a visible barista and customer. Next.js App Router, TypeScript, React Three Fiber, Drei, GSAP ScrollTrigger, Lenis, Zustand and Tailwind CSS. Fonts, materials and geometry are local.

## Run

```sh
npm install
npm run dev
```

Open http://localhost:52743. Scroll forward to play the actions and backward to rewind. Page Down and Page Up also work.

```sh
npm test
npm run build
npm run start
npm run lint
npm run typecheck
```

## Revised experience

The user rejected the detached hands and the unfinished interior camera route, and asked to see both the barista preparing and serving coffee and the customer lifting and drinking it.

The revision uses complete stylized people with faces, hair, clothing, aprons, torsos and connected arms. The barista grinds, tamps, locks the portafilter, places the cup, brews, steams milk, pours and serves. The customer reaches for the handle, raises the same cup, drinks and lowers it. The camera remains outside the machine and turns toward the customer for the final actions. This intentionally replaces the original strict first-person machine-dive sequence.

Everything samples one global scroll progress value. The cup and tools have deterministic paths. Hand targets follow the prop transforms. The cup's liquid surface counter-rotates during the sip. Coffee grounds, two extraction streams, milk, steam and a crema shader make the actions visible. The pressure gauge now tracks brewing pressure rather than increasing linearly through the story.

## Implementation boundaries

- `config/timeline.ts`: scene copy and the continuous camera spline.
- `config/choreography.ts`: prop paths, grips, cup tilt, fill and pressure.
- `hooks/useHands.ts`: arm posing and body lean.
- `hooks/useSetParts.tsx`: stable named part registry and eventual model replacement boundary.
- `components/Set/Hands.tsx`: both complete stylized figures.
- `components/Set/BrewAction.tsx`: prop motion, grounds, coffee, milk, steam and liquid.

The people are procedural stylized models, not photorealistic scans. Finger articulation and anatomical proportions remain simplified. The interior machine journey, detailed model assets, cinematic depth of field, final preloader and commerce ending from the original brief are not implemented. No claim is made that the original full five-phase brief is finished.

## Verification

- Four executable tests check 100,000 samples of the eight hand/prop paths, cup-handle grip, level liquid while sipping, and the continuous exterior camera route.
- Production build, ESLint and TypeScript pass.
- Browser capture covers all eleven revised story beats at 1440 x 1000, plus portrait opening and sip at 390 x 844.
- A clean browser run across the story has one Canvas and no console errors or warnings.
- Rewinding from the sip produces a pixel-identical opening frame in reduced-motion mode.
- Screenshot evidence is in `output/playwright/revision-*.png`.

Real-device performance and comprehensive mesh collision checks have not been established. The checks above establish the revision's working sequence and deterministic movement, not every final visual acceptance criterion.
