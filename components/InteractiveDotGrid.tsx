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
      ctx.fillStyle = `rgba(${color.r},${color.g},${color.b},0.22)`;
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

    const themeObserver = new MutationObserver(() => {
      readColor();
      paint();
    });
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => {
      window.removeEventListener("resize", rebuild);
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
