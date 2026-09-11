export type Scene = {
  id: string;
  name: string;
  description: string;
  scrollVh: number;
  motionEnd: number;
  copyStart: number | null;
  headline?: string;
  subline?: string;
  cta?: { label: string; href: string };
};
export const scenes: Scene[] = [
  {
    id: '01',
    name: 'The melon',
    description:
      'A whole watermelon, dew on the rind, turning slowly in the sun.',
    scrollVh: 1.5,
    motionEnd: 0.85,
    copyStart: 0,
    headline: 'Grown in the sun. Nothing else added.',
    subline: 'One fruit, one bottle.',
    cta: { label: "See how it's made", href: '#scene-02' },
  },
  {
    id: '02',
    name: 'The cut',
    description: 'One clean slice. Four wedges settling into an arc.',
    scrollVh: 1.5,
    motionEnd: 1,
    copyStart: null,
  },
  {
    id: '03',
    name: 'The lift',
    description: 'Watermelon cubes rise into a slow, weightless spiral.',
    scrollVh: 2,
    motionEnd: 0.8,
    copyStart: 0.4,
    headline: 'Every cube counts.',
    subline: 'Hand-selected fruit, cut at peak ripeness.',
  },
  {
    id: '04',
    name: 'The press',
    description:
      'The cubes become a red stream of juice, filling a clear bottle.',
    scrollVh: 1.5,
    motionEnd: 1,
    copyStart: null,
  },
  {
    id: '05',
    name: 'The bottle',
    description:
      'A silver cap seals the bottle. Condensation beads on the glass.',
    scrollVh: 2,
    motionEnd: 0.8,
    copyStart: 0.5,
    headline: 'Cold pressed. Bottled within hours.',
    subline: 'No sugar, no water, no concentrate.',
  },
  {
    id: '06',
    name: 'The pour',
    description:
      'Juice pours over ice. The bottle settles beside a full glass.',
    scrollVh: 2.5,
    motionEnd: 0.75,
    copyStart: 0.7,
    headline: 'Slice.',
    subline: 'Cool, from the first sip.',
    cta: { label: 'Find it near you', href: '#find' },
  },
];
export const totalScrollVh = scenes.reduce(
  (sum, scene) => sum + scene.scrollVh,
  0,
);
export const clamp = (value: number, low = 0, high = 1) =>
  Math.min(high, Math.max(low, value));
export function storyPosition(progress: number) {
  const distance = clamp(progress) * totalScrollVh;
  let offset = 0;
  for (let index = 0; index < scenes.length; index++) {
    const scene = scenes[index];
    if (distance < offset + scene.scrollVh || index === scenes.length - 1) {
      return { index, local: clamp((distance - offset) / scene.scrollVh) };
    }
    offset += scene.scrollVh;
  }
  return { index: 0, local: 0 };
}
export function copyOpacity(scene: Scene, local: number) {
  if (scene.copyStart === null) return 0;
  const appear =
    scene.copyStart === 0 ? 1 : clamp((local - scene.copyStart) / 0.12);
  return scene.id === '06' ? appear : appear * clamp((1 - local) / 0.12);
}
export type FrameSet = {
  count: number;
  pattern: string;
  fps: number;
  width: number;
};
export type MediaScene = {
  id: string;
  poster: string | null;
  desktop: FrameSet;
  mobile: FrameSet;
};
export type MediaManifest = { version: number; scenes: MediaScene[] };
export function framePath(set: FrameSet, progress: number) {
  if (!set.count) return null;
  const frame = Math.round(clamp(progress) * (set.count - 1));
  return set.pattern.replace('{frame}', String(frame).padStart(4, '0'));
}
