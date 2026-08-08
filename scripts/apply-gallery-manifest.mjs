import fs from "node:fs/promises";
import path from "node:path";

const manifest = JSON.parse(
  await fs.readFile(
    path.join(process.cwd(), "scripts", "gallery-manifest.json"),
    "utf8",
  ),
);

const projectsPath = path.join(process.cwd(), "content", "projects.ts");
let content = await fs.readFile(projectsPath, "utf8");

if (!content.includes("images: string[]")) {
  content = content.replace(
    "  thumbnail: string;\n  sections: ProjectSection;",
    "  thumbnail: string;\n  images: string[];\n  sections: ProjectSection;",
  );
}

for (const [slug, images] of Object.entries(manifest)) {
  const imagesBlock = `images: [\n${images.map((image) => `      "${image}",`).join("\n")}\n    ],`;
  const thumbnailPattern = new RegExp(
    `(slug: "${slug}"[\\s\\S]*?thumbnail: "[^"]+",)\\n(?:    images: \\[[\\s\\S]*?\\],\\n)?`,
  );

  if (!thumbnailPattern.test(content)) {
    console.warn(`Could not find project: ${slug}`);
    continue;
  }

  content = content.replace(thumbnailPattern, `$1\n    ${imagesBlock}\n`);
}

await fs.writeFile(projectsPath, content);
console.log("Updated content/projects.ts with gallery images.");
