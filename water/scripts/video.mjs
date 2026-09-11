import {
  readFile,
  writeFile,
  mkdir,
  open,
  unlink,
  access,
  rename,
} from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { loadEnvFile } from 'node:process';
import { createHash } from 'node:crypto';
import { join, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
if (existsSync(join(root, '.env.local'))) loadEnvFile(join(root, '.env.local'));
const key = process.env.OPENROUTER_API_KEY?.trim();
const [command = 'help', sceneInput] = process.argv.slice(2);
const id = String(Number(sceneInput)).padStart(2, '0');
const jobDir = join(root, 'media/jobs');
const jobPath = join(jobDir, `clip-${id}.json`);
const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');
const readJson = async (file) => JSON.parse(await readFile(file, 'utf8'));
const save = async (file, data) => {
  await writeFile(file + '.tmp', JSON.stringify(data, null, 2) + '\n');
  await rename(file + '.tmp', file);
};
const redact = (value) =>
  String(value)
    .replaceAll(key || 'NEVER_A_KEY', '[REDACTED]')
    .replace(/data:image\/[^;]+;base64,[A-Za-z0-9+/=]+/g, '[image data]');
const summary = (job) => ({
  scene: job.scene,
  id: job.id,
  status: job.status,
  seed: job.seed,
  cost: job.usage?.cost ?? null,
  error: job.error || null,
  downloaded: job.downloaded || false,
});

async function api(path, options = {}) {
  if (!key) throw new Error('OPENROUTER_API_KEY is missing in .env.local');
  const response = await fetch(`https://openrouter.ai/api/v1${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
    signal: AbortSignal.timeout(60000),
    redirect: 'error',
  });
  const text = await response.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`OpenRouter returned non-JSON HTTP ${response.status}`);
  }
  if (!response.ok) {
    const error = new Error(
      `HTTP ${response.status}: ${redact(data.error?.message || text).slice(0, 1500)}`,
    );
    error.status = response.status;
    throw error;
  }
  return data;
}
async function requestBody() {
  const plan = await readJson(join(root, 'content/video-production.json'));
  const clip = plan.clips.find((item) => item.id === id);
  if (!clip) throw new Error('Scene must be 1 through 6');
  const review = await readJson(join(root, 'media/stills/review.json'));
  if (review.status !== 'accepted')
    throw new Error(
      'All stills must be visually accepted before video submission',
    );
  for (const file of [
    'reference-melon.png',
    ...Array.from(
      { length: 7 },
      (_, i) => `end-${String(i).padStart(2, '0')}.png`,
    ),
  ]) {
    const bytes = await readFile(join(root, 'media/stills/final', file));
    if (review.sha256[file] !== sha256(bytes))
      throw new Error(`Still changed since review: ${file}`);
  }
  const first = await readFile(
    join(root, 'media/stills/final', clip.firstFrame),
  );
  const last = await readFile(join(root, 'media/stills/final', clip.lastFrame));
  const reference = await readFile(
    join(root, 'media/stills/final', 'reference-melon.png'),
  );
  const seed = Number(
    clip.seed ?? (process.env.SLICE_VIDEO_SEED?.trim() || plan.seed),
  );
  if (!Number.isInteger(seed) || seed < 0 || seed > 2147483647)
    throw new Error('Seed must be an integer from 0 to 2147483647');
  const asImage = (bytes) => ({
    type: 'image_url',
    image_url: { url: `data:image/png;base64,${bytes.toString('base64')}` },
  });
  const body = {
    model: process.env.OPENROUTER_VIDEO_MODEL || plan.model,
    prompt: clip.prompt,
    duration: 8,
    resolution: '720p',
    aspect_ratio: '16:9',
    generate_audio: false,
    seed,
    frame_images: [
      { ...asImage(first), frame_type: 'first_frame' },
      { ...asImage(last), frame_type: 'last_frame' },
    ],
    input_references: [asImage(reference)],
    provider: { options: { seed: { parameters: { watermark: false } } } },
  };
  const preview = {
    ...body,
    frame_images: [
      {
        file: clip.firstFrame,
        frame_type: 'first_frame',
        sha256: sha256(first),
      },
      { file: clip.lastFrame, frame_type: 'last_frame', sha256: sha256(last) },
    ],
    input_references: [
      { file: 'reference-melon.png', sha256: sha256(reference) },
    ],
  };
  return { body, preview };
}
async function download(job) {
  let url = new URL(
    `https://openrouter.ai/api/v1/videos/${encodeURIComponent(job.id)}/content?index=0`,
  );
  let response;
  for (let redirects = 0; redirects < 6; redirects++) {
    if (url.protocol !== 'https:')
      throw new Error('Video download must use HTTPS');
    const headers =
      url.origin === 'https://openrouter.ai'
        ? { Authorization: `Bearer ${key}` }
        : {};
    response = await fetch(url, {
      headers,
      redirect: 'manual',
      signal: AbortSignal.timeout(60000),
    });
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get('location');
      if (!location) throw new Error('Download redirect lacks location');
      url = new URL(location, url);
      continue;
    }
    break;
  }
  if (!response?.ok)
    throw new Error(`Video download returned HTTP ${response?.status}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.subarray(4, 8).toString() !== 'ftyp')
    throw new Error('Downloaded response is not an MP4');
  const dest = join(root, `media/clips/clip-${id}.mp4`);
  await mkdir(join(root, 'media/clips'), { recursive: true });
  try {
    await access(dest);
    throw new Error(`${dest} already exists; refusing overwrite`);
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  await writeFile(dest + '.part', bytes);
  await rename(dest + '.part', dest);
  job.downloaded = true;
  job.downloadedBytes = bytes.length;
  job.videoSha256 = sha256(bytes);
  await save(jobPath, job);
  console.log(JSON.stringify(summary(job)));
}

try {
  if (command === 'help')
    console.log(
      'node scripts/video.mjs <prepare|submit|poll|download> <scene 1-6>',
    );
  else {
    if (!['01', '02', '03', '04', '05', '06'].includes(id))
      throw new Error('Scene must be 1 through 6');
    await mkdir(jobDir, { recursive: true });
    if (command === 'prepare') {
      const { preview } = await requestBody();
      console.log(JSON.stringify(preview, null, 2));
    } else if (command === 'submit') {
      if (existsSync(jobPath))
        throw new Error(
          `Existing job record for clip ${id}; poll it instead of submitting again`,
        );
      const { body, preview } = await requestBody();
      const { data: models } = await api('/videos/models');
      const model = models.find((item) => item.id === body.model);
      if (
        !model?.supported_durations?.includes(8) ||
        !model.supported_resolutions?.includes('720p') ||
        !model.supported_aspect_ratios?.includes('16:9') ||
        !model.supported_frame_images?.includes('last_frame')
      )
        throw new Error('Selected model no longer supports the requested clip');
      if (!model.allowed_passthrough_parameters?.includes('watermark'))
        delete body.provider;
      const lock = await open(jobPath + '.lock', 'wx');
      const job = {
        scene: id,
        status: 'submitting',
        seed: body.seed,
        submittedAt: new Date().toISOString(),
        request: preview,
      };
      try {
        await save(jobPath, job);
        const result = await api('/videos', {
          method: 'POST',
          body: JSON.stringify(body),
        });
        if (!result.id)
          throw new Error(
            'Submission response omitted job ID; do not resubmit automatically',
          );
        Object.assign(job, result);
        await save(jobPath, job);
        console.log(JSON.stringify(summary(job)));
      } catch (error) {
        job.status =
          error.status && error.status < 500
            ? 'submission_rejected'
            : 'submission_uncertain';
        job.error = redact(error.message);
        await save(jobPath, job);
        throw error;
      } finally {
        await lock.close();
        await unlink(jobPath + '.lock');
      }
    } else if (command === 'poll') {
      const job = await readJson(jobPath);
      if (!job.id)
        throw new Error(
          'No known job ID. Resolve the existing submission before trying again',
        );
      Object.assign(job, await api(`/videos/${encodeURIComponent(job.id)}`), {
        lastPolledAt: new Date().toISOString(),
      });
      await save(jobPath, job);
      console.log(JSON.stringify(summary(job)));
    } else if (command === 'download') {
      const job = await readJson(jobPath);
      if (job.status !== 'completed')
        throw new Error('Poll until job completes before downloading');
      if (job.downloaded) console.log(JSON.stringify(summary(job)));
      else await download(job);
    } else throw new Error('Unknown command');
  }
} catch (error) {
  console.error(redact(error.message));
  process.exitCode = 1;
}
