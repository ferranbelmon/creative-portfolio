/**
 * WeatherService — geolocation + Open-Meteo current conditions.
 * Falls back to IP lookup, then Barcelona defaults on any failure.
 */

import {
  FALLBACK_COORDS,
  FALLBACK_WEATHER,
  type GeoCoords,
  type WeatherSnapshot,
} from "@/lib/sonification/types";

const WEATHER_REFRESH_MS = 10 * 60 * 1000;

async function resolveCoords(): Promise<GeoCoords> {
  // Prefer IP approx — never call navigator.geolocation (no permission prompt).
  try {
    const res = await fetch("https://ipapi.co/json/", {
      signal: AbortSignal.timeout(5000),
    });
    if (res.ok) {
      const data = (await res.json()) as {
        latitude?: number;
        longitude?: number;
      };
      if (
        typeof data.latitude === "number" &&
        typeof data.longitude === "number"
      ) {
        return {
          lat: data.latitude,
          lon: data.longitude,
          source: "ip",
        };
      }
    }
  } catch {
    // continue
  }

  return { ...FALLBACK_COORDS };
}

async function fetchOpenMeteo(coords: GeoCoords): Promise<WeatherSnapshot> {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", String(coords.lat));
  url.searchParams.set("longitude", String(coords.lon));
  url.searchParams.set(
    "current",
    [
      "temperature_2m",
      "relative_humidity_2m",
      "wind_speed_10m",
      "wind_gusts_10m",
      "surface_pressure",
      "wind_direction_10m",
      "precipitation",
    ].join(","),
  );
  url.searchParams.set("wind_speed_unit", "ms");

  const res = await fetch(url.toString(), {
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`Open-Meteo HTTP ${res.status}`);

  const data = (await res.json()) as {
    current?: Record<string, number>;
  };
  const c = data.current;
  if (!c) throw new Error("Open-Meteo missing current block");

  return {
    temperatureC: c.temperature_2m ?? FALLBACK_WEATHER.temperatureC,
    humidityPct: c.relative_humidity_2m ?? FALLBACK_WEATHER.humidityPct,
    windSpeedMs: c.wind_speed_10m ?? FALLBACK_WEATHER.windSpeedMs,
    windGustMs: c.wind_gusts_10m ?? FALLBACK_WEATHER.windGustMs,
    pressureHpa: c.surface_pressure ?? FALLBACK_WEATHER.pressureHpa,
    windDirectionDeg: c.wind_direction_10m ?? FALLBACK_WEATHER.windDirectionDeg,
    precipitationMm: c.precipitation ?? FALLBACK_WEATHER.precipitationMm,
    fetchedAt: Date.now(),
    ok: true,
  };
}

export class WeatherService {
  private coords: GeoCoords = { ...FALLBACK_COORDS };
  private weather: WeatherSnapshot = { ...FALLBACK_WEATHER };
  private timer: number | null = null;
  private listeners = new Set<() => void>();

  getCoords() {
    return this.coords;
  }

  /**
   * Point the weather at new coordinates (e.g. an active storm center)
   * and refetch. Ignores moves under ~25 km to avoid useless refetches.
   */
  setCoords(coords: GeoCoords) {
    const moved =
      Math.abs(coords.lat - this.coords.lat) > 0.25 ||
      Math.abs(coords.lon - this.coords.lon) > 0.25 ||
      coords.source !== this.coords.source;
    this.coords = coords;
    if (moved) void this.refresh();
  }

  getWeather() {
    return this.weather;
  }

  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    for (const listener of this.listeners) listener();
  }

  async start() {
    this.coords = await resolveCoords();
    await this.refresh();
    if (this.timer != null) window.clearInterval(this.timer);
    this.timer = window.setInterval(() => {
      void this.refresh();
    }, WEATHER_REFRESH_MS);
  }

  stop() {
    if (this.timer != null) {
      window.clearInterval(this.timer);
      this.timer = null;
    }
  }

  async refresh() {
    try {
      this.weather = await fetchOpenMeteo(this.coords);
    } catch (error) {
      this.weather = {
        ...FALLBACK_WEATHER,
        fetchedAt: Date.now(),
        ok: false,
        error: error instanceof Error ? error.message : "Weather fetch failed",
      };
    }
    this.notify();
  }
}
