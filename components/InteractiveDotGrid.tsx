"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";

const SPACING = 28;
const BASE_RADIUS = 1;
const MAX_RADIUS = 6.5;
const INFLUENCE = 110;
const PUSH = 12;
const LERP = 0.28;
const TRAIL_MAX = 36;
const TRAIL_SAMPLE_DIST = 10;

type Dot = {
  ox: number;
  oy: number;
  x: number;
  y: number;
  r: number;
  energy: number;
};

type TrailPoint = {
  x: number;
  y: number;
  life: number;
};

type Rgb = { r: number; g: number; b: number };

function parseCssColor(value: string, fallback: Rgb): Rgb {
  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return fallback;
  ctx.fillStyle = value;
  ctx.fillRect(0, 0, 1, 1);
  const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
  return { r, g, b };
}

function mix(a: Rgb, b: Rgb, t: number): Rgb {
  return {
    r: Math.round(a.r + (b.r - a.r) * t),
    g: Math.round(a.g + (b.g - a.g) * t),
    b: Math.round(a.b + (b.b - a.b) * t),
  };
}

export function InteractiveDotGrid() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dots: Dot[] = [];
    const trail: TrailPoint[] = [];
    const mouse = { x: -9999, y: -9999, prevX: -9999, prevY: -9999 };
    let width = 0;
    let height = 0;
    let dpr = 1;
    let frame = 0;
    let baseColor: Rgb = { r: 255, g: 255, b: 255 };
    let accentColor: Rgb = { r: 212, g: 255, b: 0 };
    let running = true;
    let animating = false;

    const readColors = () => {
      const root = getComputedStyle(document.documentElement);
      const isLight = document.documentElement.classList.contains("light");
      baseColor = isLight
        ? { r: 18, g: 20, b: 24 }
        : { r: 255, g: 255, b: 255 };
      accentColor = parseCssColor(
        root.getPropertyValue("--accent").trim() || "#d4ff00",
        { r: 212, g: 255, b: 0 },
      );
    };

    const rebuild = () => {
      const rect = wrap.getBoundingClientRect();
      width = Math.max(1, Math.floor(rect.width));
      height = Math.max(1, Math.floor(rect.height));
      dpr = Math.min(window.devicePixelRatio || 1, 2);

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
          const ox = offsetX + col * SPACING;
          const oy = offsetY + row * SPACING;
          dots.push({ ox, oy, x: ox, y: oy, r: BASE_RADIUS, energy: 0 });
        }
      }
    };

    const pushTrail = (x: number, y: number) => {
      if (mouse.prevX < -9000) {
        trail.push({ x, y, life: 1 });
        mouse.prevX = x;
        mouse.prevY = y;
        return;
      }

      const dx = x - mouse.prevX;
      const dy = y - mouse.prevY;
      const dist = Math.hypot(dx, dy);
      if (dist < TRAIL_SAMPLE_DIST) return;

      const steps = Math.min(6, Math.ceil(dist / TRAIL_SAMPLE_DIST));
      for (let i = 1; i <= steps; i += 1) {
        const t = i / steps;
        trail.push({
          x: mouse.prevX + dx * t,
          y: mouse.prevY + dy * t,
          life: 1,
        });
      }

      mouse.prevX = x;
      mouse.prevY = y;

      while (trail.length > TRAIL_MAX) trail.shift();
    };

    const paint = () => {
      ctx.clearRect(0, 0, width, height);

      let settling = false;

      for (let i = trail.length - 1; i >= 0; i -= 1) {
        trail[i].life -= 0.0175;
        if (trail[i].life <= 0) {
          trail.splice(i, 1);
          settling = true;
        } else {
          settling = true;
        }
      }

      for (const dot of dots) {
        let field = 0;
        let pushX = 0;
        let pushY = 0;

        for (let i = 0; i < trail.length; i += 1) {
          const point = trail[i];
          const weight = point.life * ((i + 1) / trail.length);
          const dx = point.x - dot.ox;
          const dy = point.y - dot.oy;
          const dist = Math.hypot(dx, dy);
          const t = Math.max(0, 1 - dist / INFLUENCE);
          if (t <= 0) continue;
          const eased = t * t * weight;
          field = Math.max(field, eased);
          if (dist > 0.001) {
            const strength = PUSH * eased;
            pushX -= (dx / dist) * strength;
            pushY -= (dy / dist) * strength;
          }
        }

        // Current cursor tip — strongest sample
        if (mouse.x > -9000) {
          const dx = mouse.x - dot.ox;
          const dy = mouse.y - dot.oy;
          const dist = Math.hypot(dx, dy);
          const t = Math.max(0, 1 - dist / INFLUENCE);
          if (t > 0) {
            const eased = t * t;
            field = Math.max(field, eased);
            if (dist > 0.001) {
              const strength = PUSH * eased;
              pushX -= (dx / dist) * strength;
              pushY -= (dy / dist) * strength;
            }
          }
        }

        const targetEnergy = field;
        const nextEnergy = dot.energy + (targetEnergy - dot.energy) * LERP;
        if (Math.abs(nextEnergy - targetEnergy) > 0.01) settling = true;
        if (nextEnergy > 0.01) settling = true;
        dot.energy = nextEnergy;

        const eased = dot.energy;
        const targetR = BASE_RADIUS + (MAX_RADIUS - BASE_RADIUS) * eased;
        const nextR = dot.r + (targetR - dot.r) * LERP;
        if (Math.abs(nextR - targetR) > 0.03) settling = true;
        dot.r = nextR;

        const targetX = dot.ox + pushX;
        const targetY = dot.oy + pushY;
        const nextX = dot.x + (targetX - dot.x) * LERP;
        const nextY = dot.y + (targetY - dot.y) * LERP;
        if (
          Math.abs(nextX - targetX) > 0.15 ||
          Math.abs(nextY - targetY) > 0.15
        ) {
          settling = true;
        }
        dot.x = nextX;
        dot.y = nextY;

        const tint = mix(baseColor, accentColor, eased);
        const alpha = 0.2 + eased * 0.75;

        if (eased > 0.25) {
          ctx.beginPath();
          ctx.fillStyle = `rgba(${accentColor.r},${accentColor.g},${accentColor.b},${0.06 + eased * 0.2})`;
          ctx.arc(dot.x, dot.y, dot.r * 2.6, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.beginPath();
        ctx.fillStyle = `rgba(${tint.r},${tint.g},${tint.b},${alpha})`;
        ctx.arc(dot.x, dot.y, dot.r, 0, Math.PI * 2);
        ctx.fill();
      }

      return settling || trail.length > 0;
    };

    const drawStatic = () => {
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = `rgba(${baseColor.r},${baseColor.g},${baseColor.b},0.22)`;
      for (const dot of dots) {
        ctx.beginPath();
        ctx.arc(dot.ox, dot.oy, BASE_RADIUS, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const tick = () => {
      if (!running) return;
      const settling = paint();
      if (settling) {
        frame = requestAnimationFrame(tick);
      } else {
        animating = false;
        frame = 0;
      }
    };

    const kick = () => {
      if (reduceMotion || animating || !running) return;
      animating = true;
      frame = requestAnimationFrame(tick);
    };

    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      const rect = wrap.getBoundingClientRect();
      mouse.x = event.clientX - rect.left;
      mouse.y = event.clientY - rect.top;
      pushTrail(mouse.x, mouse.y);
      kick();
    };

    const onPointerLeave = () => {
      mouse.x = -9999;
      mouse.y = -9999;
      mouse.prevX = -9999;
      mouse.prevY = -9999;
      kick();
    };

    const onTheme = () => {
      readColors();
      if (reduceMotion) drawStatic();
      else kick();
    };

    readColors();
    rebuild();
    if (reduceMotion) drawStatic();
    else paint();

    const observer = new ResizeObserver(() => {
      rebuild();
      if (reduceMotion) drawStatic();
      else {
        paint();
        kick();
      }
    });
    observer.observe(wrap);

    const themeObserver = new MutationObserver(onTheme);
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    document.documentElement.addEventListener("mouseleave", onPointerLeave);

    return () => {
      running = false;
      cancelAnimationFrame(frame);
      observer.disconnect();
      themeObserver.disconnect();
      window.removeEventListener("pointermove", onPointerMove);
      document.documentElement.removeEventListener("mouseleave", onPointerLeave);
    };
  }, [reduceMotion]);

  return (
    <div
      ref={wrapRef}
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
      aria-hidden
    >
      <canvas ref={canvasRef} className="h-full w-full" />
    </div>
  );
}
