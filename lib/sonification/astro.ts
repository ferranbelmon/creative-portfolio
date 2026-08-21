/**
 * AstroService — solar elevation/azimuth + lunar illumination.
 * Uses NOAA-style solar position and a simple lunar phase approximation
 * (no external astronomy packages).
 */

import { degToRad, radToDeg } from "@/lib/sonification/math";
import type { AstroSnapshot, GeoCoords } from "@/lib/sonification/types";

function julianDay(date: Date) {
  return date.getTime() / 86400000 + 2440587.5;
}

/**
 * Approximate solar elevation & azimuth for lat/lon at `date` (local Date).
 * Accurate enough for ambient sonification mapping.
 */
export function computeSunPosition(date: Date, coords: GeoCoords) {
  const jd = julianDay(date);
  const n = jd - 2451545.0;
  const L = (280.46 + 0.9856474 * n) % 360;
  const g = degToRad((357.528 + 0.9856003 * n) % 360);
  const lambda = degToRad(
    L + 1.915 * Math.sin(g) + 0.02 * Math.sin(2 * g),
  );
  const epsilon = degToRad(23.439 - 0.0000004 * n);

  const alpha = Math.atan2(Math.cos(epsilon) * Math.sin(lambda), Math.cos(lambda));
  const delta = Math.asin(Math.sin(epsilon) * Math.sin(lambda));

  const gmst =
    (18.697374558 + 24.06570982441908 * n) % 24;
  const lst =
    ((gmst + coords.lon / 15) % 24) * 15;
  const ha = degToRad(lst) - alpha;

  const lat = degToRad(coords.lat);
  const sinAlt =
    Math.sin(lat) * Math.sin(delta) +
    Math.cos(lat) * Math.cos(delta) * Math.cos(ha);
  const elevation = radToDeg(Math.asin(clampSin(sinAlt)));

  const cosAz =
    (Math.sin(delta) - Math.sin(lat) * Math.sin(degToRad(elevation))) /
    (Math.cos(lat) * Math.cos(degToRad(elevation)) || 1e-6);
  let azimuth = radToDeg(Math.acos(clampSin(cosAz)));
  if (Math.sin(ha) > 0) azimuth = 360 - azimuth;

  return { elevation, azimuth };
}

function clampSin(value: number) {
  return Math.min(1, Math.max(-1, value));
}

/**
 * Approximate moon illumination (0…1) and phase cycle (0…1).
 * Based on mean elongation from a simplified lunar ephemeris.
 */
export function computeMoonPhase(date: Date) {
  const jd = julianDay(date);
  // Synodic month reference: new moon near JD 2451550.1
  const daysSinceNew = jd - 2451550.1;
  const phase = ((daysSinceNew % 29.53058867) + 29.53058867) % 29.53058867;
  const cycle = phase / 29.53058867;
  const illumination = 0.5 * (1 - Math.cos(2 * Math.PI * cycle));
  return { moonPhase: cycle, moonIllumination: illumination };
}

export class AstroService {
  getSnapshot(date: Date, coords: GeoCoords): AstroSnapshot {
    const sun = computeSunPosition(date, coords);
    const moon = computeMoonPhase(date);
    return {
      sunElevationDeg: sun.elevation,
      sunAzimuthDeg: sun.azimuth,
      moonIllumination: moon.moonIllumination,
      moonPhase: moon.moonPhase,
    };
  }
}
