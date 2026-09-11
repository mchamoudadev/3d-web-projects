import { readFile, writeFile } from 'node:fs/promises';

// Derive prompts from the supplied brief; never silently rewrite its shot lists.
const brief = await readFile(
  new URL('../docs/storyboard.md', import.meta.url),
  'utf8',
);
const style = brief.match(/### Style block[^\n]*\n\n"([^"]+)"/)[1];
const avoid = brief.match(/### Avoid list[^\n]*\n\n"([^"]+)"/)[1];
const expand = (prompt) =>
  prompt.replaceAll('[Style block]', style).replaceAll('[Avoid list]', avoid);
const cropGuard =
  'Compose for a later center crop: keep the subject in the left 55% and away from the top and bottom 8% of the frame.';
const keyPrompt = brief.match(/### 1a\.[\s\S]*?\n"([^"]+)"/)[1];
const editPrefix =
  'Edit this image. Keep the surface, lighting, camera angle and framing exactly the same.';
const endFrames = [
  ...brief.matchAll(/- `end-(\d\d)\.png`[^\n]*?: "([^"]+)"/g),
].map(([, id, prompt], index) => ({
  id,
  input:
    index === 0
      ? 'reference-melon.png'
      : `end-${String(index).padStart(2, '0')}.png`,
  output: `end-${id}.png`,
  candidates: 3,
  prompt: `${style} ${editPrefix} ${expand(prompt)} ${cropGuard}`,
}));
const clips = [
  ...brief.matchAll(/### Clip (\d\d), ([^\n]+)\n[^\n]+\n"([^"]+)"/g),
].map(([, id, name, prompt]) => ({
  id,
  name,
  firstFrame: `end-${String(Number(id) - 1).padStart(2, '0')}.png`,
  lastFrame: `end-${id}.png`,
  referenceImage: 'reference-melon.png',
  prompt: expand(prompt),
}));
if (endFrames.length !== 6 || clips.length !== 6)
  throw new Error(
    'Expected all six end frames and clips in docs/storyboard.md',
  );
const plan = {
  imageTool: 'Codex built-in image_gen',
  imageModelSelection:
    'Use the built-in tool. Do not substitute an external API or claim model controls the tool does not expose.',
  source:
    'docs/storyboard.md, overridden by the user: use the built-in image editing tool',
  generationSize: { width: 1536, height: 1024 },
  crop: { width: 1536, height: 864, left: 0, top: 80 },
  keyStill: {
    candidates: 4,
    selected: 'media/stills/candidates/key-03.png',
    output: 'reference-melon.png',
    prompt: `${expand(keyPrompt)} ${cropGuard}`,
  },
  endFrames,
  video: {
    model: 'bytedance/seedance-2.5',
    duration: 8,
    resolution: '720p',
    aspectRatio: '16:9',
    generateAudio: false,
    requestedReturnLastFrame: true,
    generationOrder: ['04', '01', '02', '03', '05', '06'],
  },
  clips,
};
await writeFile(
  new URL('../content/generation-plan.json', import.meta.url),
  JSON.stringify(plan, null, 2) + '\n',
);
console.log(
  'Prepared built-in image prompts, six chained end frames, and six video prompts. No generation requests sent.',
);
