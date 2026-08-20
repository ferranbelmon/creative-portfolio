/**
 * Prints Squarespace video metadata from a stupe.digital gallery page.
 * Export the file from Squarespace (Pages → … → Download) and save as:
 *   public/images/projects/006-mostra-festival-2022/gallery/videos/mostra22-livevisuals.mp4
 *
 * Usage: node scripts/extract-squarespace-video.mjs <page-url>
 */
import fs from "node:fs/promises";

const url = process.argv[2];
if (!url) {
  console.error("Usage: node scripts/extract-squarespace-video.mjs <page-url>");
  process.exit(1);
}

const html = await (await fetch(url)).text();
const match = html.match(/data-config-video="([^"]+)"/);
if (!match) {
  console.error("No Squarespace native video block found on this page.");
  process.exit(1);
}

const config = JSON.parse(
  match[1]
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&"),
);

console.log("Squarespace video found:");
console.log(JSON.stringify(config, null, 2));
console.log(`
Next step — export from Squarespace admin:
  1. stupe.digital → Pages → this gallery page
  2. Download the video block (or re-upload to get an MP4)
  3. Save as:
     public/images/projects/006-mostra-festival-2022/gallery/videos/mostra22-livevisuals.mp4
  4. Refresh /projects/mostra-festival-2022
`);
