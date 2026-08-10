import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";

function publicFilePath(src: string) {
  return path.join(process.cwd(), "public", src.replace(/^\//, ""));
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
 * Filters by path and by identical file contents (e.g. thumbnail.jpg copied from 01.jpg).
 */
export function galleryWithoutThumbnail(
  images: string[] | undefined,
  thumbnail: string | undefined,
): string[] {
  const list = images ?? [];
  if (!list.length) return [];
  if (!thumbnail) return list;

  const thumbnailHash = fileHash(thumbnail);

  return list.filter((src) => {
    if (src === thumbnail) return false;
    if (!thumbnailHash) return true;
    const hash = fileHash(src);
    return !hash || hash !== thumbnailHash;
  });
}
