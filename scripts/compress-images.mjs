import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const imagesRoot = path.join(process.cwd(), "public", "images");
const pathUpdates = new Map();
let skipped = 0;

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walk(fullPath)));
    } else if (/\.(jpe?g|jfif|png|webp)$/i.test(entry.name)) {
      files.push(fullPath);
    }
  }

  return files;
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

async function compressFile(filePath) {
  const rel = path.relative(imagesRoot, filePath).replace(/\\/g, "/");
  const isLogo = rel.startsWith("site/");
  const maxWidth = isLogo ? 640 : 1600;
  const before = (await fs.stat(filePath)).size;

  const image = sharp(filePath, { failOn: "none" });
  const meta = await image.metadata();
  const hasAlpha = meta.hasAlpha;

  // Skip files that look already optimized: within max width and low
  // bytes-per-pixel (previous q84 outputs land around 0.05–0.2 B/px).
  // Re-encoding them again only degrades quality.
  const pixels = (meta.width ?? 0) * (meta.height ?? 0);
  const ext0 = path.extname(filePath).toLowerCase();
  const withinWidth = (meta.width ?? Infinity) <= maxWidth;
  const bytesPerPixel = pixels > 0 ? before / pixels : Infinity;
  if (withinWidth && ext0 !== ".jfif" && bytesPerPixel <= 0.25) {
    skipped += 1;
    return;
  }

  let pipeline = image.rotate().resize({
    width: maxWidth,
    withoutEnlargement: true,
    fit: "inside",
  });

  const ext = path.extname(filePath).toLowerCase();
  let outputPath = filePath;

  if (ext === ".png") {
    const convertToJpeg = !isLogo && before > 300 * 1024;

    if (convertToJpeg) {
      outputPath = filePath.replace(/\.png$/i, ".jpg");
      pipeline = pipeline.flatten({ background: "#090909" }).jpeg({
        quality: 84,
        mozjpeg: true,
      });
    } else {
      pipeline = pipeline.png({
        compressionLevel: 9,
        palette: !hasAlpha,
        quality: 80,
      });
    }
  } else if (ext === ".jfif" || ext === ".jpeg" || ext === ".jpg") {
    const normalizedPath = filePath.replace(/\.jfif$/i, ".jpg");
    outputPath = normalizedPath;
    pipeline = pipeline.jpeg({ quality: 84, mozjpeg: true });
  } else if (ext === ".webp") {
    pipeline = pipeline.webp({ quality: 84 });
  }

  const buffer = await pipeline.toBuffer();
  const tempPath = `${outputPath}.tmp`;
  await fs.writeFile(tempPath, buffer);
  await fs.rename(tempPath, outputPath);

  if (outputPath !== filePath) {
    await fs.unlink(filePath).catch(() => undefined);
    const publicPath = `/images/${rel}`;
    const newPublicPath = `/images/${path.relative(imagesRoot, outputPath).replace(/\\/g, "/")}`;
    pathUpdates.set(publicPath, newPublicPath);
  }

  const after = (await fs.stat(outputPath)).size;
  const saved = before - after;
  const pct = before > 0 ? ((saved / before) * 100).toFixed(0) : "0";

  console.log(
    `${rel}: ${formatBytes(before)} → ${formatBytes(after)} (-${pct}%)${outputPath !== filePath ? ` [→ ${path.basename(outputPath)}]` : ""}`,
  );
}

async function updateContentPaths() {
  if (pathUpdates.size === 0) return;

  const files = ["content/site.ts", "content/projects.ts"];

  for (const file of files) {
    const filePath = path.join(process.cwd(), file);
    let content = await fs.readFile(filePath, "utf8");
    let changed = false;

    for (const [from, to] of pathUpdates) {
      if (content.includes(from)) {
        content = content.replaceAll(from, to);
        changed = true;
      }
    }

    if (changed) {
      await fs.writeFile(filePath, content);
      console.log(`Updated paths in ${file}`);
    }
  }
}

const files = await walk(imagesRoot);
console.log(`Compressing ${files.length} images...\n`);

for (const file of files) {
  await compressFile(file);
}

await updateContentPaths();
console.log(`\nDone. Skipped ${skipped} already-optimized image(s).`);
