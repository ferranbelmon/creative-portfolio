export function mediaPath(src: string) {
  return src.replace(/\?.*$/, "");
}

export function isVideoSrc(src: string) {
  return /\.(mp4|webm|mov)$/i.test(mediaPath(src));
}

export function isGifSrc(src: string) {
  return /\.gif$/i.test(mediaPath(src));
}

export function shouldUseUnoptimizedImage(src: string) {
  return src.startsWith("/") && src.includes("?");
}
