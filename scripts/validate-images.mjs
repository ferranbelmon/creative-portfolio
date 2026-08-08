import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const content = await fs.readFile("content/projects.ts", "utf8");
const paths = [...content.matchAll(/"(\/images\/[^"]+)"/g)].map((m) => m[1]);

const results = [];

for (const publicPath of paths) {
  const candidates = [
    path.join("public", publicPath),
    path.join("public", decodeURIComponent(publicPath)),
  ];

  let filePath = null;
  for (const candidate of candidates) {
    try {
      await fs.access(candidate);
      filePath = candidate;
      break;
    } catch {
      // try next
    }
  }

  if (!filePath) {
    results.push({ path: publicPath, status: "missing" });
    continue;
  }

  const stat = await fs.stat(filePath);
  const ext = path.extname(filePath).toLowerCase();

  if (ext === ".gif") {
    results.push({ path: publicPath, status: "ok", size: stat.size, type: "gif" });
    continue;
  }

  try {
    const meta = await sharp(filePath).metadata();
    results.push({
      path: publicPath,
      status: "ok",
      size: stat.size,
      type: meta.format,
      width: meta.width,
      height: meta.height,
    });
  } catch (error) {
    results.push({
      path: publicPath,
      status: "invalid",
      size: stat.size,
      error: error.message,
    });
  }
}

const broken = results.filter((r) => r.status !== "ok");
console.log(JSON.stringify(broken, null, 2));
console.log(`\n${broken.length} broken / ${results.length} total`);
