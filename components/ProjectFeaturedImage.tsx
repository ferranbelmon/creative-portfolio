import { GalleryVideo } from "@/components/GalleryVideo";
import { RemoteImage } from "@/components/RemoteImage";
import { isGifSrc, isVideoSrc } from "@/lib/media-src";

type ProjectFeaturedImageProps = {
  title: string;
  src: string;
};

export function ProjectFeaturedImage({ title, src }: ProjectFeaturedImageProps) {
  const isVideo = isVideoSrc(src);
  const isGif = isGifSrc(src);

  return (
    <div className="relative w-full overflow-hidden bg-surface lg:max-w-[34rem] lg:justify-self-end">
      {isVideo ? (
        <GalleryVideo
          src={src}
          className="h-auto w-full"
          label={`${title} — featured video`}
          priority
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
