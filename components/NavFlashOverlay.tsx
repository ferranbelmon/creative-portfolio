"use client";

import { useEffect, useRef } from "react";
import {
  createNavFlashRenderer,
  NAV_FLASH_END_S,
  NAV_FLASH_FADE_START_S,
  NAV_FLASH_PEAK_S,
} from "@/lib/nav-flash/shader";

type NavFlashOverlayProps = {
  active: boolean;
  onPeak: () => void;
  onDone: () => void;
};

export function NavFlashOverlay({
  active,
  onPeak,
  onDone,
}: NavFlashOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const onPeakRef = useRef(onPeak);
  const onDoneRef = useRef(onDone);

  onPeakRef.current = onPeak;
  onDoneRef.current = onDone;

  useEffect(() => {
    if (!active) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    let peakSent = false;

    let renderer: ReturnType<typeof createNavFlashRenderer> | null = null;
    try {
      renderer = createNavFlashRenderer(canvas);
    } catch {
      onPeakRef.current();
      window.setTimeout(() => onDoneRef.current(), 500);
      return;
    }

    const start = performance.now();
    let raf = 0;

    const onResize = () => renderer?.resize();
    window.addEventListener("resize", onResize);

    const tick = (now: number) => {
      const elapsed = (now - start) / 1000;
      const opacity =
        elapsed <= NAV_FLASH_FADE_START_S
          ? 1
          : Math.max(
              0,
              1 -
                (elapsed - NAV_FLASH_FADE_START_S) /
                  (NAV_FLASH_END_S - NAV_FLASH_FADE_START_S),
            );

      renderer?.render(elapsed, opacity);

      if (!peakSent && elapsed >= NAV_FLASH_PEAK_S) {
        peakSent = true;
        onPeakRef.current();
      }

      if (elapsed >= NAV_FLASH_END_S) {
        onDoneRef.current();
        return;
      }

      raf = window.requestAnimationFrame(tick);
    };

    raf = window.requestAnimationFrame(tick);

    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      renderer?.dispose();
    };
  }, [active]);

  if (!active) return null;

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-auto fixed inset-0 z-[9998] block"
    />
  );
}
