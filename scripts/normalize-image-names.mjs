import fs from "node:fs/promises";
import path from "node:path";

const projectsRoot = path.join(process.cwd(), "public", "images", "projects");
const projectsPath = path.join(process.cwd(), "content", "projects.ts");
const pathUpdates = new Map();

async function normalizeGalleryDir(slug) {
  const galleryDir = path.join(projectsRoot, slug, "gallery");

  try {
    await fs.access(galleryDir);
  } catch {
    return;
  }

  const entries = (await fs.readdir(galleryDir, { withFileTypes: true }))
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

  const tempRenames = [];

  for (let index = 0; index < entries.length; index++) {
    const currentName = entries[index];
    const ext = path.extname(currentName).toLowerCase() || ".jpg";
    const nextName = `${String(index + 1).padStart(2, "0")}${ext}`;
    const currentPath = path.join(galleryDir, currentName);
    const tempPath = path.join(galleryDir, `__tmp_${index}${ext}`);
    const finalPath = path.join(galleryDir, nextName);

    if (currentName === nextName) continue;

    await fs.rename(currentPath, tempPath);
    tempRenames.push({ tempPath, finalPath, currentName, nextName });
  }

  for (const { tempPath, finalPath, currentName, nextName } of tempRenames) {
    await fs.rename(tempPath, finalPath);
    const oldPublic = `/images/projects/${slug}/gallery/${currentName}`;
    const newPublic = `/images/projects/${slug}/gallery/${nextName}`;
    pathUpdates.set(oldPublic, newPublic);
    console.log(`${slug}: ${currentName} -> ${nextName}`);
  }
}

const slugs = await fs.readdir(projectsRoot);

for (const slug of slugs) {
  await normalizeGalleryDir(slug);
}

let content = await fs.readFile(projectsPath, "utf8");

for (const [from, to] of pathUpdates) {
  content = content.replaceAll(from, to);
}

await fs.writeFile(projectsPath, content);
console.log(`\nUpdated ${pathUpdates.size} paths in content/projects.ts`);
