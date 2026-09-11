import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { join, resolve } from 'node:path';
const root = resolve(import.meta.dirname, '..');
const id = String(Number(process.argv[2])).padStart(2, '0');
if (!['01', '02', '03', '04', '05', '06'].includes(id))
  throw new Error('Scene must be 1 through 6');
const input = join(root, `media/clips/clip-${id}.mp4`);
const out = join(root, `media/review/clip-${id}`);
await mkdir(out, { recursive: true });
function run(bin, args) {
  const p = spawnSync(bin, args, {
    encoding: 'utf8',
    maxBuffer: 8 * 1024 * 1024,
  });
  if (p.error) throw p.error;
  if (p.status !== 0) throw new Error(p.stderr || `${bin} exited ${p.status}`);
  return { stdout: p.stdout, stderr: p.stderr };
}
const probe = JSON.parse(
  run('ffprobe', [
    '-v',
    'error',
    '-count_frames',
    '-show_streams',
    '-show_format',
    '-of',
    'json',
    input,
  ]).stdout,
);
const video = probe.streams.find((s) => s.codec_type === 'video');
const count = Number(video.nb_read_frames);
const duration = Number(probe.format.duration);
if (
  !count ||
  video.width !== 1280 ||
  video.height !== 720 ||
  Math.abs(duration - 8) > 0.15
)
  throw new Error(
    `Unexpected output format: ${video.width}x${video.height}, ${duration}s, ${count} frames`,
  );
if (probe.streams.some((s) => s.codec_type === 'audio'))
  throw new Error('Expected silent clip, but an audio stream is present');
for (const [label, index] of [
  ['first', 0],
  ['last', count - 1],
])
  run('ffmpeg', [
    '-hide_banner',
    '-loglevel',
    'error',
    '-y',
    '-i',
    input,
    '-vf',
    `select=eq(n\\,${index})`,
    '-frames:v',
    '1',
    join(out, `${label}.png`),
  ]);
run('ffmpeg', [
  '-hide_banner',
  '-loglevel',
  'error',
  '-y',
  '-i',
  input,
  '-vf',
  'fps=2,scale=384:-2,tile=4x4',
  '-frames:v',
  '1',
  join(out, 'contact-sheet.jpg'),
]);
run('ffmpeg', [
  '-hide_banner',
  '-loglevel',
  'error',
  '-y',
  '-i',
  input,
  '-vf',
  "fps=4,select='lt(n,4)+gte(n,28)',scale=384:-2,tile=4x2",
  '-frames:v',
  '1',
  join(out, 'boundaries.jpg'),
]);
const plan = JSON.parse(
  await readFile(join(root, 'content/video-production.json'), 'utf8'),
);
const clip = plan.clips.find((c) => c.id === id);
const metrics = {};
for (const [label, expected] of [
  ['first', clip.firstFrame],
  ['last', clip.lastFrame],
]) {
  const result = run('ffmpeg', [
    '-hide_banner',
    '-i',
    join(out, `${label}.png`),
    '-i',
    join(root, 'media/stills/final', expected),
    '-lavfi',
    '[0:v]format=yuv420p[a];[1:v]scale=1280:720,format=yuv420p[b];[a][b]ssim',
    '-f',
    'null',
    '-',
  ]);
  metrics[label] = {
    expected,
    ssim: Number(result.stderr.match(/All:([\d.]+)/)?.[1] || 0),
  };
}
const report = {
  scene: id,
  width: video.width,
  height: video.height,
  duration,
  frames: count,
  fps: video.avg_frame_rate,
  silent: true,
  metrics,
  visualReview: 'pending',
};
await writeFile(
  join(out, 'metrics.json'),
  JSON.stringify(report, null, 2) + '\n',
);
console.log(JSON.stringify(report, null, 2));
