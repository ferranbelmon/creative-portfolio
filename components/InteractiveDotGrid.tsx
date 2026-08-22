"use client";

import { useEffect, useRef } from "react";

const SPACING = 16;
const RADIUS = 0.85;

type Dot = {
  x: number;
  y: number;
};

type Rgb = { r: number; g: number; b: number };

export function InteractiveDotGrid() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dots: Dot[] = [];
    let width = 0;
    let height = 0;
    let color: Rgb = { r: 255, g: 255, b: 255 };

    const readColor = () => {
      const isLight = document.documentElement.classList.contains("light");
      color = isLight
        ? { r: 18, g: 20, b: 24 }
        : { r: 255, g: 255, b: 255 };
    };

    const paint = () => {
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = `rgba(${color.r},${color.g},${color.b},0.08)`;
      for (const dot of dots) {
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, RADIUS, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const rebuild = () => {
      width = Math.max(1, window.innerWidth);
      height = Math.max(1, window.innerHeight);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      dots.length = 0;
      const cols = Math.ceil(width / SPACING) + 1;
      const rows = Math.ceil(height / SPACING) + 1;
      const offsetX = (width - (cols - 1) * SPACING) / 2;
      const offsetY = (height - (rows - 1) * SPACING) / 2;

      for (let row = 0; row < rows; row += 1) {
        for (let col = 0; col < cols; col += 1) {
          dots.push({
            x: offsetX + col * SPACING,
            y: offsetY + row * SPACING,
          });
        }
      }

      paint();
    };

    readColor();
    rebuild();

    window.addEventListener("resize", rebuild, { passive: true });

    let fadeRaf = 0;

    /** Lerp dot color to the new theme over ~600ms (matches CSS switch). */
    const fadeToThemeColor = () => {
      const from = { ...color };
      const isLight = document.documentElement.classList.contains("light");
      const to: Rgb = isLight
        ? { r: 18, g: 20, b: 24 }
        : { r: 255, g: 255, b: 255 };
      const start = performance.now();
      const DURATION = 600;

      cancelAnimationFrame(fadeRaf);
      const step = (now: number) => {
        const t = Math.min(1, (now - start) / DURATION);
        const e = t * (2 - t);
        color = {
          r: Math.round(from.r + (to.r - from.r) * e),
          g: Math.round(from.g + (to.g - from.g) * e),
          b: Math.round(from.b + (to.b - from.b) * e),
        };
        paint();
        if (t < 1) fadeRaf = requestAnimationFrame(step);
      };
      fadeRaf = requestAnimationFrame(step);
    };

    const themeObserver = new MutationObserver(fadeToThemeColor);
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => {
      window.removeEventListener("resize", rebuild);
      cancelAnimationFrame(fadeRaf);
      themeObserver.disconnect();
    };
  }, []);

  return (
    <div
      ref={wrapRef}
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      aria-hidden
    >
      <canvas ref={canvasRef} className="h-full w-full" />
    </div>
  );
}
