import { existsSync } from 'node:fs';
import { loadEnvFile } from 'node:process';
if (existsSync('.env.local')) loadEnvFile('.env.local');
const key = process.env.OPENROUTER_API_KEY?.trim();
const modelId = process.env.OPENROUTER_VIDEO_MODEL || 'bytedance/seedance-2.5';
const catalogOnly = process.argv.includes('--catalog-only');
if (!key && !catalogOnly) {
  console.error(
    'Set OPENROUTER_API_KEY in .env.local. Images use the built-in image editing tool and need no API key.',
  );
  process.exitCode = 1;
} else {
  try {
    // This command is read-only and never submits a paid generation.
    const response = await fetch('https://openrouter.ai/api/v1/videos/models', {
      signal: AbortSignal.timeout(30000),
    });
    if (!response.ok)
      throw new Error(`Video catalog returned HTTP ${response.status}`);
    const { data } = await response.json();
    const model = data.find((entry) => entry.id === modelId);
    if (!model)
      throw new Error(
        `${modelId} is not in the current OpenRouter video catalog`,
      );
    for (const [field, required] of [
      ['supported_durations', 8],
      ['supported_resolutions', '720p'],
      ['supported_aspect_ratios', '16:9'],
    ]) {
      if (!model[field]?.includes(required))
        throw new Error(`${modelId} does not list ${required} in ${field}`);
    }
    for (const frame of ['first_frame', 'last_frame']) {
      if (!model.supported_frame_images?.includes(frame))
        throw new Error(`Missing ${frame} support`);
    }
    if (key && !catalogOnly) {
      const auth = await fetch('https://openrouter.ai/api/v1/key', {
        headers: { Authorization: `Bearer ${key}` },
        signal: AbortSignal.timeout(30000),
      });
      if (!auth.ok)
        throw new Error(`OpenRouter key check returned HTTP ${auth.status}`);
      console.log('OpenRouter key accepted.');
    }
    console.log(
      `${modelId}: 8s, 720p, 16:9, first/last frame support verified.`,
    );
    console.log(
      `return_last_frame passthrough listed: ${model.allowed_passthrough_parameters?.includes('return_last_frame') ? 'yes' : 'no; extract the terminal frame locally'}.`,
    );
    console.log(
      'The combined frame + reference mode still needs a provider-specific check before generation. No paid requests sent.',
    );
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
