import type { GalleryLayout } from "@/content/projects";
import { RemoteImage } from "@/components/RemoteImage";

type ProjectGalleryProps = {
  title: string;
  images: string[];
  layout?: GalleryLayout;
};

const columnClasses: Record<NonNullable<GalleryLayout["columns"]>, string> = {
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

  return (
    <section className="mt-16 border-t border-border pt-1 md:mt-20">
      <div
        className={`grid grid-cols-1 gap-1 ${columnClasses[columns]}`}
      >
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
                  controls
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
                  width={960}
                  height={1440}
                  className={objectFit}
                  sizes={`(max-width: 768px) 100vw, ${Math.round(100 / columns)}vw`}
                />
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
