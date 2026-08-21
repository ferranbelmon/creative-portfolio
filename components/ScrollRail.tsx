"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const THUMB_SIZE = 14;
/** How quickly the dot eases toward scroll position (0…1 per frame @60fps). */
const EASE = 0.14;
/** Snap when this close — avoids endless micro-updates. */
const SNAP = 0.0004;

function scrollMetrics() {
  const el = document.documentElement;
  const max = Math.max(0, el.scrollHeight - el.clientHeight);
  return {
    max,
    progress: max <= 0 ? 0 : Math.min(1, Math.max(0, window.scrollY / max)),
  };
}

/**
 * Minimal custom scroll rail: thin track + fat position dot.
 * Dot eases toward scroll position; snaps while dragging.
 */
export function ScrollRail() {
  const trackRef = useRef<HTMLDivElement>(null);
  const thumbRef = useRef<HTMLButtonElement>(null);
  const dragging = useRef(false);
  const target = useRef(0);
  const current = useRef(0);
  const raf = useRef(0);
  const [visible, setVisible] = useState(false);
  const [valueNow, setValueNow] = useState(0);

  const paintThumb = useCallback((progress: number) => {
    const track = trackRef.current;
    const thumb = thumbRef.current;
    if (!track || !thumb) return;
    const travel = Math.max(0, track.clientHeight - THUMB_SIZE);
    thumb.style.transform = `translate3d(-50%, ${progress * travel}px, 0)`;
  }, []);

  const readTarget = useCallback(() => {
    const { progress, max } = scrollMetrics();
    target.current = progress;
    const show = max > 8;
    setVisible((v) => (v === show ? v : show));
    return show;
  }, []);

  useEffect(() => {
    const tick = () => {
      const show = readTarget();
      if (show) {
        if (dragging.current) {
          current.current = target.current;
        } else {
          const delta = target.current - current.current;
          if (Math.abs(delta) < SNAP) {
            current.current = target.current;
          } else {
            current.current += delta * EASE;
          }
        }
        paintThumb(current.current);
        const next = Math.round(current.current * 100);
        setValueNow((v) => (v === next ? v : next));
      }
      raf.current = requestAnimationFrame(tick);
    };

    raf.current = requestAnimationFrame(tick);
    window.addEventListener("resize", readTarget);
    const ro = new ResizeObserver(readTarget);
    ro.observe(document.documentElement);

    return () => {
      cancelAnimationFrame(raf.current);
      window.removeEventListener("resize", readTarget);
      ro.disconnect();
    };
  }, [paintThumb, readTarget]);

  useEffect(() => {
    if (!visible) return;
    current.current = scrollMetrics().progress;
    target.current = current.current;
    paintThumb(current.current);
  }, [visible, paintThumb]);

  const scrubToClientY = useCallback((clientY: number, smooth: boolean) => {
    const track = trackRef.current;
    if (!track) return;
    const rect = track.getBoundingClientRect();
    const travel = Math.max(1, rect.height - THUMB_SIZE);
    const t = Math.min(
      1,
      Math.max(0, (clientY - rect.top - THUMB_SIZE / 2) / travel),
    );
    const { max } = scrollMetrics();
    target.current = t;
    if (!smooth) {
      current.current = t;
      paintThumb(t);
    }
    setValueNow(Math.round(t * 100));
    window.scrollTo({ top: t * max, behavior: smooth ? "smooth" : "auto" });
  }, [paintThumb]);

  const onTrackPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    if ((event.target as HTMLElement).dataset.thumb === "1") return;
    scrubToClientY(event.clientY, true);
  };

  const onThumbPointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    dragging.current = true;
    const thumb = event.currentTarget;
    thumb.setPointerCapture(event.pointerId);

    const onMove = (e: PointerEvent) => {
      if (!dragging.current) return;
      scrubToClientY(e.clientY, false);
    };
    const onUp = (e: PointerEvent) => {
      dragging.current = false;
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      try {
        thumb.releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  if (!visible) return null;

  return (
    <div
      ref={trackRef}
      role="scrollbar"
      aria-orientation="vertical"
      aria-controls="main-scroll"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={valueNow}
      aria-label="Page scroll position"
      onPointerDown={onTrackPointerDown}
      className="pointer-events-auto fixed top-[10.5rem] right-24 bottom-[10.5rem] z-40 hidden w-3 sm:block md:right-36 md:top-[12rem] md:bottom-[11.5rem]"
    >
      <span
        aria-hidden
        className="pointer-events-none absolute top-0 bottom-0 left-1/2 w-[2px] -translate-x-1/2 rounded-full"
        style={{ background: "var(--scroll-rail)" }}
      />

      <button
        ref={thumbRef}
        type="button"
        data-thumb="1"
        aria-label="Drag to scroll"
        onPointerDown={onThumbPointerDown}
        className="absolute top-0 left-1/2 h-3.5 w-3.5 rounded-full bg-foreground will-change-transform hover:bg-accent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent"
        style={{ transform: "translate3d(-50%, 0, 0)" }}
      />
    </div>
  );
}
