import { readFile, access } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const pending = new Set(
  process.argv.slice(2).map((id) => String(Number(id)).padStart(2, '0')),
);
if (
  !pending.size ||
  [...pending].some((id) => !['01', '02', '03', '04', '05', '06'].includes(id))
)
  throw new Error(
    'Pass existing scene jobs, for example: node scripts/collect-videos.mjs 1 5',
  );
const run = (args) =>
  new Promise((done, reject) => {
    const child = spawn(process.execPath, args, {
      cwd: root,
      stdio: 'inherit',
    });
    child.on('error', reject);
    child.on('exit', (code) =>
      code === 0 ? done() : reject(new Error(`${args[0]} exited ${code}`)),
    );
  });
for (let attempt = 0; attempt < 30 && pending.size; attempt++) {
  await Promise.all(
    [...pending].map((id) => run(['scripts/video.mjs', 'poll', id])),
  );
  for (const id of pending) {
    const job = JSON.parse(
      await readFile(resolve(root, `media/jobs/clip-${id}.json`), 'utf8'),
    );
    if (['failed', 'cancelled'].includes(job.status))
      throw new Error(
        `Scene ${id} ${job.status}; inspect its saved job record.`,
      );
    if (job.status !== 'completed') continue;
    if (!job.downloaded) await run(['scripts/video.mjs', 'download', id]);
    try {
      await access(resolve(root, `media/review/clip-${id}/metrics.json`));
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
      await run(['scripts/review-video.mjs', id]);
    }
    pending.delete(id);
    console.log(`Scene ${id} is downloaded and ready for visual review.`);
  }
  if (pending.size) await new Promise((done) => setTimeout(done, 45000));
}
if (pending.size) {
  console.log(
    `Polling window ended. Saved jobs remain resumable: ${[...pending].join(', ')}.`,
  );
  process.exitCode = 2;
}
