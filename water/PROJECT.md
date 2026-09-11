# Slice watermelon scroll story

## How it was made

Built from the supplied six-scene storyboard using React, TypeScript and Vinext/Vite on a Sites starter. A pinned canvas maps scroll progress to local WebP frames; normal HTML carries the copy and subsequent sections. A bounded frame cache preloads nearby frames, handles load failures and uses lower-resolution sequences on mobile. Reduced-motion mode uses posters.

All creative still generation and edits used Codex's built-in ImageGen. Selected stills were chained as first/last-frame inputs to OpenRouter Seedance 2.5 video generation. Six selected silent clips came from eight paid attempts, costing $14.86872 at production time. FFmpeg and cwebp produced 1,158 desktop and 774 mobile frames. The six clips total 48.25 seconds. These are historical production facts, not current provider pricing.

Every scene uses a common display scale because the raw pour clip extends past its requested composition boundary. Existing notes explain this compromise. The source records eight passing tests and media boundary review at production time; browser interaction/screenshot QA was not performed then.

## Setup and resources

- [Configuration and requirements](CONFIGURATION.md)
- [Assets and reference material](RESOURCES.md)
- [Original implementation README](README.md)

This folder is independently installable. No API calls or paid media generation are required by the collection setup itself.
