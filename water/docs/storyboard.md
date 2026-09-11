# Slice: watermelon scroll story, storyboard and generation prompts

Demo brand for a Dugsiiye tutorial, called "Slice". All copy in English. Bright daylight, pure product, no hands, no people. Six connected clips, about 8 seconds each, 16:9, 720p, generated with Seedance 2.5 using first and last frame control so the story is one continuous shot.

## Global settings (use on every generation)

- Model: Seedance 2.5, 720p, 16:9, 8 seconds, audio off, `return_last_frame: true`, fixed seed once a look is found.
- One key still is generated first and passed as a reference image on every clip, so the watermelon, bottle, glass and surface stay identical.
- Composition rule: the subject lives in the left 55% of the frame. The right side is clean background reserved for website copy. Never put the action on the far edges.

### Style block (prepend to every prompt, word for word)

"Bright natural daylight product photography, white seamless studio surface with a soft warm sunlit glow from the upper left, gentle soft shadows, ultra clean, fresh, high-end beverage commercial, shallow depth of field, 50mm lens, subject positioned in the left half of the frame with clean empty white space on the right. No hands, no people, no text, no logos, no labels, no watermark."

### Avoid list (put at the end of every prompt)

"Avoid: hands, people, text, labels, logos, cluttered background, dark or moody lighting, cuts, camera shake, extra objects, cartoon style."

## The story in six scenes

| Scene | Visual story | Website copy |
| --- | --- | --- |
| 01 The melon | A whole watermelon rests on the white surface, dew on the rind. Camera slowly dollies in and orbits a quarter turn. | Hero: "Grown in the sun. Nothing else added." Sub: "One fruit, one bottle." CTA: "See how it's made" |
| 02 The cut | A single clean slice separates from the melon and falls away, revealing the red flesh. The melon splits into four wedges that settle in an arc. | No copy, let the motion lead |
| 03 The lift | The flesh breaks into cubes that rise from the wedges and float in a slow spiral above the surface, a few seeds drifting between them. | "Every cube counts." Sub: "Hand-selected fruit, cut at peak ripeness." |
| 04 The press | The floating cubes draw together and compress into a single mass that bursts into juice. A smooth red stream falls into a clear glass bottle standing below. | No copy, let the motion lead |
| 05 The bottle | The bottle is full. A cap lowers and seals it. Condensation beads on the glass. The bottle turns slowly. A wedge rests beside it. | "Cold pressed. Bottled within hours." Sub: "No sugar, no water, no concentrate." |
| 06 The pour | The bottle tilts and pours into a tall glass filled with ice. Splash, bubbles, the glass fills to the top. The bottle settles upright beside it. Final hero frame. | "Slice." Sub: "Cool, from the first sip." CTA: "Find it near you" (demo) |

## Step 1: the image pipeline (GPT Image 2.5)

All stills are made with OpenAI's GPT Image 2.5. It ships as two API models: `gpt-image-2.5-flare` (fast, default) and `gpt-image-2.5-sunburst` (built for precise, consistent multi-step edits). Use Flare to explore the look, Sunburst for every end frame, because Sunburst is the one designed to keep the subject identical across edits.

Size and aspect: generate at 1536×1024 (the widest size offered). That is 3:2, not 16:9, so center-crop every final still to 1536×864 with the same crop for all seven frames. Compose for the crop: keep the subject in the left half and away from the top and bottom 8% of the frame.

Quality: `high` for exploration, `xhigh` for the seven final stills. `max` is not needed since the video will be 720p.

### 1a. Key still (Flare, high quality, text to image)
Generate 4 to 6 variations of the prompt below and pick one. This becomes `reference-melon.png` and the ancestor of every other frame.

"[Style block] A whole ripe watermelon with a deep green striped rind, sitting on a white seamless surface, small water droplets on the rind, photographed at eye level, centered in the left half of the frame with generous empty white space on the right. [Avoid list]"

### 1b. End frames (Sunburst, xhigh quality, image edit)
Each end frame is an edit of the previous end frame, never a fresh text prompt. Pass the previous frame as the input image and describe only what changes. Repeat the phrase "keep the surface, lighting, camera angle and framing exactly the same" in every edit. Generate 2 or 3 candidates per frame and pick the one that best matches the previous frame.

Edit chain: `reference-melon.png` → `end-01.png` → `end-02.png` → `end-03.png` → `end-04.png` → `end-05.png` → `end-06.png`.

Edit prompts (prepend "Edit this image. Keep the surface, lighting, camera angle and framing exactly the same." to each):

- `end-01.png` (from the key still): "The same whole watermelon seen straight from the front at eye level, dew on the rind, still in the left half. [Avoid list]"
- `end-02.png` (from end-01): "The same watermelon is now cut into four clean wedges arranged in a shallow arc, bright red flesh with black seeds, one thin slice lying flat in front of them. [Avoid list]"
- `end-03.png` (from end-02): "The red flesh has left the four wedges, which are now empty green rinds. About forty cubes of red watermelon float in the air in a loose spiral above them with a few black seeds suspended between, and a clear empty glass bottle without a cap now stands on the surface directly beneath the spiral. [Avoid list]"
- `end-04.png` (from end-03): "The floating cubes and rinds are gone. The same bottle, in the same position, is now filled to the neck with bright red watermelon juice, a few red droplets on the surface around it, and one watermelon wedge rests beside it. [Avoid list]"
- `end-05.png` (from end-04): "The same bottle is now sealed with a plain silver cap and beaded with condensation. The wedge stays where it is. A tall clear empty glass filled with ice cubes now stands next to the bottle. [Avoid list]"
- `end-06.png` (from end-05): "The tall glass is now full of red watermelon juice over the ice. The bottle is uncapped and half full. The wedge stays where it is. A few small red drops on the surface. [Avoid list]"

After the chain is done, lay all seven frames in a row and inspect each pair (end-01 with end-02, and so on) side by side. The bottle in end-04, end-05 and end-06 must be the same bottle. The surface, light direction and framing must not change. Fix stills before spending on video.

## Step 2: one-shot generation protocol

The goal is to accept every clip on the first generation. Video models fail when a prompt asks for several things at once, when timing is vague, or when the start and end frames disagree with the motion described. So:

1. **Stills are final before any video.** Do not start a clip until its first frame and last frame are approved side by side and look like two moments of the same shot. A wrong still costs cents; a wrong clip costs $2 and 4 minutes.
2. **One main action per clip.** Each prompt below has one hero action, timed in beats. Anything secondary is either already present in the stills or dropped.
3. **Describe motion in the order it happens, with rough timing.** The model follows sequence well when the prompt reads like a shot list.
4. **The prompt must agree with both frames.** If the end frame shows a wedge beside the bottle, the wedge must be in the first frame too or the prompt must say it enters. Never leave the model to invent how the frames connect.
5. **Generate the hardest clip first: clip 04 (the press).** If the liquid looks right there, the rest will. If it fails, fix the prompt before touching the others.
6. **Seed:** use a fixed seed for all six clips once clip 04 is accepted. Change the seed only when regenerating a failed clip.
7. **Use the reference image on every clip** so the watermelon and bottle identity hold even where a frame is tight.
8. **Camera stays slow.** Slow camera moves hide model artifacts; fast ones expose them. Every prompt below says slow.
9. **Check the seam immediately** (previous end frame against the clip's first second, and the clip's last second against its end frame) before generating the next clip, since the next one depends on it.

## Step 3: the six clips, final prompts

Every clip: `first_frame` = previous end frame (clip 01 uses `end-00.png`, a copy of the key still framed like end-01), `last_frame` = this scene's end frame, `reference_image` = `reference-melon.png`, 8 seconds, 720p, 16:9, audio off, `return_last_frame: true`.

### Clip 01, The melon
Hero action: a slow orbit that ends front-on.
"[Style block] Shot list. 0 to 2s: the whole watermelon rests still on the white surface, dew glistening. 2 to 7s: the camera dollies in slowly and orbits a quarter turn around the melon, warm light sweeping across the rind. 7 to 8s: the camera settles on a front view at eye level and holds. One continuous slow camera move, nothing else moves. [Avoid list]"

### Clip 02, The cut
Hero action: the melon opens.
"[Style block] Shot list. 0 to 1s: the whole watermelon sits still. 1 to 4s: a single thin slice separates cleanly from the front of the melon and tips forward gently onto the surface, revealing bright red flesh. 4 to 7s: the remaining melon divides cleanly into four wedges that slide apart slowly and settle into a shallow arc. 7 to 8s: everything comes to rest. Camera holds steady with a very slight slow push in. Clean and precise. [Avoid list]"

### Clip 03, The lift
Hero action: cubes rise into a spiral.
"[Style block] Shot list. 0 to 1s: four watermelon wedges and one flat slice rest on the surface. 1 to 3s: the red flesh of the wedges divides into neat cubes. 3 to 7s: the cubes lift off the rinds and rise slowly into the air, drifting into a loose spiral, a few black seeds floating between them. 7 to 8s: the spiral hangs weightless and still. Slow motion throughout, the camera drifts slightly upward to follow the cubes. Calm and elegant. [Avoid list]"

### Clip 04, The press
Hero action: cubes become juice that fills a bottle. Generate this one first.
"[Style block] A clear glass bottle without a cap stands on the white surface beneath the floating cubes from the start of the shot. Shot list. 0 to 2s: the floating watermelon cubes drift inward and gather into one dense cluster. 2 to 4s: the cluster compresses and bursts into glossy red liquid. 4 to 7s: a single smooth stream of red juice falls straight down into the bottle, filling it to the neck, small droplets landing on the surface. 7 to 8s: the stream thins and stops. Slow motion, the camera tilts down slowly to follow the stream. [Avoid list]"

Note for the stills: `end-03.png` must include the empty bottle standing below the spiral so this clip does not have to invent it, and `end-04.png` must show the same bottle in the same position.

### Clip 05, The bottle
Hero action: the cap seals it and condensation forms.
"[Style block] One watermelon wedge already rests beside the full bottle from the start of the shot. Shot list. 0 to 1s: the full bottle of red juice stands still. 1 to 3s: a plain silver cap lowers slowly from above and seals the bottle. 3 to 6s: fine condensation beads form and spread across the glass. 6 to 8s: the bottle turns slowly a quarter turn and comes to rest. Steady camera with a slight slow push in. [Avoid list]"

Note for the stills: `end-04.png` must already include the wedge beside the bottle.

### Clip 06, The pour
Hero action: the pour.
"[Style block] A tall clear glass full of ice cubes already stands beside the sealed bottle from the start of the shot. Shot list. 0 to 1s: the bottle and glass stand still. 1 to 2s: the cap lifts off the bottle and out of frame. 2 to 6s: the bottle tilts slowly toward the glass and pours a smooth stream of red juice over the ice, splash and bubbles in slow motion, the glass filling to the top. 6 to 8s: the bottle rights itself and settles beside the full glass. The camera eases back slowly to a wide hero framing. [Avoid list]"

Note for the stills: `end-05.png` must include the glass of ice beside the bottle, and `end-06.png` shows the bottle half full and the glass full, with a wedge on the rim only if it is also in `end-05.png`.

## Seam checks before accepting a clip

- The last frame of clip N and the first frame of clip N+1 are the same image (they are, by construction), but check that the clip actually arrives there rather than drifting and snapping.
- Light direction stays upper left. Surface stays white. No new objects appear.
- The right 45% of the frame stays clean in every frame that will carry copy (scenes 01, 03, 05, 06).
- No text, labels or hands slipped in. If they did, regenerate that clip once with the avoid list strengthened, not the whole set.

## Scroll pacing (starting values, in viewport heights)

| Scene | Beat type | Scroll distance | Copy |
| --- | --- | --- | --- |
| 01 | Continuous, then hold on last frame | 1.5 | Hero copy visible from the start, fades out at the end |
| 02 | Continuous motion | 1.5 | None |
| 03 | Slower motion, hold on the spiral | 2.0 | Copy fades in at 40%, holds |
| 04 | Continuous motion | 1.5 | None |
| 05 | Continuous, hold on the sealed bottle | 2.0 | Copy fades in at 50%, holds |
| 06 | Continuous, long hold on the final frame | 2.5 | Copy fades in at 70%, stays; page continues below |

Total pinned scroll: about 11 viewport heights, then normal HTML (ingredients, story, demo CTA, footer).

## Budget

Image side (GPT Image 2.5, per-image cost is an estimate from the published token rates; verify on your first few calls):
- Key still exploration: 6 images at 1536×1024 high, about $0.17 each, roughly $1.
- End frames: 6 frames × 3 candidates at xhigh with an image input, about $0.35 each, roughly $6.
- Fixes and re-edits: allow another $2 to $3.
- Image total: about $8 to $10.

Video side (Seedance 2.5 on OpenRouter, 720p, $0.23 per second):
- 6 clips × 8s: about $11 for one clean pass.
- One or two single-clip retries: $2 to $4.
- Video total: about $13 to $15.

Whole pipeline, first site: about $21 to $25. The image spend is what makes the video spend land in one pass. Each clip takes around 4 minutes to generate, so run clips in the background while building the site.

## Frame extraction

After accepting all six clips:
`ffmpeg -i clip-01.mp4 -an -vf "fps=24,scale=1280:-2" -c:v libwebp -quality 80 -start_number 0 frames/s01/frame-%04d.webp`
Repeat per clip. Write a manifest with counts per scene. Six clips at 24 fps is about 1150 frames, roughly 35 to 50 MB of WebP; that is acceptable for a desktop demo, and the mobile pass can use 16 fps at 960 wide.