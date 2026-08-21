/** Shared types for the ambient sonification engine. */

export type GeoCoords = {
  lat: number;
  lon: number;
  source: "geolocation" | "ip" | "fallback" | "storm";
};

export type WeatherSnapshot = {
  temperatureC: number;
  humidityPct: number;
  windSpeedMs: number;
  windGustMs: number;
  pressureHpa: number;
  windDirectionDeg: number;
  /** Current precipitation in mm/h. */
  precipitationMm: number;
  fetchedAt: number;
  ok: boolean;
  error?: string;
};

/** A single lightning strike event, relative to the active storm center. */
export type StrikeEvent = {
  lat: number;
  lon: number;
  /** Distance from the storm center in km. */
  distanceKm: number;
  /** Bearing from the storm center in degrees (0 = north). */
  bearingDeg: number;
  at: number;
};

export type StormSnapshot = {
  /** True once an active storm cell has been located. */
  active: boolean;
  center: GeoCoords | null;
  /** Human-readable place near the storm (reverse geocoded). */
  locationName: string | null;
  /** Strikes per minute inside the storm radius. */
  strikesPerMin: number;
  lastStrikeAt: number;
  /** WebSocket connection state. */
  connected: boolean;
};

export type AstroSnapshot = {
  /** Solar elevation in degrees (−90 night … +90 zenith). */
  sunElevationDeg: number;
  sunAzimuthDeg: number;
  /** Lunar illumination 0…1. */
  moonIllumination: number;
  /** Approximate moon phase angle 0…1 (0/1 = new, 0.5 = full). */
  moonPhase: number;
};

export type MouseSnapshot = {
  x: number;
  y: number;
  /** Smoothed velocity in px/s. */
  velocity: number;
  /** Instantaneous acceleration magnitude in px/s². */
  acceleration: number;
  /** Movement heading in radians (−π…π), atan2(dy, dx). */
  direction: number;
  nx: number;
  ny: number;
};

export type SonificationTelemetry = {
  weather: WeatherSnapshot;
  astro: AstroSnapshot;
  mouse: MouseSnapshot;
  storm: StormSnapshot;
  audioRunning: boolean;
  audioReady: boolean;
};

/** Barcelona — coherent defaults when geo / weather fail. */
export const FALLBACK_COORDS: GeoCoords = {
  lat: 41.3874,
  lon: 2.1686,
  source: "fallback",
};

export const FALLBACK_WEATHER: WeatherSnapshot = {
  temperatureC: 18,
  humidityPct: 55,
  windSpeedMs: 3.5,
  windGustMs: 5,
  pressureHpa: 1013,
  windDirectionDeg: 180,
  precipitationMm: 0,
  fetchedAt: 0,
  ok: false,
};

export const EMPTY_STORM: StormSnapshot = {
  active: false,
  center: null,
  locationName: null,
  strikesPerMin: 0,
  lastStrikeAt: 0,
  connected: false,
};
