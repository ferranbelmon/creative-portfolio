import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import type { Project } from "@/content/projects";

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

const VIDEO_EXT = new Set([".mp4", ".webm", ".mov"]);

function naturalSort(a: string, b: string) {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
}

function publicFilePath(src: string) {
  const pathOnly = src.replace(/\?.*$/, "");
  return path.join(process.cwd(), "public", pathOnly.replace(/^\//, ""));
}

function fileExists(src: string) {
  try {
    return existsSync(publicFilePath(src));
  } catch {
    return false;
  }
}

function mediaPath(src: string) {
  return src.replace(/\?.*$/, "");
}

function normalizeGalleryFileName(name: string) {
  return name.trim().replace(/\s+\./, ".");
}

/**
 * Reads gallery media from disk so renames take effect on refresh.
 * Falls back to projects.ts when the gallery folder is missing or empty.
 */
export function listGalleryImagesFromDisk(
  project: Pick<Project, "id" | "slug" | "images">,
): string[] {
  const folderKey = `${project.id}-${project.slug}`;
  const galleryDir = path.join(
    process.cwd(),
    "public",
    "images",
    "projects",
    folderKey,
    "gallery",
  );

  if (!existsSync(galleryDir)) {
    return project.images ?? [];
  }

  const files = readdirSync(galleryDir)
    .filter((name) =>
      MEDIA_EXT.has(path.extname(normalizeGalleryFileName(name)).toLowerCase()),
    )
    .sort((a, b) =>
      naturalSort(normalizeGalleryFileName(a), normalizeGalleryFileName(b)),
    );

  const layoutFiles = files.filter((name) =>
    /^\d{2}-[1-4]-[1-4]\.[a-z0-9]+$/i.test(normalizeGalleryFileName(name)),
  );

  const galleryFiles = layoutFiles.length > 0 ? layoutFiles : files;

  if (!galleryFiles.length) {
    return project.images ?? [];
  }

  return galleryFiles.map((name) => {
    const mtime = Math.floor(statSync(path.join(galleryDir, name)).mtimeMs);
    return `/images/projects/${folderKey}/gallery/${name}?v=${mtime}`;
  });
}

function projectFolderKey(project: Pick<Project, "id" | "slug">) {
  return `${project.id}-${project.slug}`;
}

/**
 * Hero video from gallery/videos/ (first file, natural sort).
 * When present, the project page uses it instead of row 1 of the gallery.
 */
export function listGalleryHeroVideoFromDisk(
  project: Pick<Project, "id" | "slug">,
): string | null {
  const folderKey = projectFolderKey(project);
  const videosDir = path.join(
    process.cwd(),
    "public",
    "images",
    "projects",
    folderKey,
    "gallery",
    "videos",
  );

  if (!existsSync(videosDir)) {
    return null;
  }

  const files = readdirSync(videosDir)
    .filter((name) =>
      VIDEO_EXT.has(path.extname(normalizeGalleryFileName(name)).toLowerCase()),
    )
    .sort((a, b) =>
      naturalSort(normalizeGalleryFileName(a), normalizeGalleryFileName(b)),
    );

  if (!files.length) {
    return null;
  }

  const name = normalizeGalleryFileName(files[0]);
  const mtime = Math.floor(statSync(path.join(videosDir, name)).mtimeMs);
  return `/images/projects/${folderKey}/gallery/videos/${name}?v=${mtime}`;
}

/** Configured hero video path when the file exists in public/. */
export function resolveConfiguredHeroVideoUrl(
  heroVideoUrl: string | undefined,
): string | null {
  if (!heroVideoUrl) return null;
  if (!fileExists(heroVideoUrl)) return null;

  const filePath = publicFilePath(heroVideoUrl);
  const mtime = Math.floor(statSync(filePath).mtimeMs);
  const pathOnly = heroVideoUrl.replace(/\?.*$/, "");
  return `${pathOnly}?v=${mtime}`;
}

function fileSize(src: string): number | null {
  try {
    return statSync(publicFilePath(src)).size;
  } catch {
    return null;
  }
}

function fileHash(src: string): string | null {
  try {
    return createHash("sha1")
      .update(readFileSync(publicFilePath(src)))
      .digest("hex");
  } catch {
    return null;
  }
}

/**
 * Gallery images must never repeat the featured thumbnail.
 * Filters by path; only hashes when file size matches (avoids reading every image).
 */
export function galleryWithoutThumbnail(
  images: string[] | undefined,
  thumbnail: string | undefined,
): string[] {
  const list = images ?? [];
  if (!list.length) return [];
  if (!thumbnail) return list;

  const thumbPath = mediaPath(thumbnail);
  const thumbSize = fileSize(thumbnail);
  let thumbHash: string | null | undefined;

  return list.filter((src) => {
    if (mediaPath(src) === thumbPath) return false;
    if (thumbSize == null) return true;

    const size = fileSize(src);
    if (size == null || size !== thumbSize) return true;

    if (thumbHash === undefined) thumbHash = fileHash(thumbnail);
    if (!thumbHash) return true;

    const hash = fileHash(src);
    return !hash || hash !== thumbHash;
  });
}
