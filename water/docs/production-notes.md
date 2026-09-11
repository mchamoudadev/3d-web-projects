# Production notes

The exact updated brief is preserved in [storyboard.md](storyboard.md). Later user direction takes precedence: every still uses Codex's built-in ImageGen tool. No external image API or OpenAI key is used. OpenRouter is used only for Seedance video. The built-in tool does not expose the named Flare/Sunburst selectors or the quality controls described in the original brief.

## Selected stills

Four key candidates were explored; candidate 3 became the reference. Six chained end frames were selected from 17 additional built-in calls: 14 candidates, including a superseded scene-03 branch, plus three precision revisions. Exact prompts, image parents, candidate paths and review notes are in [key-still-candidates.json](key-still-candidates.json) and [end-frame-chain.json](end-frame-chain.json).

Each selected original is 1536×1024. Every final uses the same mechanical crop: 80 pixels off the top and bottom, producing 1536×864. All selected originals and the final contact sheet were visually inspected before the first paid video submission. The subjects remain within the left 55%, with clean space for website copy. Minor generative pixel variation remains.

Local originals and crops are under media/stills; public/stills contains the selected website posters. The local review record hashes all eight inputs, including the identical reference and end-00 copies. Video submission refuses inputs changed after review.

## Continuity decisions

[video-production.json](../content/video-production.json) contains the actual motion prompts. The original prompts remain preserved in the brief and generation plan.

- Scene 01 uses a nearly locked one-degree camera micro-arc between the two supplied front views. Its first attempt drifted into the headline area and was rejected. The accepted retry keeps the colored melon silhouette within 52.08% of frame width across all 193 decoded frames.
- Scene 03 describes the empty bottle sliding into position while the cubes rise. The original thin foreground slice stays untouched.
- Scene 04 describes the empty rinds sliding out at the lower left. It retains the same foreground slice instead of inventing a new wedge.
- Scene 05 describes the ice glass sliding in from the left. The bottle, slice and later glass retain their placement through scene 06.

## Final presentation framing

Both pour attempts extended the tilted bottle beyond the requested left-55% guide in the raw video. The second attempt has coherent pouring and matching boundaries, so it is used with the same display framing applied to every scene and poster. Desktop image width is 84% of the stage; mobile is 150% with a 2% left offset and contain sizing. A subject ending at 65% of a source frame therefore stays within 54.6% of the desktop stage and 99.5% of mobile width. No generated video pixels are distorted or repainted. The raw pour remains wider than its prompt; the website composition accommodates it.

The all-frame color check for the selected pour found a maximum saturated-pixel extent of 61.98%, which presents at 52.06% on desktop and 94.97% on mobile. This check supports the visual review; it does not segment transparent glass.

## OpenRouter controls

The [model catalog](https://openrouter.ai/api/v1/videos/models) was checked on 2026-09-09 and again at submission. Seedance 2.5 supports eight seconds, 720p, 16:9, first and last frames, and a seed. The configured key passed authentication. Audio is disabled. No generation runs on page load.

The catalog does not expose return_last_frame, so the review script extracts the actual final video frame locally. Each request includes the reference image as requested; [OpenRouter documents](https://openrouter.ai/docs/guides/overview/multimodal/video-generation) that first/last frames take precedence when both input modes are provided. Additional reference influence is therefore not assumed; identity is also carried by the edited boundary frames.

The press clip passed visual review first and locked seed 9042026. The opening and pour each needed one composition retry; only those failed clips use new seeds, 9042027 and 9042028 respectively. Rejected attempts and their charged jobs are preserved in local media archive folders. Job records are written before submission and the returned ID is saved immediately. Existing records prevent accidental duplicate paid submissions. Uncertain submissions require investigation instead of automatic retries.

## Review and export

Each downloaded clip is probed for 1280×720, approximately eight seconds and no audio stream. A 16-sample contact sheet, eight first/last-second samples and the actual terminal frames support visual review. SSIM against the planned boundaries is recorded as supporting evidence, not proof of seamless motion.

Accepted clips are extracted to WebP quality 80 at 24fps/1280px for desktop and 16fps/960px for mobile. This installation uses FFmpeg for decoding and the installed cwebp encoder. Extraction stages files before publishing each contiguous sequence and writes actual counts to public/frames/manifest.json. Existing exports are never silently overwritten.

The renderer loads a bounded neighborhood of frames, keeps at most 40 decoded images and limits network loads to six at a time. Reduced-motion users see the selected posters. All copy and the post-story sections remain normal HTML.

## Hosting and verification

All six clips are integrated, with 1,158 desktop and 774 mobile frames. The joined local film is 48.25 seconds, 1280×720 and silent. Eight attempts cost $14.86872, including the two rejected attempts. All five joins passed side-by-side visual review; actual full-frame SSIM is 0.989016–0.992254, with minor pixel differences preserved.

The site is a static export; API credentials and production job records remain local. A private Site is registered for the final publication. Runtime image parsing and React server functions are not shipped in the static export.

The final media report records individual clip reviews, actual frame inventory, both selected and rejected attempt costs, and comparisons across the five video joins. No browser interaction or screenshot QA has been performed. The initial starter had 11 dependency audit findings and separate lint findings in unused vendored UI; these have not been represented as resolved by application checks.
