import { readFile, writeFile, mkdir, readdir, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const json = async (path) =>
  JSON.parse(await readFile(resolve(root, path), 'utf8'));
const run = (args) => {
  const result = spawnSync('ffmpeg', args, {
    encoding: 'utf8',
    maxBuffer: 8 * 1024 * 1024,
  });
  if (result.error || result.status !== 0)
    throw result.error || new Error(result.stderr);
  return result.stderr;
};
const manifest = await json('public/frames/manifest.json');
const report = {
  createdAt: new Date().toISOString(),
  model: 'bytedance/seedance-2.5',
  clips: [],
  seams: [],
  seamVisualReview: 'pending',
};
for (const scene of manifest.scenes) {
  const job = await json(`media/jobs/clip-${scene.id}.json`);
  const review = await json(`media/review/clip-${scene.id}/metrics.json`);
  if (job.status !== 'completed' || review.visualReview !== 'accepted')
    throw new Error(`Scene ${scene.id} has not passed review`);
  const bytes = await readFile(
    resolve(root, `media/clips/clip-${scene.id}.mp4`),
  );
  const sha256 = createHash('sha256').update(bytes).digest('hex');
  if (sha256 !== job.videoSha256)
    throw new Error(`Scene ${scene.id} video changed after download`);
  const assets = {};
  for (const profile of ['desktop', 'mobile']) {
    const config = scene[profile];
    const directory = resolve(root, `public/frames/${profile}/s${scene.id}`);
    const files = (await readdir(directory))
      .filter((name) => name.endsWith('.webp'))
      .sort();
    if (
      !config.count ||
      files.length !== config.count ||
      files.some(
        (file, index) =>
          file !== `frame-${String(index).padStart(4, '0')}.webp`,
      )
    )
      throw new Error(`Scene ${scene.id} ${profile} inventory mismatch`);
    let totalBytes = 0;
    for (const file of files)
      totalBytes += (await stat(resolve(directory, file))).size;
    assets[profile] = { ...config, bytes: totalBytes };
  }
  await stat(resolve(root, `public${scene.poster}`));
  report.clips.push({
    ...review,
    seed: job.seed,
    videoSha256: sha256,
    costUSD: job.usage?.cost ?? null,
    assets,
  });
}
const seamDirectory = resolve(root, 'media/review/seams');
await mkdir(seamDirectory, { recursive: true });
for (let n = 1; n < 6; n++) {
  const previous = String(n).padStart(2, '0');
  const next = String(n + 1).padStart(2, '0');
  const last = resolve(root, `media/review/clip-${previous}/last.png`);
  const first = resolve(root, `media/review/clip-${next}/first.png`);
  const metrics = {};
  for (const [name, crop] of [
    ['fullFrame', ''],
    ['subjectArea', 'crop=704:720:0:0,'],
  ]) {
    const output = run([
      '-hide_banner',
      '-i',
      last,
      '-i',
      first,
      '-lavfi',
      `[0:v]${crop}format=yuv420p[a];[1:v]${crop}format=yuv420p[b];[a][b]ssim`,
      '-f',
      'null',
      '-',
    ]);
    metrics[name] = Number(output.match(/All:([\d.]+)/)?.[1] || 0);
  }
  run([
    '-hide_banner',
    '-loglevel',
    'error',
    '-y',
    '-i',
    last,
    '-i',
    first,
    '-filter_complex',
    '[0:v]scale=384:216[l];[1:v]scale=384:216[r];[l][r]hstack',
    '-frames:v',
    '1',
    resolve(seamDirectory, `seam-${previous}.jpg`),
  ]);
  report.seams.push({ from: previous, to: next, ssim: metrics });
}
run([
  '-hide_banner',
  '-loglevel',
  'error',
  '-y',
  '-start_number',
  '1',
  '-i',
  resolve(seamDirectory, 'seam-%02d.jpg'),
  '-vf',
  'tile=1x5',
  '-frames:v',
  '1',
  resolve(seamDirectory, 'contact-sheet.jpg'),
]);
report.selectedClipsCostUSD = report.clips.every(
  (clip) => clip.costUSD !== null,
)
  ? Number(report.clips.reduce((sum, clip) => sum + clip.costUSD, 0).toFixed(6))
  : null;
report.archivedAttempts = [];
try {
  for (const file of await readdir(resolve(root, 'media/jobs/archive'))) {
    if (!file.endsWith('.json')) continue;
    const job = await json(`media/jobs/archive/${file}`);
    report.archivedAttempts.push({
      scene: job.scene,
      seed: job.seed,
      costUSD: job.usage?.cost ?? null,
      status: job.status,
    });
  }
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
}
report.totalCostUSD =
  report.selectedClipsCostUSD !== null &&
  report.archivedAttempts.every((attempt) => attempt.costUSD !== null)
    ? Number(
        (
          report.selectedClipsCostUSD +
          report.archivedAttempts.reduce(
            (sum, attempt) => sum + attempt.costUSD,
            0,
          )
        ).toFixed(6),
      )
    : null;
report.totalDurationSeconds = Number(
  report.clips.reduce((sum, clip) => sum + clip.duration, 0).toFixed(6),
);
report.totalFrames = Object.fromEntries(
  ['desktop', 'mobile'].map((profile) => [
    profile,
    report.clips.reduce((sum, clip) => sum + clip.assets[profile].count, 0),
  ]),
);
await writeFile(
  resolve(root, 'docs/media-report.json'),
  JSON.stringify(report, null, 2) + '\n',
);
console.log(
  JSON.stringify(
    {
      totalCostUSD: report.totalCostUSD,
      totalDurationSeconds: report.totalDurationSeconds,
      totalFrames: report.totalFrames,
      seams: report.seams,
    },
    null,
    2,
  ),
);
console.log(
  'Review media/review/seams/contact-sheet.jpg before accepting the full chain.',
);
