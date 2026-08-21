/**
 * LightningService — locates the most active thunderstorm on Earth via the
 * Blitzortung.org live WebSocket, then emits throttled strike events from
 * that storm cell.
 *
 * Pipeline:
 * 1. Subscribe to the global strike stream (LZW-compressed JSON frames).
 * 2. Keep a rolling buffer and periodically cluster strikes into ~1° cells.
 * 3. The densest cell (with hysteresis so we don't hop between storms) is
 *    the "active storm". Its center is reverse-geocoded to a place name.
 * 4. Strikes inside the storm radius are throttled into sparse events
 *    (one every EVENT_MIN_GAP…EVENT_MAX_GAP ms) for sonification.
 *
 * Unofficial API: hosts are rotated on failure and everything degrades
 * gracefully (the engine falls back to listener-local weather).
 */

import { bearingDeg, haversineKm } from "@/lib/sonification/math";
import {
  EMPTY_STORM,
  type GeoCoords,
  type StormSnapshot,
  type StrikeEvent,
} from "@/lib/sonification/types";

const HOSTS = [
  "wss://ws1.blitzortung.org/",
  "wss://ws7.blitzortung.org/",
  "wss://ws8.blitzortung.org/",
];

const BUFFER_MS = 5 * 60_000;
const MAX_BUFFER = 4000;
/** Re-cluster often so the first storm lock is seconds, not half a minute. */
const CLUSTER_INTERVAL_MS = 2_500;
/** Minimum strikes per cell (5 min window) to qualify as an active storm. */
const MIN_CLUSTER_STRIKES = 4;
/** Evaluate as soon as we have this many buffered strikes (cold start). */
const BOOTSTRAP_STRIKES = 10;
/** Keep the current storm while it has ≥ this fraction of the best cell. */
const HYSTERESIS = 0.6;
const STORM_RADIUS_KM = 250;
const EVENT_MIN_GAP_MS = 10_000;
const EVENT_MAX_GAP_MS = 24_000;
const RECONNECT_DELAY_MS = 5_000;

type BufferedStrike = { lat: number; lon: number; at: number };

/** Blitzortung frames are LZW-compressed JSON strings. */
function lzwDecode(input: string) {
  if (!input) return "";
  const dict = new Map<number, string>();
  let currChar = input[0];
  let oldPhrase = currChar;
  const out = [currChar];
  let code = 256;
  for (let i = 1; i < input.length; i += 1) {
    const currCode = input.charCodeAt(i);
    let phrase: string;
    if (currCode < 256) {
      phrase = input[i];
    } else {
      phrase = dict.get(currCode) ?? oldPhrase + currChar;
    }
    out.push(phrase);
    currChar = phrase.charAt(0);
    dict.set(code, oldPhrase + currChar);
    code += 1;
    oldPhrase = phrase;
  }
  return out.join("");
}

async function reverseGeocode(coords: { lat: number; lon: number }) {
  try {
    const url = new URL("https://api.bigdatacloud.net/data/reverse-geocode-client");
    url.searchParams.set("latitude", String(coords.lat));
    url.searchParams.set("longitude", String(coords.lon));
    url.searchParams.set("localityLanguage", "en");
    const res = await fetch(url.toString(), { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      city?: string;
      locality?: string;
      principalSubdivision?: string;
      countryName?: string;
    };
    const place =
      data.city || data.locality || data.principalSubdivision || null;
    if (place && data.countryName) return `${place}, ${data.countryName}`;
    return data.countryName ?? place;
  } catch {
    return null;
  }
}

export class LightningService {
  private ws: WebSocket | null = null;
  private hostIndex = 0;
  private active = false;
  private reconnectTimer: number | null = null;
  private clusterTimer: number | null = null;

  private buffer: BufferedStrike[] = [];
  private storm: StormSnapshot = { ...EMPTY_STORM };
  private geocodeToken = 0;

  private lastEventAt = 0;
  private nextGapMs = EVENT_MIN_GAP_MS;
  /** Best candidate (closest to center) since the last emitted event. */
  private candidate: BufferedStrike | null = null;

  private stormListeners = new Set<() => void>();
  private strikeListeners = new Set<(event: StrikeEvent) => void>();

  getStorm(): StormSnapshot {
    return this.storm;
  }

  subscribe(listener: () => void) {
    this.stormListeners.add(listener);
    return () => {
      this.stormListeners.delete(listener);
    };
  }

  onStrike(listener: (event: StrikeEvent) => void) {
    this.strikeListeners.add(listener);
    return () => {
      this.strikeListeners.delete(listener);
    };
  }

  private notifyStorm() {
    for (const listener of this.stormListeners) listener();
  }

  start() {
    if (this.active || typeof window === "undefined") return;
    this.active = true;
    this.connect();
    this.clusterTimer = window.setInterval(() => {
      this.evaluateStorm();
    }, CLUSTER_INTERVAL_MS);
  }

  stop() {
    this.active = false;
    if (this.reconnectTimer != null) {
      window.clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.clusterTimer != null) {
      window.clearInterval(this.clusterTimer);
      this.clusterTimer = null;
    }
    try {
      this.ws?.close();
    } catch {
      // ignore
    }
    this.ws = null;
    this.storm = { ...EMPTY_STORM };
  }

  private connect() {
    if (!this.active) return;
    const host = HOSTS[this.hostIndex % HOSTS.length];
    try {
      this.ws = new WebSocket(host);
    } catch {
      this.scheduleReconnect();
      return;
    }

    this.ws.onopen = () => {
      this.ws?.send(JSON.stringify({ a: 111 }));
      this.storm = { ...this.storm, connected: true };
      this.notifyStorm();
    };

    this.ws.onmessage = (event) => {
      try {
        const strike = JSON.parse(lzwDecode(String(event.data))) as {
          lat?: number;
          lon?: number;
        };
        if (typeof strike.lat !== "number" || typeof strike.lon !== "number") {
          return;
        }
        this.ingest({ lat: strike.lat, lon: strike.lon, at: Date.now() });
      } catch {
        // malformed frame — ignore
      }
    };

    this.ws.onclose = () => {
      this.storm = { ...this.storm, connected: false };
      this.notifyStorm();
      this.scheduleReconnect();
    };
    this.ws.onerror = () => {
      try {
        this.ws?.close();
      } catch {
        // ignore
      }
    };
  }

  private scheduleReconnect() {
    if (!this.active || this.reconnectTimer != null) return;
    this.hostIndex += 1;
    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, RECONNECT_DELAY_MS);
  }

  private ingest(strike: BufferedStrike) {
    this.buffer.push(strike);
    if (this.buffer.length > MAX_BUFFER) {
      this.buffer.splice(0, this.buffer.length - MAX_BUFFER);
    }

    // First strikes: bootstrap a storm quickly instead of waiting for the timer.
    if (
      !this.storm.active &&
      this.buffer.length >= BOOTSTRAP_STRIKES &&
      (this.buffer.length === BOOTSTRAP_STRIKES || this.buffer.length % 4 === 0)
    ) {
      this.evaluateStorm();
    }

    const center = this.storm.center;
    if (!this.storm.active || !center) return;

    const distanceKm = haversineKm(center, strike);
    if (distanceKm > STORM_RADIUS_KM) return;

    this.storm = { ...this.storm, lastStrikeAt: strike.at };

    // Keep the strike closest to the storm core as the next event candidate.
    if (
      !this.candidate ||
      distanceKm < haversineKm(center, this.candidate)
    ) {
      this.candidate = strike;
    }

    const now = Date.now();
    if (now - this.lastEventAt >= this.nextGapMs && this.candidate) {
      const chosen = this.candidate;
      this.candidate = null;
      this.lastEventAt = now;
      this.nextGapMs =
        EVENT_MIN_GAP_MS +
        Math.random() * (EVENT_MAX_GAP_MS - EVENT_MIN_GAP_MS);
      const event: StrikeEvent = {
        lat: chosen.lat,
        lon: chosen.lon,
        distanceKm: haversineKm(center, chosen),
        bearingDeg: bearingDeg(center, chosen),
        at: chosen.at,
      };
      for (const listener of this.strikeListeners) listener(event);
    }
  }

  private evaluateStorm() {
    const cutoff = Date.now() - BUFFER_MS;
    this.buffer = this.buffer.filter((s) => s.at >= cutoff);
    if (this.buffer.length === 0) return;

    // Cluster into ~1° cells.
    const cells = new Map<
      string,
      { count: number; sumLat: number; sumLon: number }
    >();
    for (const s of this.buffer) {
      const key = `${Math.floor(s.lat)}:${Math.floor(s.lon)}`;
      const cell = cells.get(key) ?? { count: 0, sumLat: 0, sumLon: 0 };
      cell.count += 1;
      cell.sumLat += s.lat;
      cell.sumLon += s.lon;
      cells.set(key, cell);
    }

    let best: { count: number; lat: number; lon: number } | null = null;
    for (const cell of cells.values()) {
      if (!best || cell.count > best.count) {
        best = {
          count: cell.count,
          lat: cell.sumLat / cell.count,
          lon: cell.sumLon / cell.count,
        };
      }
    }
    if (!best || best.count < MIN_CLUSTER_STRIKES) {
      if (this.storm.active) {
        this.storm = { ...this.storm, active: false, strikesPerMin: 0 };
        this.notifyStorm();
      }
      return;
    }

    // Hysteresis: stick with the current storm while it stays comparable.
    let center: GeoCoords;
    const current = this.storm.center;
    if (current && this.storm.active) {
      const nearCurrent = this.buffer.filter(
        (s) => haversineKm(current, s) <= STORM_RADIUS_KM,
      );
      if (nearCurrent.length >= best.count * HYSTERESIS) {
        const sumLat = nearCurrent.reduce((acc, s) => acc + s.lat, 0);
        const sumLon = nearCurrent.reduce((acc, s) => acc + s.lon, 0);
        center = {
          lat: sumLat / nearCurrent.length,
          lon: sumLon / nearCurrent.length,
          source: "storm",
        };
      } else {
        center = { lat: best.lat, lon: best.lon, source: "storm" };
      }
    } else {
      center = { lat: best.lat, lon: best.lon, source: "storm" };
    }

    const minuteCutoff = Date.now() - 60_000;
    const strikesPerMin = this.buffer.filter(
      (s) => s.at >= minuteCutoff && haversineKm(center, s) <= STORM_RADIUS_KM,
    ).length;

    const moved =
      !current || haversineKm(current, center) > 100 || !this.storm.active;

    this.storm = {
      ...this.storm,
      active: true,
      center,
      strikesPerMin,
      locationName: moved ? null : this.storm.locationName,
    };
    this.notifyStorm();

    if (moved) {
      const token = (this.geocodeToken += 1);
      void reverseGeocode(center).then((name) => {
        if (token !== this.geocodeToken || !name) return;
        this.storm = { ...this.storm, locationName: name };
        this.notifyStorm();
      });
    }
  }
}
