/**
 * Download a Vimeo video into gallery/videos/backup/ for offline archive.
 * The site uses Vimeo embed; this file is not served on the project page.
 *
 * Usage:
 *   npm run download-vimeo-backup -- 000-dansa-del-cosmos dansa-del-cosmos https://vimeo.com/334427448
 *
 * On Windows, browser cookies often fail (Chrome must be closed, DPAPI errors).
 * Prefer exporting cookies manually:
 *   1. Install Chrome extension "Get cookies.txt LOCALLY"
 *   2. Open vimeo.com (logged in if the video is private)
 *   3. Export cookies → save as scripts/cookies/vimeo.txt
 *   4. npm run download-vimeo-backup -- 000-dansa-del-cosmos dansa-del-cosmos https://vimeo.com/334427448 --cookies scripts/cookies/vimeo.txt
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const args = process.argv.slice(2);

function readFlag(name) {
  const index = args.indexOf(name);
  if (index === -1) return null;
  return args[index + 1] ?? null;
}

function argsWithoutFlags() {
  const skip = new Set();
  for (let i = 0; i < args.length; i += 1) {
    if (args[i].startsWith("--")) {
      skip.add(i);
      if (i + 1 < args.length && !args[i + 1].startsWith("--")) {
        skip.add(i + 1);
      }
    }
  }
  return args.filter((_, index) => !skip.has(index));
}

const cookiesFile = readFlag("--cookies");
const cookiesBrowser = readFlag("--cookies-from-browser");
const positional = argsWithoutFlags();
const [folderKey, basename, url] = positional;

if (!folderKey || !basename || !url) {
  console.error(`Usage:
  npm run download-vimeo-backup -- <id-slug-folder> <filename> <vimeo-url>
  npm run download-vimeo-backup -- ... --cookies scripts/cookies/vimeo.txt
  npm run download-vimeo-backup -- ... --cookies-from-browser chrome

Windows tip: if browser cookies fail, export cookies.txt (see script header).`);
  process.exit(1);
}

const ytDlp = path.join(process.cwd(), "scripts", "bin", "yt-dlp.exe");
if (!fs.existsSync(ytDlp)) {
  console.error("Missing scripts/bin/yt-dlp.exe");
  process.exit(1);
}

const outDir = path.join(
  process.cwd(),
  "public",
  "images",
  "projects",
  folderKey,
  "gallery",
  "videos",
  "backup",
);
fs.mkdirSync(outDir, { recursive: true });

const output = path.join(outDir, `${basename}.%(ext)s`);
const command = [url, "-o", output, "--merge-output-format", "mp4"];

if (cookiesFile) {
  const resolved = path.resolve(cookiesFile);
  if (!fs.existsSync(resolved)) {
    console.error(`Cookies file not found: ${resolved}`);
    process.exit(1);
  }
  command.unshift(resolved);
  command.unshift("--cookies");
} else if (cookiesBrowser) {
  command.unshift(cookiesBrowser);
  command.unshift("--cookies-from-browser");
  console.warn(
    "Using browser cookies. On Windows: close Chrome/Edge completely first.",
  );
  console.warn(
    "If you see DPAPI / cookie database errors, use --cookies scripts/cookies/vimeo.txt instead.",
  );
}

console.log(`Saving to ${outDir}`);
const result = spawnSync(ytDlp, command, { stdio: "inherit", shell: false });

if (result.status !== 0) {
  console.error(`
Download failed.

Reliable fix on Windows:
  1. Chrome extension: "Get cookies.txt LOCALLY"
  2. Visit https://vimeo.com/334427448
  3. Export → scripts/cookies/vimeo.txt
  4. npm run download-vimeo-backup -- ${folderKey} ${basename} ${url} --cookies scripts/cookies/vimeo.txt

Or download from Vimeo (⋯ menu → Download) and save the file to:
  ${outDir}
`);
}

process.exit(result.status ?? 1);
