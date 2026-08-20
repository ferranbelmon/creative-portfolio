"use client";

import { useEffect, useRef } from "react";

type GalleryVideoProps = {
  src: string;
  className?: string;
  label: string;
  priority?: boolean;
};

export function GalleryVideo({
  src,
  className,
  label,
  priority,
}: GalleryVideoProps) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    el.loop = true;

    function restart() {
      const node = ref.current;
      if (!node) return;
      node.currentTime = 0;
      void node.play().catch(() => {});
    }

    el.addEventListener("ended", restart);
    return () => el.removeEventListener("ended", restart);
  }, [src]);

  return (
    <video
      ref={ref}
      src={src}
      controls
      autoPlay
      muted
      loop
      playsInline
      preload={priority ? "auto" : "metadata"}
      className={className}
      aria-label={label}
    />
  );
}
