import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import assets from "../config/landmark-media.json";

// Restore only the four reviewed, licensed renditions. Changed bytes require review.
await mkdir("public/photos", { recursive: true });
for (const [id, asset] of Object.entries(assets)) {
  const path = `public${asset.src}`;
  let bytes: Buffer;
  try { bytes = await readFile(path); }
  catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    const response = await fetch(asset.downloadUrl, {
      headers: { "User-Agent": "Muqdisho3D/1.0 (local educational map; licensed asset restore)" },
      signal: AbortSignal.timeout(30000),
    });
    if (!response.ok) throw new Error(`${id}: HTTP ${response.status}`);
    bytes = Buffer.from(await response.arrayBuffer());
  }
  const digest = createHash("sha256").update(bytes).digest("hex");
  if (digest !== asset.sha256) throw new Error(`${id}: rendition changed; review before updating the manifest`);
  await writeFile(path, bytes);
  console.log(`${id}: verified ${asset.license}, ${bytes.byteLength} bytes`);
}
