import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  mkdtemp,
  mkdir,
  copyFile,
  writeFile,
  readFile,
  rm,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
const available =
  spawnSync('ffmpeg', ['-version']).status === 0 &&
  spawnSync('ffprobe', ['-version']).status === 0;
function run(bin, args) {
  const p = spawnSync(bin, args, { encoding: 'utf8' });
  assert.equal(p.status, 0, p.stderr);
  return p;
}
async function fixture() {
  const root = await mkdtemp(join(tmpdir(), 'slice-media-test-'));
  for (const dir of [
    'scripts',
    'media/clips',
    'media/stills/final',
    'public/frames',
    'content',
  ])
    await mkdir(join(root, dir), { recursive: true });
  return root;
}

test(
  'extracts actual desktop/mobile WebP counts and refuses overwrites',
  { skip: !available },
  async () => {
    const root = await fixture();
    try {
      await copyFile(
        'scripts/extract-frames.mjs',
        join(root, 'scripts/extract-frames.mjs'),
      );
      await writeFile(
        join(root, 'public/frames/manifest.json'),
        JSON.stringify({
          version: 1,
          scenes: [
            {
              id: '01',
              poster: null,
              desktop: { count: 0 },
              mobile: { count: 0 },
            },
          ],
        }),
      );
      run('ffmpeg', [
        '-hide_banner',
        '-loglevel',
        'error',
        '-f',
        'lavfi',
        '-i',
        'color=c=white:s=1280x720:r=24',
        '-t',
        '0.5',
        '-an',
        '-c:v',
        'libx264',
        join(root, 'media/clips/clip-01.mp4'),
      ]);
      run(process.execPath, [join(root, 'scripts/extract-frames.mjs'), '1']);
      const m = JSON.parse(
        await readFile(join(root, 'public/frames/manifest.json'), 'utf8'),
      );
      assert.equal(m.scenes[0].desktop.count, 12);
      assert.equal(m.scenes[0].mobile.count, 8);
      const repeat = spawnSync(
        process.execPath,
        [join(root, 'scripts/extract-frames.mjs'), '1'],
        { encoding: 'utf8' },
      );
      assert.notEqual(repeat.status, 0);
      assert.match(repeat.stderr, /exists/);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  },
);

test(
  'reviews real 8-second output with matching boundary frames',
  { skip: !available },
  async () => {
    const root = await fixture();
    try {
      await copyFile(
        'scripts/review-video.mjs',
        join(root, 'scripts/review-video.mjs'),
      );
      const clip = join(root, 'media/clips/clip-01.mp4');
      run('ffmpeg', [
        '-hide_banner',
        '-loglevel',
        'error',
        '-f',
        'lavfi',
        '-i',
        'color=c=white:s=1280x720:r=24',
        '-t',
        '8',
        '-an',
        '-c:v',
        'libx264',
        clip,
      ]);
      run('ffmpeg', [
        '-hide_banner',
        '-loglevel',
        'error',
        '-i',
        clip,
        '-vf',
        'scale=1536:864',
        '-frames:v',
        '1',
        join(root, 'media/stills/final/expected.png'),
      ]);
      await writeFile(
        join(root, 'content/video-production.json'),
        JSON.stringify({
          clips: [
            { id: '01', firstFrame: 'expected.png', lastFrame: 'expected.png' },
          ],
        }),
      );
      run(process.execPath, [join(root, 'scripts/review-video.mjs'), '1']);
      const r = JSON.parse(
        await readFile(join(root, 'media/review/clip-01/metrics.json'), 'utf8'),
      );
      assert.equal(r.frames, 192);
      assert.equal(r.duration, 8);
      assert.equal(r.silent, true);
      assert.ok(r.metrics.first.ssim > 0.999);
      assert.ok(r.metrics.last.ssim > 0.999);
      assert.equal(r.visualReview, 'pending');
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  },
);
