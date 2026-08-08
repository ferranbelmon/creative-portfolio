import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const content = fs.readFileSync(path.join(root, "content/projects.ts"), "utf8");
const paths = [...content.matchAll(/"(\/images\/[^"]+)"/g)].map((m) => m[1]);

const missing = [];
const duplicates = new Map();

for (const p of paths) {
  const file = path.join(root, "public", ...p.slice(1).split("/"));
  if (!fs.existsSync(file)) {
    missing.push({ path: p, file });
  } else {
    const size = fs.statSync(file).size;
    if (!duplicates.has(file)) duplicates.set(file, []);
    duplicates.get(file).push({ path: p, size });
  }
}

console.log("Missing files:", missing.length);
for (const m of missing) console.log("  MISSING", m.path);

console.log("\nDuplicate paths to same file:");
for (const [file, refs] of duplicates) {
  if (refs.length > 1) {
    console.log("  FILE", path.relative(root, file));
    for (const r of refs) console.log("    ->", r.path);
  }
}

console.log("\nGallery files on disk:");
const galleryRoot = path.join(root, "public/images/projects");
for (const slug of fs.readdirSync(galleryRoot)) {
  const galleryDir = path.join(galleryRoot, slug, "gallery");
  if (!fs.existsSync(galleryDir)) continue;
  const files = fs.readdirSync(galleryDir);
  console.log(`  ${slug}: ${files.length} files`);
  for (const f of files) {
    const size = fs.statSync(path.join(galleryDir, f)).size;
    console.log(`    ${f} (${Math.round(size / 1024)} KB)`);
  }
}
