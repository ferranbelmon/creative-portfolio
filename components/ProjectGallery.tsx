import type { GalleryLayout } from "@/content/projects";
import { GalleryVideo } from "@/components/GalleryVideo";
import { RemoteImage } from "@/components/RemoteImage";
import { isGifSrc, isVideoSrc } from "@/lib/media-src";
import {
  parseGallery,
  type GalleryRow,
} from "@/lib/gallery-layout";

type ProjectGalleryProps = {
  title: string;
  images: string[];
  layout?: GalleryLayout;
  variant?: "default" | "continuation";
  showFileLabels?: boolean;
};

const columnClasses: Record<NonNullable<GalleryLayout["columns"]>, string> = {
  1: "md:grid-cols-1",
  2: "md:grid-cols-2",
  3: "md:grid-cols-3",
  4: "md:grid-cols-4",
};

const aspectClasses: Record<
  NonNullable<GalleryLayout["aspectRatio"]>,
  string
> = {
  auto: "",
  portrait: "aspect-[2/3]",
  square: "aspect-square",
  landscape: "aspect-[16/10]",
};

type MediaTileProps = {
  title: string;
  src: string;
  index: number;
  aspectClass: string;
  objectFit: string;
  imageWidth: number;
  imageHeight: number;
  sizes: string;
  showFileLabel: boolean;
  priority?: boolean;
  aspectRatio: NonNullable<GalleryLayout["aspectRatio"]>;
};

function galleryFileLabel(src: string) {
  const name = src.split("/").pop() ?? src;
  return name.replace(/\?.*$/, "");
}

function MediaTile({
  title,
  src,
  index,
  aspectClass,
  objectFit,
  imageWidth,
  imageHeight,
  sizes,
  showFileLabel,
  priority,
  aspectRatio,
}: MediaTileProps) {
  const isVideo = isVideoSrc(src);
  const isGif = isGifSrc(src);
  const constrainToViewport = isVideo && aspectRatio === "auto";

  return (
    <div
      className={`relative w-full overflow-hidden ${
        constrainToViewport
          ? "flex max-h-[min(85dvh,56rem)] items-center justify-center bg-transparent"
          : `bg-surface ${aspectClass}`
      }`}
    >
      {showFileLabel ? (
        <span className="pointer-events-none absolute bottom-2 left-2 z-10 bg-background/80 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-muted">
          {galleryFileLabel(src)}
        </span>
      ) : null}
      {isVideo ? (
        <GalleryVideo
          src={src}
          className={
            constrainToViewport
              ? "max-h-[min(85dvh,56rem)] w-auto max-w-full object-contain"
              : objectFit
          }
          label={`${title} — video ${index + 1}`}
          priority={priority}
        />
      ) : isGif ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={`${title} — image ${index + 1}`}
          className={objectFit}
          loading={priority ? "eager" : "lazy"}
        />
      ) : (
        <RemoteImage
          src={src}
          alt={`${title} — image ${index + 1}`}
          width={imageWidth}
          height={imageHeight}
          className={objectFit}
          sizes={sizes}
          unoptimized
          priority={priority}
        />
      )}
    </div>
  );
}

function GalleryRowSection({
  title,
  row,
  rowIndex,
  aspectRatio,
  showFileLabels,
  priority,
}: {
  title: string;
  row: GalleryRow;
  rowIndex: number;
  aspectRatio: NonNullable<GalleryLayout["aspectRatio"]>;
  showFileLabels: boolean;
  priority?: boolean;
}) {
  if (row.pattern === "v2h") {
    const [left, topRight, bottomRight] = row.items;
    const tiles = [
      {
        src: left,
        className: "md:row-span-2",
        aspectClass: "aspect-[3/4] md:aspect-auto md:h-full",
      },
      {
        src: topRight,
        className: "",
        aspectClass: "aspect-[16/10] md:aspect-auto md:h-full",
      },
      {
        src: bottomRight,
        className: "",
        aspectClass: "aspect-[16/10] md:aspect-auto md:h-full",
      },
    ].filter((tile) => Boolean(tile.src));

    return (
      <div className="grid grid-cols-1 gap-1 md:grid-cols-2 md:grid-rows-2 md:aspect-[3/2]">
        {tiles.map((tile, index) => (
          <div key={tile.src} className={`min-h-0 ${tile.className}`}>
            <MediaTile
              title={title}
              src={tile.src!}
              index={rowIndex * 10 + index}
              aspectClass={tile.aspectClass}
              objectFit="h-full w-full object-cover"
              imageWidth={index === 0 ? 900 : 1200}
              imageHeight={index === 0 ? 1350 : 750}
              sizes="(max-width: 768px) 100vw, 50vw"
              showFileLabel={showFileLabels}
              priority={priority && index === 0}
              aspectRatio="portrait"
            />
          </div>
        ))}
      </div>
    );
  }

  if (row.pattern === "vh") {
    const [left, right] = row.items;
    const tiles = [
      {
        src: left,
        aspectClass: "aspect-[3/4] md:aspect-auto md:h-full",
        imageWidth: 900,
        imageHeight: 1350,
      },
      {
        src: right,
        aspectClass: "aspect-[16/10] md:aspect-auto md:h-full",
        imageWidth: 1400,
        imageHeight: 900,
      },
    ].filter((tile) => Boolean(tile.src));

    return (
      <div className="grid grid-cols-1 gap-1 md:grid-cols-[2fr_3fr] md:aspect-[5/3]">
        {tiles.map((tile, index) => (
          <div key={tile.src} className="min-h-0">
            <MediaTile
              title={title}
              src={tile.src!}
              index={rowIndex * 10 + index}
              aspectClass={tile.aspectClass}
              objectFit="h-full w-full object-cover"
              imageWidth={tile.imageWidth}
              imageHeight={tile.imageHeight}
              sizes="(max-width: 768px) 100vw, 50vw"
              showFileLabel={showFileLabels}
              priority={priority && index === 0}
              aspectRatio="portrait"
            />
          </div>
        ))}
      </div>
    );
  }

  const aspectClass = aspectClasses[aspectRatio];
  const objectFit =
    aspectRatio === "auto" ? "h-auto w-full" : "h-full w-full object-cover";
  const gapClass = row.columns === 1 ? "gap-3 md:gap-4" : "gap-1";
  const imageWidth = row.columns === 1 ? 1600 : 960;
  const imageHeight = row.columns === 1 ? 900 : 1440;
  const sizes =
    row.columns === 1
      ? "100vw"
      : `(max-width: 768px) 100vw, ${Math.round(100 / row.columns)}vw`;

  return (
    <div className={`grid grid-cols-1 ${gapClass} ${columnClasses[row.columns]}`}>
      {row.items.map((src, index) => (
        <MediaTile
          key={src}
          title={title}
          src={src}
          index={rowIndex * 10 + index}
          aspectClass={aspectClass}
          objectFit={objectFit}
          imageWidth={imageWidth}
          imageHeight={imageHeight}
          sizes={sizes}
          showFileLabel={showFileLabels}
          priority={priority && index === 0}
          aspectRatio={aspectRatio}
        />
      ))}
    </div>
  );
}

type ProjectGalleryHeroProps = {
  title: string;
  row: GalleryRow;
  layout?: GalleryLayout;
};

export function ProjectGalleryHero({
  title,
  row,
  layout,
}: ProjectGalleryHeroProps) {
  const aspectRatio = layout?.aspectRatio ?? "auto";

  return (
    <section className="mt-10 md:mt-12">
      <GalleryRowSection
        title={title}
        row={row}
        rowIndex={0}
        aspectRatio={aspectRatio}
        showFileLabels={false}
        priority
      />
    </section>
  );
}

export function ProjectGallery({
  title,
  images,
  layout,
  variant = "default",
  showFileLabels = false,
}: ProjectGalleryProps) {
  if (!images?.length) return null;

  const parsed = parseGallery(images, layout);
  const sectionClass =
    variant === "continuation"
      ? "mt-12 md:mt-16"
      : "mt-16 border-t border-border pt-1 md:mt-20";

  if (parsed.mode === "rows") {
    if (!parsed.rows.length) return null;

    const aspectRatio = layout?.aspectRatio ?? "auto";

    return (
      <section className={sectionClass}>
        <div className="flex flex-col gap-1 md:gap-1">
          {parsed.rows.map((row, rowIndex) => (
            <GalleryRowSection
              key={`${row.pattern ?? "equal"}-${row.columns}-${rowIndex}-${row.items[0]}`}
              title={title}
              row={row}
              rowIndex={rowIndex}
              aspectRatio={aspectRatio}
              showFileLabels={showFileLabels}
            />
          ))}
        </div>
      </section>
    );
  }

  const { columns, aspectRatio } = parsed;
  const aspectClass = aspectClasses[aspectRatio];
  const objectFit =
    aspectRatio === "auto" ? "h-auto w-full" : "h-full w-full object-cover";
  const gapClass = columns === 1 ? "gap-3 md:gap-4" : "gap-1";
  const imageWidth = columns === 1 ? 1600 : 960;
  const imageHeight = columns === 1 ? 900 : 1440;
  const sizes =
    columns === 1
      ? "100vw"
      : `(max-width: 768px) 100vw, ${Math.round(100 / columns)}vw`;

  return (
    <section className={sectionClass}>
      <div className={`grid grid-cols-1 ${gapClass} ${columnClasses[columns]}`}>
        {parsed.images.map((src, index) => (
          <MediaTile
            key={src}
            title={title}
            src={src}
            index={index}
            aspectClass={aspectClass}
            objectFit={objectFit}
            imageWidth={imageWidth}
            imageHeight={imageHeight}
            sizes={sizes}
            showFileLabel={showFileLabels}
            aspectRatio={aspectRatio}
          />
        ))}
      </div>
    </section>
  );
}
