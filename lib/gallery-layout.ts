import path from "node:path";
import type { GalleryLayout } from "@/content/projects";

/** e.g. 01-2-1.jpg → row 1, 2 equal columns, slot 1 */
const EQUAL_NAME = /^(\d{2})-([1-4])-([1-4])\.[a-z0-9]+$/i;

/** e.g. 03-v2h-1.jpg → mosaic: vertical left + 2 horizontals right */
const V2H_NAME = /^(\d{2})-v2h-([1-3])\.[a-z0-9]+$/i;

/** e.g. 04-vh-1.jpg → mosaic: vertical left + horizontal right, same height */
const VH_NAME = /^(\d{2})-vh-([1-2])\.[a-z0-9]+$/i;

/** Legacy flat gallery: 01.jpg */
const LEGACY_NAME = /^(\d{2})\.[a-z0-9]+$/i;

export type GalleryRowPattern = "equal" | "v2h" | "vh";

export type GalleryRow = {
  columns: 1 | 2 | 3 | 4;
  items: string[];
  pattern?: GalleryRowPattern;
};

export type ParsedGallery =
  | { mode: "rows"; rows: GalleryRow[] }
  | {
      mode: "grid";
      images: string[];
      columns: NonNullable<GalleryLayout["columns"]>;
      aspectRatio: NonNullable<GalleryLayout["aspectRatio"]>;
    };

type ParsedEntry =
  | {
      kind: "equal";
      src: string;
      row: number;
      columns: 1 | 2 | 3 | 4;
      slot: number;
    }
  | {
      kind: "v2h";
      src: string;
      row: number;
      slot: number;
    }
  | {
      kind: "vh";
      src: string;
      row: number;
      slot: number;
    };

function normalizeBasename(name: string) {
  return name.trim().replace(/\s+\./, ".");
}

function basename(src: string) {
  return normalizeBasename(path.basename(src.replace(/\?.*$/, "")));
}

export function isLayoutGalleryName(name: string) {
  const base = normalizeBasename(name);
  return EQUAL_NAME.test(base) || V2H_NAME.test(base) || VH_NAME.test(base);
}

export function isLegacyGalleryName(name: string) {
  return LEGACY_NAME.test(normalizeBasename(name));
}

function parseLayoutEntry(src: string): ParsedEntry | null {
  const name = basename(src);

  const v2h = name.match(V2H_NAME);
  if (v2h) {
    return {
      kind: "v2h",
      src,
      row: Number.parseInt(v2h[1], 10),
      slot: Number.parseInt(v2h[2], 10),
    };
  }

  const vh = name.match(VH_NAME);
  if (vh) {
    return {
      kind: "vh",
      src,
      row: Number.parseInt(vh[1], 10),
      slot: Number.parseInt(vh[2], 10),
    };
  }

  const equal = name.match(EQUAL_NAME);
  if (!equal) return null;

  const columns = Number.parseInt(equal[2], 10) as 1 | 2 | 3 | 4;
  const slot = Number.parseInt(equal[3], 10);
  if (slot < 1 || slot > columns) return null;

  return {
    kind: "equal",
    src,
    row: Number.parseInt(equal[1], 10),
    columns,
    slot,
  };
}

function buildRows(entries: ParsedEntry[]): GalleryRow[] {
  const byRow = new Map<number, ParsedEntry[]>();

  for (const entry of entries) {
    const list = byRow.get(entry.row) ?? [];
    list.push(entry);
    byRow.set(entry.row, list);
  }

  const rows: GalleryRow[] = [];

  for (const rowNum of [...byRow.keys()].sort((a, b) => a - b)) {
    const rowEntries = byRow.get(rowNum)!;
    const v2hEntries = rowEntries.filter((e) => e.kind === "v2h");
    const vhEntries = rowEntries.filter((e) => e.kind === "vh");
    const equalEntries = rowEntries.filter((e) => e.kind === "equal");

    if (v2hEntries.length > 0) {
      const sorted = [...v2hEntries].sort((a, b) => a.slot - b.slot);
      rows.push({
        columns: 2,
        pattern: "v2h",
        items: sorted.map((entry) => entry.src),
      });
    }

    if (vhEntries.length > 0) {
      const sorted = [...vhEntries].sort((a, b) => a.slot - b.slot);
      rows.push({
        columns: 2,
        pattern: "vh",
        items: sorted.map((entry) => entry.src),
      });
    }

    if (equalEntries.length === 0) continue;

    const byColumns = new Map<number, Extract<ParsedEntry, { kind: "equal" }>[]>();
    for (const entry of equalEntries) {
      if (entry.kind !== "equal") continue;
      const list = byColumns.get(entry.columns) ?? [];
      list.push(entry);
      byColumns.set(entry.columns, list);
    }

    for (const columns of [...byColumns.keys()].sort((a, b) => a - b)) {
      const group = byColumns.get(columns)!;
      const sorted = [...group].sort((a, b) => a.slot - b.slot);
      rows.push({
        columns: columns as GalleryRow["columns"],
        pattern: "equal",
        items: sorted.map((entry) => entry.src),
      });
    }
  }

  return rows;
}

/**
 * Parses gallery image paths into row-based or legacy grid layout.
 *
 * Equal columns: `{row}-{columns}-{slot}.ext` (e.g. `02-2-1.jpg`, `02-2-2.jpg`)
 * Mosaic v2h: `{row}-v2h-{slot}.ext` — slot 1 vertical left, 2 top-right, 3 bottom-right
 * Mosaic vh: `{row}-vh-{slot}.ext` — slot 1 vertical left, 2 horizontal right (same height)
 * Legacy: `{nn}.ext` → uniform grid from galleryLayout.
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
    .filter((entry): entry is ParsedEntry => entry !== null);

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
      hero: { columns: 1, pattern: "equal", items: [parsed.images[0]] },
      rest: parsed.images.slice(1),
    };
  }

  return { hero: null, rest: [] };
}
