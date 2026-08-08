import Image, { type ImageProps } from "next/image";

type RemoteImageProps = Omit<ImageProps, "unoptimized"> & {
  src: string;
};

export function RemoteImage({ src, alt, ...props }: RemoteImageProps) {
  const isLocal = src.startsWith("/");

  return <Image src={src} alt={alt} unoptimized={!isLocal} {...props} />;
}
