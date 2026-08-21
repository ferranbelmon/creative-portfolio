/** Math helpers for mapping sensor data → audio parameters. */

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

/** Map `value` from [inMin, inMax] into [outMin, outMax], optionally clamped. */
export function mapRange(
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number,
  clampOutput = true,
) {
  const t = (value - inMin) / (inMax - inMin || 1);
  const mapped = outMin + clamp(t, 0, 1) * (outMax - outMin);
  return clampOutput ? clamp(mapped, outMin, outMax) : mapped;
}

export function degToRad(deg: number) {
  return (deg * Math.PI) / 180;
}

export function radToDeg(rad: number) {
  return (rad * 180) / Math.PI;
}

/** Great-circle distance between two lat/lon points in km. */
export function haversineKm(
  a: { lat: number; lon: number },
  b: { lat: number; lon: number },
) {
  const R = 6371;
  const dLat = degToRad(b.lat - a.lat);
  const dLon = degToRad(b.lon - a.lon);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(degToRad(a.lat)) * Math.cos(degToRad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(s)));
}

/** Initial bearing from `a` to `b` in degrees (0 = north, clockwise). */
export function bearingDeg(
  a: { lat: number; lon: number },
  b: { lat: number; lon: number },
) {
  const dLon = degToRad(b.lon - a.lon);
  const y = Math.sin(dLon) * Math.cos(degToRad(b.lat));
  const x =
    Math.cos(degToRad(a.lat)) * Math.sin(degToRad(b.lat)) -
    Math.sin(degToRad(a.lat)) * Math.cos(degToRad(b.lat)) * Math.cos(dLon);
  return (radToDeg(Math.atan2(y, x)) + 360) % 360;
}
