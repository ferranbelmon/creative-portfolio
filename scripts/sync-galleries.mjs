/**
 * Sync gallery folders → content/projects.ts
 *
 * 1. Renames messy uploads (e.g. WhatsApp Video …) to the next free NN.ext
 * 2. Keeps layout names as-is (e.g. 01-1-1.jpg, 02-2-1.jpg, 03-v2h-1.jpg, 04-vh-1.jpg)
 * 3. Rewrites each project's `images: [...]` from files on disk
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

const LEGACY_NAME = /^(\d{2})\.[a-z0-9]+$/i;
/** Row layout: 01-2-1.jpg → row 1, 2 columns, slot 1 */
const EQUAL_NAME = /^(\d{2})-([1-4])-([1-4])\.[a-z0-9]+$/i;
/** Mosaic: 03-v2h-1.jpg → vertical left + 2 horizontals right */
const V2H_NAME = /^(\d{2})-v2h-([1-3])\.[a-z0-9]+$/i;
/** Mosaic: 04-vh-1.jpg → vertical left + horizontal right, same height */
const VH_NAME = /^(\d{2})-vh-([1-2])\.[a-z0-9]+$/i;

function normalizeGalleryFileName(name) {
  return name.trim().replace(/\s+\./, ".");
}

function isLayoutName(name) {
  return EQUAL_NAME.test(name) || V2H_NAME.test(name) || VH_NAME.test(name);
}

function isNormalizedName(name) {
  const normalized = normalizeGalleryFileName(name);
  return LEGACY_NAME.test(normalized) || isLayoutName(normalized);
}

function naturalSort(a, b) {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
}

function warnIncompleteLayoutRows(folderKey, fileNames) {
  const layoutFiles = fileNames.filter((name) => isLayoutName(name));
  if (!layoutFiles.length) return;
  if (layoutFiles.length !== fileNames.length) {
    console.warn(
      `${folderKey}: mixed layout + legacy names — use either 01-2-1.jpg / 01-v2h-1.jpg / 01-vh-1.jpg or 01.jpg, not both`,
    );
    return;
  }

  const equalByRow = new Map();
  const v2hByRow = new Map();
  const vhByRow = new Map();

  for (const name of layoutFiles) {
    const v2h = name.match(V2H_NAME);
    if (v2h) {
      const row = v2h[1];
      const slot = Number.parseInt(v2h[2], 10);
      const list = v2hByRow.get(row) ?? [];
      list.push({ name, slot });
      v2hByRow.set(row, list);
      continue;
    }

    const vh = name.match(VH_NAME);
    if (vh) {
      const row = vh[1];
      const slot = Number.parseInt(vh[2], 10);
      const list = vhByRow.get(row) ?? [];
      list.push({ name, slot });
      vhByRow.set(row, list);
      continue;
    }

    const match = name.match(EQUAL_NAME);
    if (!match) continue;
    const row = match[1];
    const columns = Number.parseInt(match[2], 10);
    const slot = Number.parseInt(match[3], 10);
    const list = equalByRow.get(row) ?? [];
    list.push({ name, columns, slot });
    equalByRow.set(row, list);
  }

  for (const [row, entries] of v2hByRow) {
    const slots = new Set(entries.map((entry) => entry.slot));
    const complete =
      entries.length === 3 && [1, 2, 3].every((slot) => slots.has(slot));
    if (!complete) {
      console.warn(
        `${folderKey}: incomplete mosaic row ${row} — expected ${row}-v2h-1, ${row}-v2h-2, ${row}-v2h-3`,
      );
    }
  }

  for (const [row, entries] of vhByRow) {
    const slots = new Set(entries.map((entry) => entry.slot));
    const complete =
      entries.length === 2 && [1, 2].every((slot) => slots.has(slot));
    if (!complete) {
      console.warn(
        `${folderKey}: incomplete mosaic row ${row} — expected ${row}-vh-1, ${row}-vh-2`,
      );
    }
  }

  for (const [row, entries] of equalByRow) {
    const columns = entries[0].columns;
    const slots = new Set(entries.map((entry) => entry.slot));
    const expected = Array.from({ length: columns }, (_, i) => i + 1);
    const complete =
      entries.length === columns &&
      expected.every((slot) => slots.has(slot)) &&
      entries.every((entry) => entry.columns === columns);

    if (!complete) {
      console.warn(
        `${folderKey}: incomplete row ${row} — expected ${columns} file(s) like ${row}-${columns}-1 … ${row}-${columns}-${columns}`,
      );
    }
  }
}

async function listProjects(content) {
  const projects = [];
  const re = /id:\s*"([^"]+)"[\s\S]*?slug:\s*"([^"]+)"/g;
  let match;
  while ((match = re.exec(content))) {
    const start = match.index;
    const afterSlug = content.slice(start);
    const nextProject = afterSlug.search(/\r?\n  \},\r?\n  \{/);
    const projectSlice =
      nextProject === -1 ? afterSlug : afterSlug.slice(0, nextProject + 5);
    const columnsMatch = projectSlice.match(
      /galleryLayout:\s*\{[\s\S]*?columns:\s*([1-4])/,
    );
    const columns = columnsMatch ? Number.parseInt(columnsMatch[1], 10) : 3;
    projects.push({ id: match[1], slug: match[2], columns });
  }
  return projects;
}

/**
 * Converts legacy 01.jpg names to row layout: 01-3-1.jpg, 01-3-2.jpg, …
 * Skips folders that already contain layout-named files.
 */
async function migrateLegacyGalleryToLayout(
  folderKey,
  galleryDir,
  columns,
) {
  const entries = (await fs.readdir(galleryDir, { withFileTypes: true }))
    .filter((entry) => entry.isFile())
    .map((entry) => normalizeGalleryFileName(entry.name))
    .filter((name) =>
      MEDIA_EXT.has(path.extname(name).toLowerCase()),
    );

  const legacy = entries
    .filter((name) => LEGACY_NAME.test(name))
    .sort(naturalSort);
  const layout = entries.filter((name) => isLayoutName(name));

  if (!legacy.length || layout.length > 0) {
    if (legacy.length && layout.length) {
      console.warn(
        `${folderKey}: mixed layout + legacy names — migrate legacy files manually or remove layout names first`,
      );
    }
    return {};
  }

  const plan = [];
  let rowNum = 1;
  let index = 0;

  while (index < legacy.length) {
    const remaining = legacy.length - index;
    const rowColumns = remaining >= columns ? columns : remaining;

    for (let slot = 1; slot <= rowColumns; slot += 1) {
      const from = legacy[index];
      const ext = path.extname(from);
      const to = `${String(rowNum).padStart(2, "0")}-${rowColumns}-${slot}${ext}`;
      plan.push({ from, to });
      index += 1;
    }

    rowNum += 1;
  }

  const renameMap = {};

  for (let i = 0; i < plan.length; i += 1) {
    const { from, to } = plan[i];
    const tmp = `.__layout_${i}_${to}`;
    console.log(`${folderKey}: ${from} -> ${to}`);
    renameMap[from] = to;
    if (!dryRun) {
      await fs.rename(
        path.join(galleryDir, from),
        path.join(galleryDir, tmp),
      );
    }
  }

  if (!dryRun) {
    for (let i = 0; i < plan.length; i += 1) {
      const { to } = plan[i];
      const tmp = `.__layout_${i}_${to}`;
      await fs.rename(
        path.join(galleryDir, tmp),
        path.join(galleryDir, to),
      );
    }
  }

  return renameMap;
}

function replaceProjectThumbnails(content, slug, renameMap) {
  if (!Object.keys(renameMap).length) return content;

  const slugAnchor = `slug: "${slug}"`;
  const slugIndex = content.indexOf(slugAnchor);
  if (slugIndex === -1) return content;

  const afterSlug = content.slice(slugIndex);
  const nextProject = afterSlug.search(/\r?\n  \},\r?\n  \{/);
  const projectSlice =
    nextProject === -1 ? afterSlug : afterSlug.slice(0, nextProject + 5);

  let updatedSlice = projectSlice;
  for (const [from, to] of Object.entries(renameMap)) {
    updatedSlice = updatedSlice.replace(
      `/gallery/${from}`,
      `/gallery/${to}`,
    );
  }

  if (updatedSlice === projectSlice) return content;

  return (
    content.slice(0, slugIndex) +
    updatedSlice +
    content.slice(slugIndex + projectSlice.length)
  );
}

async function ensureNormalizedNames(folderKey, galleryDir) {
  const entries = (await fs.readdir(galleryDir, { withFileTypes: true }))
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .filter((name) =>
      MEDIA_EXT.has(path.extname(normalizeGalleryFileName(name)).toLowerCase()),
    );

  // Fix accidental spaces before extensions (e.g. "03-2-2 .jpg").
  for (const name of entries) {
    const fixed = normalizeGalleryFileName(name);
    if (fixed !== name) {
      console.log(`${folderKey}: ${name} -> ${fixed}`);
      if (!dryRun) {
        await fs.rename(
          path.join(galleryDir, name),
          path.join(galleryDir, fixed),
        );
      }
    }
  }

  const afterSpaceFix = (await fs.readdir(galleryDir))
    .filter((name) =>
      MEDIA_EXT.has(path.extname(normalizeGalleryFileName(name)).toLowerCase()),
    )
    .map(normalizeGalleryFileName);

  const normalized = [];
  const messy = [];

  for (const name of afterSpaceFix) {
    if (isNormalizedName(name)) normalized.push(name);
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
  const nextProject = afterSlug.search(/\r?\n  \},\r?\n  \{/);
  const projectSlice =
    nextProject === -1 ? afterSlug : afterSlug.slice(0, nextProject + 5);

  const imagesMatch = projectSlice.match(/images:\s*\[[\s\S]*?\],\r?\n/);
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

for (const { id, slug, columns } of projects) {
  const folderKey = `${id}-${slug}`;
  const galleryDir = path.join(projectsRoot, folderKey, "gallery");

  try {
    await fs.access(galleryDir);
  } catch {
    continue;
  }

  const renameMap = await migrateLegacyGalleryToLayout(
    folderKey,
    galleryDir,
    columns,
  );
  if (Object.keys(renameMap).length) {
    content = replaceProjectThumbnails(content, slug, renameMap);
  }

  const fileNames = await ensureNormalizedNames(folderKey, galleryDir);
  if (!fileNames.length) continue;

  warnIncompleteLayoutRows(folderKey, fileNames);

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
