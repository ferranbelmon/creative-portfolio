"use client";

import { useEffect, useRef } from "react";

const RAY_COUNT = 18;
const SMOOTH = 0.07;

type Rgb = { r: number; g: number; b: number };

function parseAccent(): Rgb {
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue("--accent")
    .trim();
  if (raw.startsWith("#") && raw.length >= 7) {
    return {
      r: parseInt(raw.slice(1, 3), 16),
      g: parseInt(raw.slice(3, 5), 16),
      b: parseInt(raw.slice(5, 7), 16),
    };
  }
  return { r: 212, g: 255, b: 0 };
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

type GodraysHeroProps = {
  targetRef: React.RefObject<HTMLElement | null>;
};

export function GodraysHero({ targetRef }: GodraysHeroProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let accent = parseAccent();
    let raf = 0;
    let running = true;

    const light = { x: 0, y: 0 };
    const pointer = { x: 0, y: 0, active: false };
    const targetCenter = { x: 0, y: 0 };

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    function readTargetCenter() {
      const el = targetRef.current;
      const wrapBox = wrap!.getBoundingClientRect();
      if (!el) {
        targetCenter.x = width * 0.5;
        targetCenter.y = height * 0.42;
        return;
      }
      const box = el.getBoundingClientRect();
      targetCenter.x = box.left - wrapBox.left + box.width * 0.5;
      targetCenter.y = box.top - wrapBox.top + box.height * 0.55;
    }

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = Math.max(1, wrap!.clientWidth);
      height = Math.max(1, wrap!.clientHeight);
      canvas!.width = Math.floor(width * dpr);
      canvas!.height = Math.floor(height * dpr);
      canvas!.style.width = `${width}px`;
      canvas!.style.height = `${height}px`;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      readTargetCenter();
      if (light.x === 0 && light.y === 0) {
        light.x = targetCenter.x;
        light.y = targetCenter.y;
        pointer.x = targetCenter.x;
        pointer.y = targetCenter.y;
      }
    }

    function drawRays(time: number) {
      ctx!.clearRect(0, 0, width, height);

      const aimX = pointer.active ? pointer.x : targetCenter.x;
      const aimY = pointer.active ? pointer.y : targetCenter.y;

      if (!reducedMotion) {
        light.x = lerp(light.x, aimX, SMOOTH);
        light.y = lerp(light.y, aimY, SMOOTH);
      } else {
        light.x = targetCenter.x;
        light.y = targetCenter.y;
      }

      const dx = targetCenter.x - light.x;
      const dy = targetCenter.y - light.y;
      const distToName = Math.hypot(dx, dy);
      const nameBoost = Math.max(0, 1 - distToName / Math.min(width, height));

      const maxLen = Math.hypot(width, height) * 1.15;
      const baseAngle = Math.atan2(
        targetCenter.y - light.y,
        targetCenter.x - light.x,
      );
      const drift = reducedMotion ? 0 : time * 0.00008;

      ctx!.save();
      ctx!.globalCompositeOperation = "screen";

      for (let i = 0; i < RAY_COUNT; i += 1) {
        const t = i / RAY_COUNT;
        const fan = (t - 0.5) * 1.35;
        const wobble = Math.sin(i * 2.17 + time * 0.0006) * 0.06;
        const angle = baseAngle + fan + wobble + drift;
        const spread = 0.045 + Math.sin(i * 1.9) * 0.018;
        const len = maxLen * (0.72 + Math.sin(i * 1.3) * 0.12);

        const x1 = light.x + Math.cos(angle - spread) * len;
        const y1 = light.y + Math.sin(angle - spread) * len;
        const x2 = light.x + Math.cos(angle + spread) * len;
        const y2 = light.y + Math.sin(angle + spread) * len;

        ctx!.beginPath();
        ctx!.moveTo(light.x, light.y);
        ctx!.lineTo(x1, y1);
        ctx!.lineTo(x2, y2);
        ctx!.closePath();

        const alpha = (0.04 + nameBoost * 0.07) * (0.65 + Math.sin(i * 1.1) * 0.35);
        const grad = ctx!.createLinearGradient(
          light.x,
          light.y,
          light.x + Math.cos(angle) * len,
          light.y + Math.sin(angle) * len,
        );
        grad.addColorStop(0, `rgba(${accent.r},${accent.g},${accent.b},${alpha * 1.4})`);
        grad.addColorStop(0.35, `rgba(${accent.r},${accent.g},${accent.b},${alpha * 0.45})`);
        grad.addColorStop(1, `rgba(${accent.r},${accent.g},${accent.b},0)`);
        ctx!.fillStyle = grad;
        ctx!.fill();
      }

      const glow = ctx!.createRadialGradient(
        light.x,
        light.y,
        0,
        light.x,
        light.y,
        120 + nameBoost * 80,
      );
      glow.addColorStop(
        0,
        `rgba(${accent.r},${accent.g},${accent.b},${0.14 + nameBoost * 0.1})`,
      );
      glow.addColorStop(0.45, `rgba(${accent.r},${accent.g},${accent.b},0.03)`);
      glow.addColorStop(1, "rgba(0,0,0,0)");
      ctx!.fillStyle = glow;
      ctx!.fillRect(0, 0, width, height);

      ctx!.restore();
    }

    function frame(time: number) {
      if (!running) return;
      accent = parseAccent();
      readTargetCenter();
      drawRays(time);
      raf = requestAnimationFrame(frame);
    }

    function onPointerMove(event: PointerEvent) {
      const box = wrap!.getBoundingClientRect();
      pointer.x = event.clientX - box.left;
      pointer.y = event.clientY - box.top;
      pointer.active = true;
    }

    function onPointerLeave() {
      pointer.active = false;
    }

    const themeObserver = new MutationObserver(() => {
      accent = parseAccent();
    });
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    resize();
    raf = requestAnimationFrame(frame);

    window.addEventListener("resize", resize, { passive: true });
    wrap.addEventListener("pointermove", onPointerMove, { passive: true });
    wrap.addEventListener("pointerleave", onPointerLeave);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      wrap.removeEventListener("pointermove", onPointerMove);
      wrap.removeEventListener("pointerleave", onPointerLeave);
      themeObserver.disconnect();
    };
  }, [targetRef]);

  return (
    <div ref={wrapRef} className="absolute inset-0 overflow-hidden">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full"
        aria-hidden
      />
    </div>
  );
}
