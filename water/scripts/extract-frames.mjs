import {
  mkdir,
  readFile,
  readdir,
  rename,
  rm,
  mkdtemp,
  access,
} from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { resolve, join } from 'node:path';
import { writeFile } from 'node:fs/promises';

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const sceneArg = args.find((arg) => /^\d+$/.test(arg));
const ids = sceneArg
  ? [String(Number(sceneArg)).padStart(2, '0')]
  : ['01', '02', '03', '04', '05', '06'];
if (ids.some((id) => !['01', '02', '03', '04', '05', '06'].includes(id)))
  throw new Error('Scene must be 1 through 6');
const root = resolve(import.meta.dirname, '..');
const manifestPath = join(root, 'public/frames/manifest.json');
const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
const profiles = [
  { name: 'desktop', fps: 24, width: 1280 },
  { name: 'mobile', fps: 16, width: 960 },
];
const run = (argv, binary = 'ffmpeg') => {
  const result = spawnSync(binary, argv, { stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0)
    throw new Error(`${binary} exited with ${result.status}`);
};
const encoders = dryRun
  ? ''
  : spawnSync('ffmpeg', ['-hide_banner', '-encoders'], { encoding: 'utf8' })
      .stdout;
const nativeWebp = /\blibwebp\b/.test(encoders || '');
if (!dryRun && !nativeWebp && spawnSync('cwebp', ['-version']).status !== 0) {
  throw new Error('Install cwebp or an FFmpeg build with libwebp support');
}
for (const id of ids) {
  const input = join(root, `media/clips/clip-${id}.mp4`);
  if (!dryRun) await access(input);
  for (const profile of profiles) {
    const target = join(root, `public/frames/${profile.name}/s${id}`);
    if (dryRun) {
      console.log(
        `clip-${id}.mp4 → ${profile.name}/s${id}: ${profile.fps} fps, ${profile.width}px WebP, quality 80`,
      );
      continue;
    }
    await mkdir(join(root, `public/frames/${profile.name}`), {
      recursive: true,
    });
    try {
      await access(target);
      throw new Error(`${target} exists; move it aside before re-extracting`);
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
    const staging = await mkdtemp(
      join(root, `public/frames/${profile.name}/.extract-`),
    );
    try {
      const pngDir = join(staging, 'png');
      if (!nativeWebp) await mkdir(pngDir);
      run([
        '-hide_banner',
        '-loglevel',
        'error',
        '-i',
        input,
        '-an',
        '-vf',
        `fps=${profile.fps},scale=${profile.width}:-2`,
        ...(nativeWebp
          ? ['-c:v', 'libwebp', '-quality', '80']
          : ['-c:v', 'png']),
        '-start_number',
        '0',
        nativeWebp
          ? join(staging, 'frame-%04d.webp')
          : join(pngDir, 'frame-%04d.png'),
      ]);
      if (!nativeWebp) {
        for (const file of (await readdir(pngDir)).sort()) {
          run(
            [
              '-quiet',
              '-q',
              '80',
              join(pngDir, file),
              '-o',
              join(staging, file.replace('.png', '.webp')),
            ],
            'cwebp',
          );
          await rm(join(pngDir, file));
        }
        await rm(pngDir, { recursive: true });
      }
      const files = (await readdir(staging))
        .filter((name) => /^frame-\d{4}\.webp$/.test(name))
        .sort();
      if (
        !files.length ||
        files.some(
          (file, index) =>
            file !== `frame-${String(index).padStart(4, '0')}.webp`,
        )
      )
        throw new Error('Extracted frame sequence is empty or non-contiguous');
      await rename(staging, target);
      const scene = manifest.scenes.find((item) => item.id === id);
      scene[profile.name] = {
        count: files.length,
        pattern: `/frames/${profile.name}/s${id}/frame-{frame}.webp`,
        fps: profile.fps,
        width: profile.width,
      };
      const tempManifest = manifestPath + '.tmp';
      await writeFile(tempManifest, JSON.stringify(manifest, null, 2) + '\n');
      await rename(tempManifest, manifestPath);
      console.log(`Scene ${id}: ${files.length} ${profile.name} frames ready.`);
    } finally {
      await rm(staging, { recursive: true, force: true });
    }
  }
}
