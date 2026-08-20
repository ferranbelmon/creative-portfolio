import path from "node:path";
import type { GalleryLayout } from "@/content/projects";

/** e.g. 01-2-1.jpg → row 1, 2 columns, slot 1 */
const LAYOUT_NAME = /^(\d{2})-([1-4])-([1-4])\.[a-z0-9]+$/i;

/** Legacy flat gallery: 01.jpg */
const LEGACY_NAME = /^(\d{2})\.[a-z0-9]+$/i;

export type GalleryRow = {
  columns: 1 | 2 | 3 | 4;
  items: string[];
};

export type ParsedGallery =
  | { mode: "rows"; rows: GalleryRow[] }
  | {
      mode: "grid";
      images: string[];
      columns: NonNullable<GalleryLayout["columns"]>;
      aspectRatio: NonNullable<GalleryLayout["aspectRatio"]>;
    };

function normalizeBasename(name: string) {
  return name.trim().replace(/\s+\./, ".");
}

function basename(src: string) {
  return normalizeBasename(path.basename(src.replace(/\?.*$/, "")));
}

export function isLayoutGalleryName(name: string) {
  return LAYOUT_NAME.test(normalizeBasename(name));
}

export function isLegacyGalleryName(name: string) {
  return LEGACY_NAME.test(normalizeBasename(name));
}

function parseLayoutEntry(src: string) {
  const match = basename(src).match(LAYOUT_NAME);
  if (!match) return null;

  const row = Number.parseInt(match[1], 10);
  const columns = Number.parseInt(match[2], 10) as 1 | 2 | 3 | 4;
  const slot = Number.parseInt(match[3], 10);

  if (slot < 1 || slot > columns) return null;

  return { src, row, columns, slot };
}

function buildRows(entries: NonNullable<ReturnType<typeof parseLayoutEntry>>[]) {
  const byRow = new Map<number, typeof entries>();

  for (const entry of entries) {
    const list = byRow.get(entry.row) ?? [];
    list.push(entry);
    byRow.set(entry.row, list);
  }

  const rows: GalleryRow[] = [];

  for (const rowNum of [...byRow.keys()].sort((a, b) => a - b)) {
    const rowEntries = byRow.get(rowNum)!;
    const byColumns = new Map<number, typeof rowEntries>();

    for (const entry of rowEntries) {
      const list = byColumns.get(entry.columns) ?? [];
      list.push(entry);
      byColumns.set(entry.columns, list);
    }

    for (const columns of [...byColumns.keys()].sort((a, b) => a - b)) {
      const entries = byColumns.get(columns)!;
      const sorted = [...entries].sort((a, b) => a.slot - b.slot);

      rows.push({
        columns: columns as GalleryRow["columns"],
        items: sorted.map((entry) => entry.src),
      });
    }
  }

  return rows;
}

/**
 * Parses gallery image paths into row-based or legacy grid layout.
 *
 * Row naming: `{row}-{columns}-{slot}.ext` (e.g. `02-2-1.jpg`, `02-2-2.jpg`)
 * Legacy naming: `{nn}.ext` (e.g. `01.jpg`) → uniform grid from galleryLayout.
 */
export function parseGallery(
  images: string[],
  layout?: GalleryLayout,
): ParsedGallery {
  const list = images ?? [];
  const defaultColumns = layout?.columns ?? 3;
  const aspectRatio = layout?.aspectRatio ?? "auto";

  if (!list.length) {
    return { mode: "grid", images: [], columns: defaultColumns, aspectRatio };
  }

  const layoutEntries = list
    .map(parseLayoutEntry)
    .filter((entry): entry is NonNullable<typeof entry> => entry !== null);

  const legacyEntries = list.filter(
    (src) => parseLayoutEntry(src) === null && LEGACY_NAME.test(basename(src)),
  );

  if (layoutEntries.length > 0 && legacyEntries.length === 0) {
    return { mode: "rows", rows: buildRows(layoutEntries) };
  }

  return {
    mode: "grid",
    images: list,
    columns: defaultColumns,
    aspectRatio,
  };
}

export type GalleryDisplaySplit = {
  hero: GalleryRow | null;
  rest: string[];
};

/** First row/image as hero; remaining paths for the gallery below project info. */
export function splitGalleryForDisplay(
  images: string[],
  layout?: GalleryLayout,
): GalleryDisplaySplit {
  const parsed = parseGallery(images, layout);

  if (parsed.mode === "rows" && parsed.rows.length > 0) {
    return {
      hero: parsed.rows[0],
      rest: parsed.rows.slice(1).flatMap((row) => row.items),
    };
  }

  if (parsed.mode === "grid" && parsed.images.length > 0) {
    return {
      hero: { columns: 1, items: [parsed.images[0]] },
      rest: parsed.images.slice(1),
    };
  }

  return { hero: null, rest: [] };
}
