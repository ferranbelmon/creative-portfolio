/**
 * SonificationController — wires weather, astro, mouse, and audio together.
 */

import { AstroService } from "@/lib/sonification/astro";
import { AudioEngine } from "@/lib/sonification/audio-engine";
import { LightningService } from "@/lib/sonification/lightning";
import { MouseTracker } from "@/lib/sonification/mouse";
import {
  FALLBACK_WEATHER,
  type SonificationTelemetry,
} from "@/lib/sonification/types";
import { WeatherService } from "@/lib/sonification/weather";

export class SonificationController {
  readonly weather = new WeatherService();
  readonly astro = new AstroService();
  readonly mouse = new MouseTracker();
  readonly audio = new AudioEngine();
  readonly lightning = new LightningService();

  private listeners = new Set<() => void>();
  private bootstrapped = false;

  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    for (const listener of this.listeners) listener();
  }

  getTelemetry(): SonificationTelemetry {
    const coords = this.weather.getCoords();
    return {
      weather: this.weather.getWeather(),
      astro: this.astro.getSnapshot(new Date(), coords),
      mouse: this.mouse.getSnapshot(),
      storm: this.lightning.getStorm(),
      audioRunning: this.audio.isRunning(),
      audioReady: this.audio.isReady(),
    };
  }

  async ensureServices() {
    if (this.bootstrapped) return;
    this.bootstrapped = true;
    this.mouse.start();

    // Storm-first: when an active storm is located, all weather/astro data
    // follows that place. Until then (or if the feed fails) we stay on the
    // listener's local weather.
    this.lightning.start();
    this.lightning.subscribe(() => {
      const storm = this.lightning.getStorm();
      if (storm.active && storm.center) {
        this.weather.setCoords(storm.center);
      }
      this.notify();
    });
    this.lightning.onStrike((strike) => {
      this.audio.triggerStrike(strike);
      this.notify();
    });

    await this.weather.start();
    this.weather.subscribe(() => this.notify());
    this.notify();
  }

  private bindAudioFrame() {
    return (now: number) => {
      const weather = this.weather.getWeather() ?? FALLBACK_WEATHER;
      const coords = this.weather.getCoords();
      const astro = this.astro.getSnapshot(new Date(), coords);
      const mouse = this.mouse.tick(now);
      const storm = this.lightning.getStorm();
      this.audio.update(weather, astro, mouse, storm);
      this.notify();
    };
  }

  /** Start audio if not already running (used by boot gate / autoplay unlock). */
  async ensurePlaying() {
    await this.ensureServices();
    if (this.audio.isRunning()) {
      this.notify();
      return true;
    }
    await this.audio.start(this.bindAudioFrame());
    this.notify();
    return this.audio.isRunning();
  }

  async toggle() {
    await this.ensureServices();

    const running = await this.audio.toggle(this.bindAudioFrame());

    this.notify();
    return running;
  }

  playUiTone() {
    if (!this.audio.isRunning()) return;
    this.audio.triggerUiTone();
  }

  dispose() {
    this.weather.stop();
    this.mouse.stop();
    this.lightning.stop();
    this.audio.dispose();
  }
}

/** Singleton for the site session (client-only). */
let singleton: SonificationController | null = null;

export function getSonificationController() {
  if (typeof window === "undefined") {
    throw new Error("SonificationController is client-only");
  }
  if (!singleton) singleton = new SonificationController();
  return singleton;
}
