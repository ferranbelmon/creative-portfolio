import fs from "node:fs/promises";
import path from "node:path";

const pages = {
  espurna: "https://www.stupe.digital/gallery/espurna",
  collide: "https://www.stupe.digital/gallery/collide",
  ciclic: "https://www.stupe.digital/gallery/ciclic",
  "moonai-soundwaves-wellness":
    "https://www.stupe.digital/gallery/moonai-immersive-space",
  "ciclic-live-av": "https://www.stupe.digital/gallery/ciclicliveav",
  "mostra-festival-2022":
    "https://www.stupe.digital/gallery/mostra22-livevisuals",
  "color-conversations": "https://www.stupe.digital/gallery/2-5d",
  "centrifuge-nft":
    "https://www.stupe.digital/gallery/project-three-8zgh7-ggzz9",
  wonders: "https://www.stupe.digital/gallery/wonders",
  "dansa-del-cosmos": "https://www.stupe.digital/gallery/dansa-del-cosmos",
  o: "https://www.stupe.digital/gallery/project-three-8zgh7-ggzz9-9ym27-yjnx9",
};

const extraImages = {
  ciclic: [
    "https://images.squarespace-cdn.com/content/v1/6538272569b37727ae830400/1720383845242-81LBIY1C7OIQNX2GRR0W/DSC07218.jpg",
  ],
  "ciclic-live-av": [
    "https://images.squarespace-cdn.com/content/v1/6538272569b37727ae830400/40ad8597-3898-4013-81f1-c45708354736/ciclic_live_edit.jpg",
  ],
};

const imagesRoot = path.join(process.cwd(), "public", "images", "projects");

function assetId(url) {
  const match = url.match(
    /\/6538272569b37727ae830400\/([a-f0-9-]+)\/([^?]+)/i,
  );
  if (!match) return url;
  return `${match[1]}/${decodeURIComponent(match[2])}`;
}

function sanitizeFilename(name) {
  return name
    .replace(/[<>:"/\\|?*]/g, "-")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

function extensionFromUrl(url) {
  const pathname = new URL(url).pathname;
  const ext = path.extname(pathname).toLowerCase();
  if (ext) return ext;
  return ".jpg";
}

async function scrapeGalleryUrls(pageUrl) {
  const response = await fetch(pageUrl);
  const html = await response.text();
  const matches = html.matchAll(
    /https:\/\/images\.squarespace-cdn\.com\/content\/v1\/6538272569b37727ae830400\/[^"'\s<>]+/g,
  );

  const seen = new Set();
  const urls = [];

  for (const match of matches) {
    let url = match[0].replace(/&quot;.*$/, "");
    if (url.includes("?format=")) continue;
    if (url.includes("favicon.ico")) continue;

    const id = assetId(url);
    if (seen.has(id)) continue;
    seen.add(id);
    urls.push(url);
  }

  return urls;
}

async function downloadFile(url, dest) {
  await fs.mkdir(path.dirname(dest), { recursive: true });
  const response = await fetch(`${url}?format=2500w`);
  if (!response.ok) {
    throw new Error(`Failed ${url}: ${response.status}`);
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  await fs.writeFile(dest, buffer);
  return buffer.length;
}

const manifest = {};

for (const [slug, pageUrl] of Object.entries(pages)) {
  console.log(`\n=== ${slug} ===`);
  const urls = [...(await scrapeGalleryUrls(pageUrl)), ...(extraImages[slug] ?? [])];
  const unique = [];
  const seen = new Set();

  for (const url of urls) {
    const id = assetId(url);
    if (seen.has(id)) continue;
    seen.add(id);
    unique.push(url);
  }

  const galleryDir = path.join(imagesRoot, slug, "gallery");
  await fs.mkdir(galleryDir, { recursive: true });
  const localPaths = [];

  for (let i = 0; i < unique.length; i++) {
    const url = unique[i];
    const basename = sanitizeFilename(
      path.basename(new URL(url).pathname, extensionFromUrl(url)),
    );
    const filename = `${String(i + 1).padStart(2, "0")}-${basename}${extensionFromUrl(url)}`;
    const dest = path.join(galleryDir, filename);
    const size = await downloadFile(url, dest);
    const publicPath = `/images/projects/${slug}/gallery/${filename}`;
    localPaths.push(publicPath);
    console.log(`  ${filename} (${Math.round(size / 1024)} KB)`);
  }

  manifest[slug] = localPaths;
}

const manifestPath = path.join(process.cwd(), "scripts", "gallery-manifest.json");
await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2));
console.log(`\nManifest written to ${manifestPath}`);
