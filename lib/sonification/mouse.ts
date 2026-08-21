/**
 * MouseTracker — position, smoothed velocity, instantaneous acceleration.
 */

import { clamp, lerp } from "@/lib/sonification/math";
import type { MouseSnapshot } from "@/lib/sonification/types";

const VELOCITY_LERP = 0.18;
const ACCEL_LERP = 0.25;

export class MouseTracker {
  private x = 0;
  private y = 0;
  private prevX = 0;
  private prevY = 0;
  private prevVx = 0;
  private prevVy = 0;
  private velocity = 0;
  private acceleration = 0;
  private direction = 0;
  private lastTs = 0;
  private active = false;
  private onMove: ((event: PointerEvent) => void) | null = null;

  start() {
    if (this.active || typeof window === "undefined") return;
    this.active = true;
    this.lastTs = performance.now();
    this.x = window.innerWidth * 0.5;
    this.y = window.innerHeight * 0.5;
    this.prevX = this.x;
    this.prevY = this.y;

    this.onMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      this.x = event.clientX;
      this.y = event.clientY;
    };
    window.addEventListener("pointermove", this.onMove, { passive: true });
  }

  stop() {
    if (!this.active) return;
    this.active = false;
    if (this.onMove) {
      window.removeEventListener("pointermove", this.onMove);
      this.onMove = null;
    }
  }

  /** Call once per animation frame while audio is running. */
  tick(now = performance.now()): MouseSnapshot {
    const dt = Math.max(0.001, (now - this.lastTs) / 1000);
    this.lastTs = now;

    const dx = this.x - this.prevX;
    const dy = this.y - this.prevY;
    this.prevX = this.x;
    this.prevY = this.y;

    const vx = dx / dt;
    const vy = dy / dt;
    const speed = Math.hypot(vx, vy);
    this.velocity = lerp(this.velocity, speed, VELOCITY_LERP);

    const ax = (vx - this.prevVx) / dt;
    const ay = (vy - this.prevVy) / dt;
    this.prevVx = vx;
    this.prevVy = vy;
    const accel = Math.hypot(ax, ay);
    this.acceleration = lerp(this.acceleration, accel, ACCEL_LERP);

    if (speed > 8) {
      this.direction = Math.atan2(dy, dx);
    }

    const w = typeof window !== "undefined" ? window.innerWidth || 1 : 1;
    const h = typeof window !== "undefined" ? window.innerHeight || 1 : 1;

    return {
      x: this.x,
      y: this.y,
      velocity: this.velocity,
      acceleration: this.acceleration,
      direction: this.direction,
      nx: clamp(this.x / w, 0, 1),
      ny: clamp(this.y / h, 0, 1),
    };
  }

  getSnapshot(): MouseSnapshot {
    const w = typeof window !== "undefined" ? window.innerWidth || 1 : 1;
    const h = typeof window !== "undefined" ? window.innerHeight || 1 : 1;
    return {
      x: this.x,
      y: this.y,
      velocity: this.velocity,
      acceleration: this.acceleration,
      direction: this.direction,
      nx: clamp(this.x / w, 0, 1),
      ny: clamp(this.y / h, 0, 1),
    };
  }
}
