/**
 * Map storm place → stable scale degree for UI tones,
 * always relative to the temperature / pad tonic.
 */

/** Major-scale intervals from the tonic (just ratios). */
export const MAJOR_DEGREES = [
  1, // 1 tonic
  9 / 8, // 2
  5 / 4, // 3
  4 / 3, // 4
  3 / 2, // 5
  5 / 3, // 6
  15 / 8, // 7
] as const;

function hashString(value: string): number {
  let h = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Prefer country (last comma segment); fall back to full name / coords. */
export function placeKeyFromStorm(input: {
  locationName?: string | null;
  lat?: number | null;
  lon?: number | null;
}): string {
  const name = input.locationName?.trim();
  if (name) {
    const parts = name.split(",").map((p) => p.trim()).filter(Boolean);
    const country = parts[parts.length - 1];
    if (country) return country.toLowerCase();
    return name.toLowerCase();
  }
  if (
    typeof input.lat === "number" &&
    typeof input.lon === "number" &&
    Number.isFinite(input.lat) &&
    Number.isFinite(input.lon)
  ) {
    return `${Math.round(input.lat * 5)}_${Math.round(input.lon * 5)}`;
  }
  return "unknown";
}

/** Stable 0…6 degree index from place/country. */
export function placeDegreeIndex(placeKey: string): number {
  return hashString(placeKey) % MAJOR_DEGREES.length;
}

export function degreeRatio(degreeIndex: number): number {
  const i =
    ((degreeIndex % MAJOR_DEGREES.length) + MAJOR_DEGREES.length) %
    MAJOR_DEGREES.length;
  return MAJOR_DEGREES[i]!;
}
