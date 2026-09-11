# Slice configuration

## View and build

Requires Node.js 22.13+ and npm. No API key is needed to view the supplied assets.

```sh
npm ci
npm run dev -- --port 58349
# Or build and preview:
npm run build
npm start -- --host 127.0.0.1 --port 58349 --strictPort
```

Stop development before starting preview on the same port. Static output is dist/client. Existing Sites metadata records the original private deployment; it is not a credential and does not give a clone permission to deploy to that Site.

## Optional media regeneration

Install FFmpeg and cwebp. Use Codex's built-in ImageGen for stills. Only video scripts require OPENROUTER_API_KEY. Set it privately through your shell/secret manager. Optional OPENROUTER_VIDEO_MODEL defaults to bytedance/seedance-2.5. SLICE_VIDEO_SEED is numeric randomness control, not a key; selected per-clip seeds are in content/video-production.json.

No environment file or example is included. Existing scripts can read a locally created ignored .env.local, but it is not required when shell variables are supplied. Paid submission is explicit and must follow still-hash review gates. Original provider job records are intentionally excluded, so do not submit just to recover already included clips.

```sh
npm test
npm run typecheck
npm run lint:app
```

The existing full lint command includes unused starter UI findings; authored-code lint is lint:app. See production notes for dependency and visual limitations.
