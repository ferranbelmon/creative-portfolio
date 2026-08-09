import fs from "node:fs/promises";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import sharp from "sharp";

const execFileAsync = promisify(execFile);
const imagesRoot = path.join(process.cwd(), "public", "images");
const pathUpdates = new Map();

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(fullPath)));
    else files.push(fullPath);
  }
  return files;
}

async function projectFolders() {
  const projectsRoot = path.join(imagesRoot, "projects");
  const entries = await fs.readdir(projectsRoot, { withFileTypes: true });
  const folders = entries
    .filter((e) => e.isDirectory())
    .map((e) => path.join(projectsRoot, e.name))
    .sort((a, b) => a.localeCompare(b));
  const siteDir = path.join(imagesRoot, "site");
  try {
    await fs.access(siteDir);
    folders.push(siteDir);
  } catch {
    // no site folder
  }
  return folders;
}

async function optimizeImage(filePath) {
  const rel = path.relative(imagesRoot, filePath).replace(/\\/g, "/");
  const isLogo = rel.startsWith("site/");
  const maxWidth = isLogo ? 640 : 1600;
  const before = (await fs.stat(filePath)).size;

  const image = sharp(filePath, { failOn: "none" });
  const meta = await image.metadata();
  const hasAlpha = meta.hasAlpha;

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
        quality: 82,
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
    outputPath = filePath.replace(/\.jfif$/i, ".jpg").replace(/\.jpeg$/i, ".jpg");
    pipeline = pipeline.jpeg({ quality: 82, mozjpeg: true });
  } else if (ext === ".webp") {
    pipeline = pipeline.webp({ quality: 82 });
  } else {
    return null;
  }

  const buffer = await pipeline.toBuffer();
  // Skip rewrite if larger than original (unless renamed)
  if (buffer.length >= before && outputPath === filePath) {
    console.log(`  skip image ${path.basename(filePath)} (already optimized)`);
    return { before, after: before, saved: 0 };
  }

  const tempPath = `${outputPath}.tmp`;
  await fs.writeFile(tempPath, buffer);
  await fs.rename(tempPath, outputPath);

  if (outputPath !== filePath) {
    await fs.unlink(filePath).catch(() => undefined);
    const publicPath = `/images/${rel}`;
    const newPublicPath = `/images/${path
      .relative(imagesRoot, outputPath)
      .replace(/\\/g, "/")}`;
    pathUpdates.set(publicPath, newPublicPath);
  }

  const after = (await fs.stat(outputPath)).size;
  console.log(
    `  img ${path.basename(filePath)}: ${formatBytes(before)} → ${formatBytes(after)} (-${(((before - after) / before) * 100).toFixed(0)}%)${outputPath !== filePath ? ` [→ ${path.basename(outputPath)}]` : ""}`,
  );
  return { before, after, saved: before - after };
}

async function optimizeGifToMp4(filePath) {
  const before = (await fs.stat(filePath)).size;
  const outputPath = filePath.replace(/\.gif$/i, ".mp4");
  const tempPath = `${outputPath}.tmp.mp4`;

  await execFileAsync(
    "ffmpeg",
    [
      "-y",
      "-i",
      filePath,
      "-vf",
      "scale='min(1600,iw)':-2",
      "-c:v",
      "libx264",
      "-pix_fmt",
      "yuv420p",
      "-movflags",
      "+faststart",
      "-crf",
      "26",
      "-preset",
      "medium",
      "-an",
      tempPath,
    ],
    { maxBuffer: 20 * 1024 * 1024 },
  );

  await fs.rename(tempPath, outputPath);
  await fs.unlink(filePath);

  const rel = path.relative(imagesRoot, filePath).replace(/\\/g, "/");
  const newRel = path.relative(imagesRoot, outputPath).replace(/\\/g, "/");
  pathUpdates.set(`/images/${rel}`, `/images/${newRel}`);

  const after = (await fs.stat(outputPath)).size;
  console.log(
    `  gif→mp4 ${path.basename(filePath)}: ${formatBytes(before)} → ${formatBytes(after)} (-${(((before - after) / before) * 100).toFixed(0)}%)`,
  );
  return { before, after, saved: before - after };
}

async function optimizeVideo(filePath) {
  const before = (await fs.stat(filePath)).size;
  // Skip tiny already-compressed clips
  if (before < 400 * 1024) {
    console.log(`  skip video ${path.basename(filePath)} (small)`);
    return { before, after: before, saved: 0 };
  }

  const ext = path.extname(filePath);
  const tempPath = `${filePath}.tmp.mp4`;

  await execFileAsync(
    "ffmpeg",
    [
      "-y",
      "-i",
      filePath,
      "-vf",
      "scale='min(1600,iw)':-2",
      "-c:v",
      "libx264",
      "-pix_fmt",
      "yuv420p",
      "-movflags",
      "+faststart",
      "-crf",
      "26",
      "-preset",
      "medium",
      "-c:a",
      "aac",
      "-b:a",
      "128k",
      "-ac",
      "2",
      tempPath,
    ],
    { maxBuffer: 50 * 1024 * 1024 },
  );

  const afterTemp = (await fs.stat(tempPath)).size;
  if (afterTemp >= before * 0.95) {
    await fs.unlink(tempPath);
    console.log(`  skip video ${path.basename(filePath)} (no gain)`);
    return { before, after: before, saved: 0 };
  }

  const outputPath = filePath.replace(/\.(mov|webm)$/i, ".mp4");
  await fs.rename(tempPath, outputPath);
  if (outputPath !== filePath) {
    await fs.unlink(filePath).catch(() => undefined);
    const rel = path.relative(imagesRoot, filePath).replace(/\\/g, "/");
    const newRel = path.relative(imagesRoot, outputPath).replace(/\\/g, "/");
    pathUpdates.set(`/images/${rel}`, `/images/${newRel}`);
  }

  const after = (await fs.stat(outputPath)).size;
  console.log(
    `  vid ${path.basename(filePath)}: ${formatBytes(before)} → ${formatBytes(after)} (-${(((before - after) / before) * 100).toFixed(0)}%)`,
  );
  return { before, after, saved: before - after };
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

const folders = await projectFolders();
let totalBefore = 0;
let totalAfter = 0;

console.log(`Optimizing ${folders.length} folders under public/images...\n`);

for (const folder of folders) {
  const label = path.relative(imagesRoot, folder).replace(/\\/g, "/");
  const files = await walk(folder);
  const media = files.filter((f) =>
    /\.(jpe?g|jfif|png|webp|gif|mp4|webm|mov)$/i.test(f),
  );
  if (media.length === 0) {
    console.log(`## ${label} (empty)`);
    continue;
  }

  console.log(`## ${label} (${media.length} files)`);
  let folderBefore = 0;
  let folderAfter = 0;

  for (const file of media) {
    const ext = path.extname(file).toLowerCase();
    let result;
    if (ext === ".gif") result = await optimizeGifToMp4(file);
    else if (/\.(mp4|webm|mov)$/i.test(ext)) result = await optimizeVideo(file);
    else result = await optimizeImage(file);

    if (result) {
      folderBefore += result.before;
      folderAfter += result.after;
    }
  }

  totalBefore += folderBefore;
  totalAfter += folderAfter;
  console.log(
    `  folder: ${formatBytes(folderBefore)} → ${formatBytes(folderAfter)} (-${folderBefore ? (((folderBefore - folderAfter) / folderBefore) * 100).toFixed(0) : 0}%)\n`,
  );
}

await updateContentPaths();
console.log(
  `\nTOTAL: ${formatBytes(totalBefore)} → ${formatBytes(totalAfter)} (saved ${formatBytes(totalBefore - totalAfter)})`,
);
console.log("Done.");
