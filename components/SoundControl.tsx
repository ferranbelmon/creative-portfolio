"use client";

import { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { getSonificationController } from "@/lib/sonification/controller";
import {
  formatLatLon,
  placeCodeFromName,
} from "@/lib/sonification/place-code";
import { EMPTY_STORM, type SonificationTelemetry } from "@/lib/sonification/types";

function emptyTelemetry(): SonificationTelemetry {
  return {
    weather: {
      temperatureC: 0,
      humidityPct: 0,
      windSpeedMs: 0,
      windGustMs: 0,
      pressureHpa: 0,
      windDirectionDeg: 0,
      precipitationMm: 0,
      fetchedAt: 0,
      ok: false,
    },
    storm: { ...EMPTY_STORM },
    astro: {
      sunElevationDeg: 0,
      sunAzimuthDeg: 0,
      moonIllumination: 0,
      moonPhase: 0,
    },
    mouse: {
      x: 0,
      y: 0,
      velocity: 0,
      acceleration: 0,
      direction: 0,
      nx: 0,
      ny: 0,
    },
    audioRunning: false,
    audioReady: false,
  };
}

const VU_SEGMENTS = 32;

type SoundControlProps = {
  /** Footer opens the telemetry panel upward. */
  placement?: "header" | "footer";
};

export function SoundControl({ placement = "header" }: SoundControlProps) {
  const [mounted, setMounted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  const [telemetry, setTelemetry] = useState<SonificationTelemetry>(emptyTelemetry);
  const [volume, setVolume] = useState(1);
  const [level, setLevel] = useState(0);
  const levelRef = useRef(0);

  useEffect(() => {
    setMounted(true);
    const controller = getSonificationController();
    // Start storm search as soon as the chrome mounts — don't wait for unmute.
    void controller.ensureServices();
    setTelemetry(controller.getTelemetry());
    setVolume(controller.audio.getVolume());
    const unsubscribe = controller.subscribe(() => {
      setTelemetry(controller.getTelemetry());
    });

    let unlock: (() => void) | null = null;

    // Try autoplay; if blocked, unlock on the next user gesture.
    void controller.ensurePlaying().then((ok) => {
      if (ok) {
        setTelemetry(controller.getTelemetry());
        return;
      }
      unlock = () => {
        void controller.ensurePlaying().then(() => {
          setTelemetry(controller.getTelemetry());
        });
        if (unlock) {
          window.removeEventListener("pointerdown", unlock);
          window.removeEventListener("keydown", unlock);
          unlock = null;
        }
      };
      window.addEventListener("pointerdown", unlock);
      window.addEventListener("keydown", unlock);
    });

    return () => {
      unsubscribe();
      if (unlock) {
        window.removeEventListener("pointerdown", unlock);
        window.removeEventListener("keydown", unlock);
      }
    };
  }, []);

  // Live VU while audio is running (or panel open).
  useEffect(() => {
    if (!mounted) return;
    const controller = getSonificationController();
    let raf = 0;
    const tick = () => {
      const next = controller.audio.getLevel();
      levelRef.current += (next - levelRef.current) * 0.35;
      setLevel(levelRef.current);
      if (controller.audio.isRunning() || open) {
        setTelemetry(controller.getTelemetry());
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [mounted, open]);

  useEffect(() => {
    if (!open) return;
    const controller = getSonificationController();
    void controller.ensureServices();
  }, [open]);

  async function toggle() {
    if (busy) return;
    setBusy(true);
    try {
      const controller = getSonificationController();
      await controller.toggle();
      setTelemetry(controller.getTelemetry());
    } finally {
      setBusy(false);
    }
  }

  function onVolumeChange(value: number) {
    setVolume(value);
    try {
      getSonificationController().audio.setVolume(value);
    } catch {
      // ignore
    }
  }

  if (!mounted) {
    return (
      <button
        type="button"
        aria-label="Enable ambient audio"
        className="rounded-xl border border-border/70 p-2 text-muted"
        disabled
      >
        <VolumeX size={18} strokeWidth={1.6} aria-hidden />
      </button>
    );
  }

  const running = telemetry.audioRunning;
  const w = telemetry.weather;
  const m = telemetry.mouse;
  const storm = telemetry.storm;
  const code = placeCodeFromName(storm.locationName);
  const coords = storm.center;
  const lit = Math.round(level * VU_SEGMENTS);
  const isFooter = placement === "footer";

  const titleBlock = (
    <div
      className={`flex-col leading-tight ${isFooter ? "flex max-w-[12rem] text-right" : "hidden max-w-[11rem] md:flex"}`}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <p className="font-mono text-[0.58rem] uppercase tracking-[0.14em] text-foreground/85">
        {storm.active
          ? `Storm in ${code}`
          : storm.connected
            ? "Storm locating…"
            : "Storm offline"}
        {!running ? " · muted" : ""}
      </p>
      <p className="font-mono text-[0.52rem] tracking-[0.08em] text-muted tabular-nums">
        {storm.active && coords
          ? formatLatLon(coords.lat, coords.lon)
          : "— —"}
      </p>
    </div>
  );

  const vuBlock = (
    <div
      className={`relative h-9 w-40 items-center ${isFooter ? "flex" : "hidden sm:flex"}`}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-1/2 flex h-3.5 -translate-y-full items-end gap-[1px]"
        role="meter"
        aria-label="Audio level"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(level * 100)}
      >
        {Array.from({ length: VU_SEGMENTS }, (_, i) => (
          <span
            key={i}
            className={`w-full max-w-[2px] flex-1 rounded-[0.5px] transition-[opacity,background-color,height] duration-75 ${
              i < lit
                ? i > VU_SEGMENTS * 0.85
                  ? "bg-accent"
                  : "bg-foreground/85"
                : "bg-border"
            }`}
            style={{
              height: i < lit ? `${4 + (i / VU_SEGMENTS) * 10}px` : "2px",
              opacity: running ? (i < lit ? 1 : 0.55) : 0.3,
            }}
          />
        ))}
      </div>

      <label className="relative z-10 flex w-full items-center">
        <span className="sr-only">Volume</span>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={volume}
          disabled={!running}
          onChange={(event) => onVolumeChange(Number(event.target.value))}
          className="sound-volume-slider w-full cursor-pointer disabled:opacity-40"
          aria-label="Volume"
        />
      </label>
    </div>
  );

  const muteButton = (
    <button
      type="button"
      onClick={() => void toggle()}
      onMouseEnter={() => setOpen(true)}
      onFocus={() => setOpen(true)}
      onBlur={(event) => {
        if (!event.currentTarget.parentElement?.contains(event.relatedTarget as Node)) {
          setOpen(false);
        }
      }}
      aria-label={running ? "Mute ambient audio" : "Enable ambient audio"}
      aria-pressed={running}
      aria-busy={busy}
      className="rounded-xl border border-border/70 p-2 text-muted transition-colors hover:border-accent/45 hover:text-accent"
    >
      {running ? (
        <Volume2
          size={18}
          strokeWidth={1.6}
          className="text-accent"
          aria-hidden
        />
      ) : (
        <VolumeX size={18} strokeWidth={1.6} aria-hidden />
      )}
    </button>
  );

  return (
    <div
      className={`relative flex items-center gap-3 ${isFooter ? "justify-end" : ""}`}
    >
      {isFooter ? (
        <>
          {titleBlock}
          {vuBlock}
          {muteButton}
        </>
      ) : (
        <>
          {muteButton}
          {vuBlock}
          {titleBlock}
        </>
      )}

      {open ? (
        <div
          role="status"
          onMouseEnter={() => setOpen(true)}
          onMouseLeave={() => setOpen(false)}
          className={`absolute right-0 z-50 min-w-[12rem] border border-border bg-background/95 px-3 py-2.5 font-mono text-[0.58rem] uppercase tracking-[0.14em] text-muted shadow-sm backdrop-blur-md ${
            isFooter ? "bottom-full mb-2" : "top-full mt-2"
          }`}
        >
          <p className="mb-2 text-foreground/80">
            audio {running ? "on" : "off"}
            {!w.ok ? " · weather fallback" : ""}
          </p>
          <p className="mb-2 text-accent/90">
            {storm.active
              ? `storm · ${storm.locationName ?? "locating…"} · ${code}`
              : storm.connected
                ? "searching storm…"
                : "waiting…"}
          </p>
          <ul className="space-y-1 tabular-nums">
            <li>temp {w.temperatureC.toFixed(1)}°c</li>
            <li>hum {Math.round(w.humidityPct)}%</li>
            <li>
              wind {w.windSpeedMs.toFixed(1)} / gust {w.windGustMs.toFixed(1)} m/s
            </li>
            <li>rain {w.precipitationMm.toFixed(1)} mm/h</li>
            {storm.active ? (
              <li>strikes {storm.strikesPerMin}/min</li>
            ) : null}
            <li>mouse v {Math.round(m.velocity)}</li>
            <li>vol {Math.round(volume * 100)}%</li>
          </ul>
        </div>
      ) : null}
    </div>
  );
}
