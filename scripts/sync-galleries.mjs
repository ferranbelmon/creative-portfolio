/**
 * Sync gallery folders → content/projects.ts
 *
 * 1. Renames messy uploads (e.g. WhatsApp Video …) to the next free NN.ext
 * 2. Rewrites each project's `images: [...]` from files on disk
 *
 * Usage: npm run sync-galleries
 * Optional: npm run sync-galleries -- --dry-run
 */
import fs from "node:fs/promises";
import path from "node:path";

const dryRun = process.argv.includes("--dry-run");
const root = process.cwd();
const projectsPath = path.join(root, "content", "projects.ts");
const projectsRoot = path.join(root, "public", "images", "projects");

const MEDIA_EXT = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".gif",
  ".webp",
  ".mp4",
  ".webm",
  ".mov",
]);

const NORMALIZED = /^(\d{2})\.[a-z0-9]+$/i;

function naturalSort(a, b) {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
}

async function listProjects(content) {
  const projects = [];
  const re = /id:\s*"([^"]+)"[\s\S]*?slug:\s*"([^"]+)"/g;
  let match;
  while ((match = re.exec(content))) {
    projects.push({ id: match[1], slug: match[2] });
  }
  return projects;
}

async function ensureNormalizedNames(folderKey, galleryDir) {
  const entries = (await fs.readdir(galleryDir, { withFileTypes: true }))
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .filter((name) => MEDIA_EXT.has(path.extname(name).toLowerCase()));

  const normalized = [];
  const messy = [];

  for (const name of entries) {
    if (NORMALIZED.test(name)) normalized.push(name);
    else messy.push(name);
  }

  messy.sort(naturalSort);

  let nextIndex =
    normalized.reduce((max, name) => {
      const n = Number.parseInt(name.slice(0, 2), 10);
      return Number.isFinite(n) ? Math.max(max, n) : max;
    }, 0) + 1;

  const renames = [];

  for (const name of messy) {
    const ext = path.extname(name).toLowerCase();
    const nextName = `${String(nextIndex).padStart(2, "0")}${ext}`;
    nextIndex += 1;
    renames.push({ from: name, to: nextName });
  }

  for (const { from, to } of renames) {
    console.log(`${folderKey}: ${from} -> ${to}`);
    if (!dryRun) {
      await fs.rename(path.join(galleryDir, from), path.join(galleryDir, to));
    }
  }

  const finalNames = [
    ...normalized,
    ...renames.map((r) => (dryRun ? r.to : r.to)),
  ];

  // In dry-run, disk still has old names; report intended final list.
  if (dryRun) {
    return [...normalized, ...renames.map((r) => r.to)].sort(naturalSort);
  }

  const after = (await fs.readdir(galleryDir))
    .filter((name) => MEDIA_EXT.has(path.extname(name).toLowerCase()))
    .sort(naturalSort);

  return after;
}

function buildImagesBlock(folderKey, fileNames) {
  const lines = fileNames.map(
    (name) => `      "/images/projects/${folderKey}/gallery/${name}",`,
  );
  return `images: [\n${lines.join("\n")}\n    ],`;
}

function replaceProjectImages(content, slug, imagesBlock) {
  const slugAnchor = `slug: "${slug}"`;
  const slugIndex = content.indexOf(slugAnchor);
  if (slugIndex === -1) {
    console.warn(`Could not find slug: ${slug}`);
    return content;
  }

  // Limit search to this project object (until next top-level `{` project or end of array).
  const afterSlug = content.slice(slugIndex);
  const nextProject = afterSlug.search(/\n  \},\n  \{/);
  const projectSlice =
    nextProject === -1 ? afterSlug : afterSlug.slice(0, nextProject + 5);

  const imagesMatch = projectSlice.match(/images:\s*\[[\s\S]*?\],\n/);
  if (imagesMatch) {
    const updatedSlice = projectSlice.replace(
      imagesMatch[0],
      `${imagesBlock}\n`,
    );
    return (
      content.slice(0, slugIndex) +
      updatedSlice +
      content.slice(slugIndex + projectSlice.length)
    );
  }

  // Insert after thumbnail if present, otherwise after category line.
  const thumbnailMatch = projectSlice.match(/thumbnail:\s*"[^"]+",\n/);
  if (thumbnailMatch) {
    const updatedSlice = projectSlice.replace(
      thumbnailMatch[0],
      `${thumbnailMatch[0]}    ${imagesBlock}\n`,
    );
    return (
      content.slice(0, slugIndex) +
      updatedSlice +
      content.slice(slugIndex + projectSlice.length)
    );
  }

  const categoryMatch = projectSlice.match(/category:\s*"[^"]+",\n/);
  if (categoryMatch) {
    const updatedSlice = projectSlice.replace(
      categoryMatch[0],
      `${categoryMatch[0]}    ${imagesBlock}\n`,
    );
    return (
      content.slice(0, slugIndex) +
      updatedSlice +
      content.slice(slugIndex + projectSlice.length)
    );
  }

  console.warn(`Could not insert images for slug: ${slug}`);
  return content;
}

let content = await fs.readFile(projectsPath, "utf8");
const projects = await listProjects(content);

let changedProjects = 0;

for (const { id, slug } of projects) {
  const folderKey = `${id}-${slug}`;
  const galleryDir = path.join(projectsRoot, folderKey, "gallery");

  try {
    await fs.access(galleryDir);
  } catch {
    continue;
  }

  const fileNames = await ensureNormalizedNames(folderKey, galleryDir);
  if (!fileNames.length) continue;

  const imagesBlock = buildImagesBlock(folderKey, fileNames);
  const next = replaceProjectImages(content, slug, imagesBlock);
  if (next !== content) {
    content = next;
    changedProjects += 1;
    console.log(
      `${folderKey}: wired ${fileNames.length} media file(s) into projects.ts`,
    );
  }
}

if (!dryRun) {
  await fs.writeFile(projectsPath, content);
}

console.log(
  `\n${dryRun ? "[dry-run] " : ""}Synced ${changedProjects} project(s).`,
);
