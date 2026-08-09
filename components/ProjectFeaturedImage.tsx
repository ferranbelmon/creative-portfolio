import { RemoteImage } from "@/components/RemoteImage";

type ProjectFeaturedImageProps = {
  title: string;
  src: string;
};

export function ProjectFeaturedImage({ title, src }: ProjectFeaturedImageProps) {
  const isVideo = /\.(mp4|webm|mov)$/i.test(src);
  const isGif = src.endsWith(".gif");

  return (
    <div className="relative w-full overflow-hidden bg-surface lg:max-w-[34rem] lg:justify-self-end">
      {isVideo ? (
        <video
          src={src}
          controls
          playsInline
          preload="metadata"
          className="h-auto w-full"
          aria-label={`${title} — featured video`}
        />
      ) : isGif ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={`${title} — featured`}
          className="h-auto w-full"
          loading="eager"
        />
      ) : (
        <RemoteImage
          src={src}
          alt={`${title} — featured`}
          width={800}
          height={1200}
          className="h-auto w-full"
          sizes="(max-width: 1024px) 100vw, 34rem"
          priority
        />
      )}
    </div>
  );
}
