import Image, { type ImageProps } from "next/image";
import { shouldUseUnoptimizedImage } from "@/lib/media-src";

type RemoteImageProps = Omit<ImageProps, "unoptimized"> & {
  src: string;
  unoptimized?: boolean;
};

export function RemoteImage({
  src,
  alt,
  unoptimized,
  ...props
}: RemoteImageProps) {
  const isLocal = src.startsWith("/");

  return (
    <Image
      src={src}
      alt={alt}
      unoptimized={unoptimized ?? (!isLocal || shouldUseUnoptimizedImage(src))}
      {...props}
    />
  );
}
