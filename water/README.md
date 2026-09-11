# Slice

A watermelon scroll story for a Dugsiiye tutorial. Six connected scenes follow one fruit from melon to glass, with the supplied English copy, 11 viewport heights of pinned motion, and normal ingredients, story, demo CTA and footer sections.

React, TypeScript and Vinext/Vite, based on the supplied Sites starter. The production site exports to static files. The browser plays local WebP sequences; it never calls a generation API.

## Completed media

Six reviewed 720p silent clips form a 48.25-second story. Eight paid attempts (including two composition retries) cost **$14.86872** on OpenRouter. The browser uses **1,158 desktop frames and 774 mobile frames**, plus seven optimized posters. The full MP4 is preserved locally at `media/slice-story.mp4`.

The opening uses a minimal camera move. The pour still exceeds its raw-image composition prompt, so every scene uses the same display scale to keep the action before desktop copy and visible on mobile. See the [production notes](docs/production-notes.md) and [actual clip, cost and join report](docs/media-report.json).

## Run locally

```sh
npm install
npm run dev -- --port 3000
```

Run `npm run build` for the static output in `dist/client`, then `npm start` to preview it at http://127.0.0.1:3001. Hosting configuration is in `.openai/hosting.json`.

## Media production

All creative still generation and edits use **Codex's built-in ImageGen tool**. An OpenAI key is not required. Originals and selected crops are preserved locally in `media/stills`. Optimized website posters are in `public/stills`.

OpenRouter is used only by local scripts for Seedance 2.5 video. Put `OPENROUTER_API_KEY` in ignored `.env.local`. `SLICE_VIDEO_SEED` is a number that controls the generation's random starting state; it is not a credential. The selected seed is locked after the press clip passes review. Leaving it blank uses the candidate value in `content/video-production.json`.

Paid video submission requires the exact reviewed still hashes. Existing job records prevent accidental duplicate submissions. Poll a saved job instead of submitting it again. If a submission has an uncertain outcome, resolve that job before retrying. Generation is never triggered automatically by the site.

```sh
npm run media:check
npm run media:video -- prepare 4
npm run media:video -- submit 4
npm run media:video -- poll 4
npm run media:video -- download 4
node scripts/review-video.mjs 4
npm run media:extract -- 4
```

`node scripts/collect-videos.mjs 1 5` can poll, download and prepare review sheets for already submitted jobs. It never submits a new job.

The press clip is reviewed first. Inspect the actual contact sheet and first/last frames before accepting a clip or generating its dependent scene. SSIM is supporting evidence, not a substitute for visual review.

Extraction uses FFmpeg and cwebp (or an FFmpeg build with libwebp). Desktop: 24fps, 1280px. Mobile: 16fps, 960px. Both use WebP quality 80. Original MP4s stay local in `media/clips`. Public sequences and their actual counts are tracked with the site source. Existing exports are protected from accidental overwrite.

## Source of truth

- [Exact supplied storyboard](docs/storyboard.md)
- [Production decisions and limitations](docs/production-notes.md)
- [Key-still candidates and prompts](docs/key-still-candidates.json)
- [Chained edits, candidates and selected parents](docs/end-frame-chain.json)
- [Actual video prompts and controls](content/video-production.json)
- [Scene copy, scroll timing and frame mapping](lib/story.ts)
- [Published frame inventory](public/frames/manifest.json)

## Checks

```sh
npm test
npm run typecheck
npm run lint:app
npm run build
```

Tests cover frame-cache races, concurrency, eviction and failure recovery, plus real-video extraction, overwrite protection, media format checks and boundary comparison. App lint is scoped to authored code. The unused starter UI catalog has separate lint findings.

The initial dependency install reported 11 audit findings. Dependencies have not been upgraded as part of this media build. Deployment uses static files, with no React server function endpoint or runtime image optimizer. Eight tests, TypeScript and scoped lint pass. The static build and local HTTP preview pass. All actual clip boundaries and contact sheets were visually inspected. No browser interaction or screenshot QA has been performed.
