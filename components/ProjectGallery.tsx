import type { GalleryLayout } from "@/content/projects";
import { RemoteImage } from "@/components/RemoteImage";

type ProjectGalleryProps = {
  title: string;
  images: string[];
  layout?: GalleryLayout;
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

export function ProjectGallery({
  title,
  images,
  layout,
}: ProjectGalleryProps) {
  if (!images?.length) return null;

  const columns = layout?.columns ?? 3;
  const aspectRatio = layout?.aspectRatio ?? "auto";
  const aspectClass = aspectClasses[aspectRatio];
  const objectFit = aspectRatio === "auto" ? "h-auto w-full" : "h-full w-full object-cover";

  const gapClass = columns === 1 ? "gap-3 md:gap-4" : "gap-1";
  const imageWidth = columns === 1 ? 1600 : 960;
  const imageHeight = columns === 1 ? 900 : 1440;
  const sizes =
    columns === 1
      ? "100vw"
      : `(max-width: 768px) 100vw, ${Math.round(100 / columns)}vw`;

  return (
    <section className="mt-16 border-t border-border pt-1 md:mt-20">
      <div className={`grid grid-cols-1 ${gapClass} ${columnClasses[columns]}`}>
        {images.map((src, index) => {
          const isVideo = /\.(mp4|webm|mov)$/i.test(src);
          const isGif = src.endsWith(".gif");

          return (
            <div
              key={src}
              className={`relative w-full overflow-hidden bg-surface ${aspectClass}`}
            >
              {isVideo ? (
                <video
                  src={src}
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="metadata"
                  className={objectFit}
                  aria-label={`${title} — video ${index + 1}`}
                />
              ) : isGif ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={src}
                  alt={`${title} — image ${index + 1}`}
                  className={objectFit}
                  loading="lazy"
                />
              ) : (
                <RemoteImage
                  src={src}
                  alt={`${title} — image ${index + 1}`}
                  width={imageWidth}
                  height={imageHeight}
                  className={objectFit}
                  sizes={sizes}
                />
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
