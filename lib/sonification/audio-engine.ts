/**
 * AudioEngine — contemporary storm atmosphere (conceptual, not literal).
 *
 * Layers:
 * 1. Body — thin mid chord + noisy bandpass texture (temperature = root).
 * 2. Wind — filtered noise (speed / gusts / direction).
 * 3. Rain field — dense hiss from precipitation.
 * 4. Drops — discrete soft grains; density & size follow water amount.
 * 5. Strike blooms — rare harmonic flashes that also open the space briefly.
 * 6. Mouse air — subtle filter / chorus / air noise.
 * 7. Pad — clean major triad from temperature, soft swell + reverb (no pitch wander).
 *
 * Bass is a generative gong (soft attack, long decay) timed by weather — not a drone.
 */

import { clamp, mapRange } from "@/lib/sonification/math";
import {
  degreeRatio,
  placeDegreeIndex,
  placeKeyFromStorm,
} from "@/lib/sonification/harmony";
import type {
  AstroSnapshot,
  MouseSnapshot,
  StormSnapshot,
  StrikeEvent,
  WeatherSnapshot,
} from "@/lib/sonification/types";

const SMOOTH = 0.28;
const FILTER_SMOOTH = 0.4;
const GAIN_SMOOTH = 0.55;

type EngineStatus = "idle" | "running" | "suspended";

type ChordVoice = {
  oscs: Array<{ osc: OscillatorNode; baseDetune: number }>;
  gain: GainNode;
  ratio: number;
  lfo: OscillatorNode;
  lfoGain: GainNode;
  lfoRateHz: number;
};

function setTarget(
  param: AudioParam,
  value: number,
  ctx: AudioContext,
  timeConstant = SMOOTH,
) {
  const v = Number.isFinite(value) ? value : param.value;
  if (typeof param.cancelAndHoldAtTime === "function") {
    param.cancelAndHoldAtTime(ctx.currentTime);
  }
  param.setTargetAtTime(v, ctx.currentTime, timeConstant);
}

function createNoiseBuffer(ctx: AudioContext, seconds = 4) {
  const length = Math.floor(ctx.sampleRate * seconds);
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  let b0 = 0;
  let b1 = 0;
  let b2 = 0;
  for (let i = 0; i < length; i += 1) {
    const white = Math.random() * 2 - 1;
    b0 = 0.99765 * b0 + white * 0.099046;
    b1 = 0.963 * b1 + white * 0.2965164;
    b2 = 0.57 * b2 + white * 1.0526913;
    data[i] = (b0 + b1 + b2 + white * 0.1848) * 0.11;
  }
  return buffer;
}

function createClickBuffer(ctx: AudioContext, variant = 0) {
  // Ultra-short impulses (~0.2–0.4 ms) — rain ticks, no body.
  const ms = 0.00022 + (variant % 4) * 0.00005;
  const length = Math.max(4, Math.floor(ctx.sampleRate * ms));
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  // A few bipolar shapes for variety.
  const shapes: Array<(i: number, n: number) => number> = [
    (i) => (i === 0 ? 1 : i === 1 ? -0.7 : 0),
    (i) => (i === 0 ? -1 : i === 1 ? 0.55 : i === 2 ? -0.2 : 0),
    (i, n) => (i === 0 ? 0.85 : i === 1 ? -0.4 : i === 2 ? 0.15 : 0) * (1 - i / n),
    (i) => (i === 0 ? 1 : 0),
  ];
  const shape = shapes[variant % shapes.length]!;
  for (let i = 0; i < length; i += 1) {
    data[i] = shape(i, length);
  }
  return buffer;
}

function createReverbImpulse(ctx: AudioContext, seconds = 6.5, decay = 2.0) {
  const length = Math.floor(ctx.sampleRate * seconds);
  const impulse = ctx.createBuffer(2, length, ctx.sampleRate);
  for (let channel = 0; channel < 2; channel += 1) {
    const data = impulse.getChannelData(channel);
    for (let i = 0; i < length; i += 1) {
      const t = i / length;
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - t, decay);
    }
  }
  return impulse;
}

/** Soft-clip / fuzz transfer curve for strike grit. */
function createFuzzCurve(amount = 2.4) {
  const n = 256;
  const curve = new Float32Array(n);
  for (let i = 0; i < n; i += 1) {
    const x = (i * 2) / (n - 1) - 1;
    curve[i] = ((1 + amount) * x) / (1 + amount * Math.abs(x));
  }
  return curve;
}

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  /** User-facing volume 0…1 (after analyser). */
  private userVolume: GainNode | null = null;
  private analyser: AnalyserNode | null = null;
  private analyserBuffer: Float32Array<ArrayBuffer> | null = null;
  private volumeValue = 1;
  private masterFilter: BiquadFilterNode | null = null;
  private masterHighpass: BiquadFilterNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  private panner: StereoPannerNode | null = null;

  private dryGain: GainNode | null = null;
  private wetGain: GainNode | null = null;
  private convolver: ConvolverNode | null = null;

  private chordFilter: BiquadFilterNode | null = null;
  private chordHighpass: BiquadFilterNode | null = null;
  private voices: ChordVoice[] = [];
  private thirdVoice: ChordVoice | null = null;
  private ninthVoice: ChordVoice | null = null;

  /** Noisy body keyed to the chord midrange. */
  private bodyNoiseGain: GainNode | null = null;
  private bodyNoiseFilter: BiquadFilterNode | null = null;
  private bodyNoiseSource: AudioBufferSourceNode | null = null;

  /** Gong bass — soft attack, long decay, generative timing from weather. */
  private bassOsc: OscillatorNode | null = null;
  private bassOsc2: OscillatorNode | null = null;
  private bassOsc3: OscillatorNode | null = null;
  private bassFilter: BiquadFilterNode | null = null;
  private bassGain: GainNode | null = null;
  private bassWetSend: GainNode | null = null;
  private bassConvolver: ConvolverNode | null = null;
  private bassWetGain: GainNode | null = null;
  private bassLevel = 0.08;
  private bassGong: "wait" | "sound" = "wait";
  private bassGongUntil = 0;
  private bassGongFrom = 0;
  private bassGongLevel = 0;
  private bassGongPeak = 0.08;
  private bassGongGapMs = 18_000;
  private bassLockedFreq = 55;

  private windGain: GainNode | null = null;
  private windFilter: BiquadFilterNode | null = null;
  private noiseSource: AudioBufferSourceNode | null = null;

  private mouseNoiseGain: GainNode | null = null;
  private mouseNoiseFilter: BiquadFilterNode | null = null;
  private mouseNoiseSource: AudioBufferSourceNode | null = null;

  private rainGain: GainNode | null = null;
  private rainFilter: BiquadFilterNode | null = null;
  private rainSource: AudioBufferSourceNode | null = null;

  /**
   * Larsen-style howl: high sine chord into a resonant delay loop
   * (mic → speaker feedback character without a real acoustic path).
   */
  private howlOscs: OscillatorNode[] = [];
  private howlBp: BiquadFilterNode | null = null;
  private howlDelay: DelayNode | null = null;
  private howlFeedback: GainNode | null = null;
  private howlGain: GainNode | null = null;
  private howlDrive: GainNode | null = null;
  private howlLfo: OscillatorNode | null = null;
  private howlLfoGain: GainNode | null = null;
  private howlNoiseGain: GainNode | null = null;
  private howlNoiseSource: AudioBufferSourceNode | null = null;
  /** Dry howl level before user volume (swell envelope writes here). */
  private howlDryGain: GainNode | null = null;
  private howlWetSend: GainNode | null = null;
  private howlConvolver: ConvolverNode | null = null;
  private howlWetGain: GainNode | null = null;
  /** Swell: long quiet gaps → soft pad → long reverb tail. */
  private howlSwell: "wait" | "sound" | "tail" = "wait";
  private howlSwellUntil = 0;
  private howlSwellFrom = 0;
  private howlSwellLevel = 0;
  private howlSwellPeak = 0.08;
  /** Octave register above the temperature bass (pure 2^n). */
  private howlOctave = 3;
  private howlRootHz = 220;
  /** Pitch locked at gesture start — never glides with envelope or weather. */
  private howlLockedRoot = 220;
  private howlPitchApplied = false;
  /** Active voicing ratios for this gesture (changes each appearance). */
  private howlVoicing: number[] = [1, 5 / 4, 3 / 2];
  /** Soft fixed detunes (cents) for pad width — not LFO pitch wander. */
  private readonly howlDetunes = [0, -7, 6] as const;
  /** Aesthetic major-family voicings (always consonant with temp root). */
  private readonly howlVoicingPool: number[][] = [
    [1, 5 / 4, 3 / 2], // major
    [1, 9 / 8, 3 / 2], // sus2 / add9 color
    [1, 5 / 4, 15 / 8], // maj7
    [1, 5 / 4, 5 / 3], // maj6
    [5 / 4, 3 / 2, 2], // 1st inversion flavor
    [1, 3 / 2, 2], // open fifth + octave
    [1, 5 / 4, 2], // major + octave
  ];

  private dropBus: GainNode | null = null;
  private dropDry: GainNode | null = null;
  private dropDelay: DelayNode | null = null;
  private dropDelayFeedback: GainNode | null = null;
  private dropDelayWet: GainNode | null = null;
  private dropDelayFilter: BiquadFilterNode | null = null;
  /** Tiny atonal impulse buffers (rain tick variants). */
  private clickBuffer: AudioBuffer | null = null;
  private clickBuffers: AudioBuffer[] = [];
  private uiNoiseBuffer: AudioBuffer | null = null;
  private nextDropAt = 0;
  /** Effective water intensity for drops: precip mm/h + storm density. */
  private waterIntensity = 0;
  /** Sonify only once an active storm cell is locked. */
  private stormLive = false;

  private status: EngineStatus = "idle";
  /** User unmuted — resume when the window comes back. */
  private userWantsAudio = false;
  private visibilityBound = false;
  private raf = 0;
  private onFrame: ((now: number) => void) | null = null;
  private lastFundamental = 140;
  /** Last tonal bass frequency — UI beeps sit a fifth above this. */
  private lastBassFreq = 55;
  /** Place/country seed → which scale degree UI tones use. */
  private placeDegree = 0;
  private placeKey = "unknown";

  private uiBus: GainNode | null = null;
  private uiConvolver: ConvolverNode | null = null;

  /** Decaying strike influence on filters / wetness (0…1). */
  private strikeGlow = 0;
  private strikeGlowTarget = 0;

  /**
   * Accumulating strike bed: fuzz → textured reverb → feedback delay.
   * Each strike injects and raises the bed; it bleeds down slowly.
   */
  private strikeIn: GainNode | null = null;
  private strikeShaper: WaveShaperNode | null = null;
  private strikeFilter: BiquadFilterNode | null = null;
  private strikeVerb: ConvolverNode | null = null;
  private strikeFbDelay: DelayNode | null = null;
  private strikeFbGain: GainNode | null = null;
  private strikeBedGain: GainNode | null = null;
  private strikeBedLevel = 0;
  /** Dedicated long reverb for the parallel click send (dry + wet together). */
  private strikeClickVerb: ConvolverNode | null = null;
  private strikeClickWet: GainNode | null = null;

  getStatus(): EngineStatus {
    return this.status;
  }

  isRunning() {
    return this.status === "running";
  }

  isReady() {
    return this.ctx != null;
  }

  async start(onFrame?: (now: number) => void) {
    if (!this.ctx) {
      this.ctx = new AudioContext();
      this.buildGraph(this.ctx);
    }

    if (this.ctx.state === "suspended") {
      await this.ctx.resume();
    }

    this.onFrame = onFrame ?? null;
    this.userWantsAudio = true;
    this.bindVisibility();

    // Autoplay policies can leave the context suspended until a gesture.
    if (this.ctx.state !== "running") {
      this.status = "suspended";
      return;
    }

    this.status = "running";
    this.nextDropAt = performance.now();
    this.kickLoop();
  }

  async pause() {
    if (!this.ctx) return;
    this.userWantsAudio = false;
    this.status = "suspended";
    this.dumpFeedback();
    if (this.raf) {
      cancelAnimationFrame(this.raf);
      this.raf = 0;
    }
    if (this.ctx.state === "running") {
      await this.ctx.suspend();
    }
  }

  async toggle(onFrame?: (now: number) => void) {
    if (this.status === "running") {
      await this.pause();
      return false;
    }
    await this.start(onFrame);
    return this.isRunning();
  }

  dispose() {
    void this.pause();
    for (const voice of this.voices) {
      for (const { osc } of voice.oscs) {
        try {
          osc.stop();
          osc.disconnect();
        } catch {
          // already stopped
        }
      }
      try {
        voice.lfo.stop();
        voice.lfo.disconnect();
      } catch {
        // ignore
      }
    }
    this.voices = [];
    this.thirdVoice = null;
    this.ninthVoice = null;
    for (const osc of [this.bassOsc, this.bassOsc2, this.bassOsc3, this.howlLfo, ...this.howlOscs]) {
      try {
        osc?.stop();
        osc?.disconnect();
      } catch {
        // ignore
      }
    }
    this.bassOsc = null;
    this.bassOsc2 = null;
    this.bassOsc3 = null;
    this.howlOscs = [];
    this.howlLfo = null;
    for (const source of [
      this.noiseSource,
      this.mouseNoiseSource,
      this.rainSource,
      this.bodyNoiseSource,
      this.howlNoiseSource,
    ]) {
      try {
        source?.stop();
        source?.disconnect();
      } catch {
        // ignore
      }
    }
    void this.ctx?.close();
    this.ctx = null;
    this.status = "idle";
    this.userWantsAudio = false;
    if (typeof window !== "undefined" && this.visibilityBound) {
      document.removeEventListener("visibilitychange", this.onPageHideShow);
      window.removeEventListener("pagehide", this.onPageHideShow);
      window.removeEventListener("blur", this.onWindowInactive);
      window.removeEventListener("focus", this.onWindowActive);
      this.visibilityBound = false;
    }
  }

  private bindVisibility() {
    if (this.visibilityBound || typeof window === "undefined") return;
    this.visibilityBound = true;
    document.addEventListener("visibilitychange", this.onPageHideShow);
    window.addEventListener("pagehide", this.onPageHideShow);
    window.addEventListener("blur", this.onWindowInactive);
    window.addEventListener("focus", this.onWindowActive);
  }

  private onPageHideShow = () => {
    if (typeof document !== "undefined" && document.hidden) {
      this.onWindowInactive();
    } else {
      this.onWindowActive();
    }
  };

  private onWindowInactive = () => {
    if (!this.userWantsAudio) return;
    this.dumpFeedback();
    if (this.ctx?.state === "running") {
      void this.ctx.suspend();
    }
  };

  private onWindowActive = () => {
    if (!this.userWantsAudio || this.status !== "running" || !this.ctx) return;
    if (this.ctx.state === "suspended") {
      void this.ctx.resume().then(() => {
        if (this.userWantsAudio && this.status === "running") this.kickLoop();
      });
    }
  };

  /** Kill delay loops / pad tails so nothing rings while the tab is backgrounded. */
  private dumpFeedback() {
    const ctx = this.ctx;
    if (!ctx) return;
    const now = ctx.currentTime;
    const kill = (param: AudioParam | undefined | null) => {
      if (!param) return;
      param.cancelScheduledValues(now);
      param.setValueAtTime(0.0001, now);
    };
    kill(this.dropDelayFeedback?.gain);
    kill(this.dropDelayWet?.gain);
    kill(this.strikeFbGain?.gain);
    kill(this.strikeBedGain?.gain);
    kill(this.howlFeedback?.gain);
    kill(this.howlDryGain?.gain);
    kill(this.howlWetSend?.gain);
    kill(this.howlGain?.gain);
    kill(this.howlNoiseGain?.gain);
    kill(this.masterGain?.gain);
    this.howlSwell = "wait";
    this.howlSwellLevel = 0;
    this.howlSwellUntil = performance.now() + 6000;
    this.howlPitchApplied = false;
    this.strikeBedLevel = 0;
    this.strikeGlow = 0;
    this.strikeGlowTarget = 0;
  }

  private pageIsInactive() {
    if (typeof document === "undefined") return false;
    return document.hidden || !document.hasFocus();
  }

  private kickLoop() {
    if (this.raf) cancelAnimationFrame(this.raf);
    const tick = (now: number) => {
      if (this.status !== "running") return;
      if (this.pageIsInactive()) {
        this.dumpFeedback();
        if (this.ctx?.state === "running") void this.ctx.suspend();
        this.raf = requestAnimationFrame(tick);
        return;
      }
      if (this.ctx?.state === "suspended" && this.userWantsAudio) {
        void this.ctx.resume();
        this.raf = requestAnimationFrame(tick);
        return;
      }
      this.onFrame?.(now);
      this.scheduleDrops(now);
      this.tickHowlSwell(now);
      this.tickBassGong(now);
      this.strikeGlow += (this.strikeGlowTarget - this.strikeGlow) * 0.04;
      this.strikeGlowTarget *= 0.992;
      // Strike fuzz bed decays slowly between hits (accumulation bleeds out).
      this.strikeBedLevel *= 0.9975;
      if (this.strikeBedGain && this.ctx) {
        this.strikeBedGain.gain.setTargetAtTime(
          Math.max(0.0001, this.strikeBedLevel * 0.55),
          this.ctx.currentTime,
          0.25,
        );
      }
      if (this.strikeFbGain && this.ctx) {
        this.strikeFbGain.gain.setTargetAtTime(
          clamp(0.22 + this.strikeBedLevel * 0.2, 0.15, 0.42),
          this.ctx.currentTime,
          0.4,
        );
      }
      this.raf = requestAnimationFrame(tick);
    };
    this.raf = requestAnimationFrame(tick);
  }

  /**
   * Pad gestures: long attack → hold → fade, multi-second reverb tail,
   * then 10–30s silence before a new voicing appears.
   */
  private tickHowlSwell(now: number) {
    if (!this.stormLive || !this.howlDryGain || !this.howlWetSend || !this.ctx) {
      this.howlSwellLevel *= 0.9;
      if (this.howlDryGain && this.ctx) {
        this.howlDryGain.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.2);
      }
      if (this.howlWetSend && this.ctx) {
        this.howlWetSend.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.4);
      }
      return;
    }

    const ctx = this.ctx;

    if (now >= this.howlSwellUntil) {
      if (this.howlSwell === "wait") {
        this.howlSwell = "sound";
        this.howlSwellFrom = now;
        // Longer gesture so the attack can breathe (~4–5.5s dry).
        const dur = 4000 + Math.random() * 1500;
        this.howlSwellUntil = now + dur;
        this.howlSwellPeak = 0.028 + Math.random() * 0.014;
        this.howlOctave = 2;
        this.howlPitchApplied = false;
        const pool = this.howlVoicingPool;
        let idx = Math.floor(Math.random() * pool.length);
        let next = pool[idx] ?? pool[0]!;
        if (
          next.length === this.howlVoicing.length &&
          next.every((r, i) => r === this.howlVoicing[i])
        ) {
          next = pool[(idx + 1) % pool.length]!;
        }
        this.howlVoicing = [...next];
      } else if (this.howlSwell === "sound") {
        this.howlSwell = "tail";
        this.howlSwellFrom = now;
        this.howlSwellUntil = now + 4_500 + Math.random() * 2_500; // 4.5–7s tail
      } else {
        this.howlSwell = "wait";
        this.howlSwellUntil = now + 10_000 + Math.random() * 20_000;
      }
    }

    let dryTarget = 0;
    let wetTarget = 0.0001;

    if (this.howlSwell === "sound") {
      const dur = Math.max(1, this.howlSwellUntil - this.howlSwellFrom);
      const t = clamp((now - this.howlSwellFrom) / dur, 0, 1);
      let env = 0;
      if (t < 0.65) {
        const u = t / 0.65;
        env = u * u * u;
      } else if (t < 0.78) {
        env = 1;
      } else {
        const u = (t - 0.78) / 0.22;
        env = (1 - u) * (1 - u);
      }
      // Mostly wet — dry stays tiny so it sits in the bed.
      dryTarget = this.howlSwellPeak * env * 0.2;
      wetTarget = this.howlSwellPeak * (0.9 + env * 1.35);
    } else if (this.howlSwell === "tail") {
      dryTarget = 0;
      const tailDur = Math.max(1, this.howlSwellUntil - this.howlSwellFrom);
      const u = clamp((now - this.howlSwellFrom) / tailDur, 0, 1);
      wetTarget = this.howlSwellPeak * 1.15 * Math.pow(1 - u, 1.3);
    }

    const ease =
      this.howlSwell === "sound" && this.howlSwellLevel < this.howlSwellPeak * 0.85
        ? 0.022
        : this.howlSwell === "tail"
          ? 0.028
          : 0.06;
    this.howlSwellLevel += (dryTarget - this.howlSwellLevel) * ease;
    const dry = Math.max(0.0001, this.howlSwellLevel);
    this.howlDryGain.gain.setTargetAtTime(dry, ctx.currentTime, 0.25);
    this.howlWetSend.gain.setTargetAtTime(
      Math.max(0.0001, wetTarget),
      ctx.currentTime,
      this.howlSwell === "tail" ? 0.9 : 0.3,
    );
  }

  /**
   * Bass as generative gong: soft attack, long decay, timing from weather.
   */
  private tickBassGong(now: number) {
    if (!this.stormLive || !this.bassGain || !this.ctx) {
      this.bassGongLevel *= 0.9;
      if (this.bassGain && this.ctx) {
        this.bassGain.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.25);
      }
      if (this.bassWetSend && this.ctx) {
        this.bassWetSend.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.35);
      }
      if (this.bodyNoiseGain && this.ctx) {
        this.bodyNoiseGain.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.3);
      }
      return;
    }

    const ctx = this.ctx;

    if (now >= this.bassGongUntil) {
      if (this.bassGong === "wait") {
        this.bassGong = "sound";
        this.bassGongFrom = now;
        // Long gong body (attack soft + long sustain/decay).
        const dur = 10_000 + Math.random() * 8_000; // 10–18s
        this.bassGongUntil = now + dur;
        this.bassGongPeak = this.bassLevel * (0.85 + Math.random() * 0.35);

        // Lock pitch from temperature bass; small generative variation.
        const base = Math.max(40, this.lastBassFreq);
        const pick = Math.random();
        this.bassLockedFreq =
          pick < 0.2
            ? base * 0.75 // deeper
            : pick < 0.4
              ? base * 1.125 // slight lift
              : base;

        const nowT = ctx.currentTime;
        if (this.bassOsc) {
          this.bassOsc.frequency.cancelScheduledValues(nowT);
          this.bassOsc.frequency.setValueAtTime(this.bassLockedFreq, nowT);
        }
        if (this.bassOsc2) {
          this.bassOsc2.frequency.cancelScheduledValues(nowT);
          this.bassOsc2.frequency.setValueAtTime(this.bassLockedFreq * 2, nowT);
        }
        if (this.bassOsc3) {
          this.bassOsc3.frequency.cancelScheduledValues(nowT);
          this.bassOsc3.frequency.setValueAtTime(this.bassLockedFreq * 1.5, nowT);
        }
      } else {
        this.bassGong = "wait";
        this.bassGongUntil =
          now + this.bassGongGapMs * (0.85 + Math.random() * 0.35);
      }
    }

    let target = 0;
    let wetTarget = 0.0001;
    let rumble = 0.0001;

    if (this.bassGong === "sound") {
      const dur = Math.max(1, this.bassGongUntil - this.bassGongFrom);
      const t = clamp((now - this.bassGongFrom) / dur, 0, 1);
      // Soft attack (~12%), then long exponential-ish decay.
      let env = 0;
      if (t < 0.12) {
        const u = t / 0.12;
        env = u * u; // gentle ease-in
      } else {
        const u = (t - 0.12) / 0.88;
        env = Math.pow(1 - u, 1.65);
      }
      target = this.bassGongPeak * env;
      wetTarget = this.bassGongPeak * (0.7 + env * 1.1);
      rumble = 0.012 * env;
    }

    this.bassGongLevel += (target - this.bassGongLevel) * 0.04;
    const level = Math.max(0.0001, this.bassGongLevel);
    this.bassGain.gain.setTargetAtTime(level, ctx.currentTime, 0.2);
    if (this.bassWetSend) {
      this.bassWetSend.gain.setTargetAtTime(
        Math.max(0.0001, wetTarget),
        ctx.currentTime,
        0.35,
      );
    }
    if (this.bodyNoiseGain) {
      this.bodyNoiseGain.gain.setTargetAtTime(rumble, ctx.currentTime, 0.25);
    }
  }

  private createVoice(
    ctx: AudioContext,
    ratio: number,
    baseGain: number,
    lfoRateHz: number,
    destination: AudioNode,
    wave: OscillatorType = "sine",
  ): ChordVoice {
    const gain = ctx.createGain();
    gain.gain.value = baseGain;
    gain.connect(destination);

    const lfo = ctx.createOscillator();
    lfo.type = "sine";
    lfo.frequency.value = lfoRateHz;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = baseGain * 0.22;
    lfo.connect(lfoGain).connect(gain.gain);
    lfo.start();

    const oscs = [-5, 5].map((baseDetune) => {
      const osc = ctx.createOscillator();
      osc.type = wave;
      osc.frequency.value = 140 * ratio;
      osc.detune.value = baseDetune;
      const oscGain = ctx.createGain();
      oscGain.gain.value = 0.5;
      osc.connect(oscGain).connect(gain);
      osc.start();
      return { osc, baseDetune };
    });

    return { oscs, gain, ratio, lfo, lfoGain, lfoRateHz };
  }

  private buildGraph(ctx: AudioContext) {
    this.compressor = ctx.createDynamicsCompressor();
    this.compressor.threshold.value = -22;
    this.compressor.knee.value = 20;
    this.compressor.ratio.value = 2.2;
    this.compressor.attack.value = 0.04;
    this.compressor.release.value = 0.35;

    // Thin the bottom of the whole mix so bass never dominates.
    this.masterHighpass = ctx.createBiquadFilter();
    this.masterHighpass.type = "highpass";
    this.masterHighpass.frequency.value = 95;
    this.masterHighpass.Q.value = 0.5;

    this.masterFilter = ctx.createBiquadFilter();
    this.masterFilter.type = "lowpass";
    this.masterFilter.frequency.value = 4200;
    this.masterFilter.Q.value = 0.4;

    this.panner = ctx.createStereoPanner();
    this.panner.pan.value = 0;

    this.masterGain = ctx.createGain();
    this.masterGain.gain.value = 0.0001;

    this.userVolume = ctx.createGain();
    this.userVolume.gain.value = this.volumeValue;

    this.analyser = ctx.createAnalyser();
    this.analyser.fftSize = 256;
    this.analyser.smoothingTimeConstant = 0.75;
    this.analyserBuffer = new Float32Array(new ArrayBuffer(this.analyser.fftSize * 4));

    this.dryGain = ctx.createGain();
    this.dryGain.gain.value = 0.85;

    this.convolver = ctx.createConvolver();
    this.convolver.buffer = createReverbImpulse(ctx);
    this.wetGain = ctx.createGain();
    this.wetGain.gain.value = 0.55;

    this.masterHighpass.connect(this.masterFilter);
    this.masterFilter.connect(this.dryGain).connect(this.panner);
    this.masterFilter.connect(this.convolver);
    this.convolver.connect(this.wetGain).connect(this.panner);

    this.panner
      .connect(this.compressor)
      .connect(this.analyser)
      .connect(this.masterGain)
      .connect(this.userVolume)
      .connect(ctx.destination);

    setTarget(this.masterGain.gain, 1.5, ctx, 1.4);

    // —— Chord body (thin, mid-focused) ——
    this.chordHighpass = ctx.createBiquadFilter();
    this.chordHighpass.type = "highpass";
    this.chordHighpass.frequency.value = 180;
    this.chordHighpass.Q.value = 0.6;

    this.chordFilter = ctx.createBiquadFilter();
    this.chordFilter.type = "lowpass";
    this.chordFilter.frequency.value = 1400;
    this.chordFilter.Q.value = 0.55;
    this.chordHighpass
      .connect(this.chordFilter)
      .connect(this.masterHighpass);

    // Quiet root, stronger mid voices — body lives in the midrange.
    // Gains start at 0: for now we hear events only (drops + strikes).
    const root = this.createVoice(ctx, 1, 0, 0.028, this.chordHighpass, "sine");
    const fifth = this.createVoice(
      ctx,
      1.5,
      0,
      0.041,
      this.chordHighpass,
      "triangle",
    );
    const octave = this.createVoice(
      ctx,
      2,
      0,
      0.053,
      this.chordHighpass,
      "sine",
    );
    this.thirdVoice = this.createVoice(
      ctx,
      1.25,
      0,
      0.035,
      this.chordHighpass,
      "sine",
    );
    this.ninthVoice = this.createVoice(
      ctx,
      2.25,
      0,
      0.047,
      this.chordHighpass,
      "sine",
    );
    this.voices = [root, fifth, octave, this.thirdVoice, this.ninthVoice];

    // —— Bass texture: atonal low rumble driven by temperature ——
    this.bodyNoiseFilter = ctx.createBiquadFilter();
    this.bodyNoiseFilter.type = "lowpass";
    this.bodyNoiseFilter.frequency.value = 90;
    this.bodyNoiseFilter.Q.value = 0.5;

    this.bodyNoiseGain = ctx.createGain();
    this.bodyNoiseGain.gain.value = 0.0001;

    const bodyNoise = ctx.createBufferSource();
    bodyNoise.buffer = createNoiseBuffer(ctx);
    bodyNoise.loop = true;
    // Bypass master highpass so the bass layer can sit under the clicks.
    bodyNoise
      .connect(this.bodyNoiseFilter)
      .connect(this.bodyNoiseGain)
      .connect(this.masterFilter);
    bodyNoise.start();
    this.bodyNoiseSource = bodyNoise;

    // —— Bass gong: soft attack, long bloom (not a continuous drone) ——
    this.bassFilter = ctx.createBiquadFilter();
    this.bassFilter.type = "lowpass";
    this.bassFilter.frequency.value = 220;
    this.bassFilter.Q.value = 0.7;

    this.bassGain = ctx.createGain();
    this.bassGain.gain.value = 0.0001;

    this.bassOsc = ctx.createOscillator();
    this.bassOsc.type = "sine";
    this.bassOsc.frequency.value = 55;

    this.bassOsc2 = ctx.createOscillator();
    this.bassOsc2.type = "sine";
    this.bassOsc2.frequency.value = 110;
    const bass2Gain = ctx.createGain();
    bass2Gain.gain.value = 0.22;

    // Soft fifth partial — slight gong bloom.
    this.bassOsc3 = ctx.createOscillator();
    this.bassOsc3.type = "sine";
    this.bassOsc3.frequency.value = 82.5;
    const bass3Gain = ctx.createGain();
    bass3Gain.gain.value = 0.12;

    const bassMix = ctx.createGain();
    bassMix.gain.value = 1;

    this.bassOsc.connect(bassMix);
    this.bassOsc2.connect(bass2Gain).connect(bassMix);
    this.bassOsc3.connect(bass3Gain).connect(bassMix);
    bassMix.connect(this.bassFilter).connect(this.bassGain);

    this.bassWetSend = ctx.createGain();
    this.bassWetSend.gain.value = 0.0001;
    this.bassConvolver = ctx.createConvolver();
    this.bassConvolver.buffer = createReverbImpulse(ctx, 14, 1.2);
    this.bassWetGain = ctx.createGain();
    this.bassWetGain.gain.value = 1.4;

    this.bassGain.connect(this.masterFilter);
    this.bassGain
      .connect(this.bassWetSend)
      .connect(this.bassConvolver)
      .connect(this.bassWetGain)
      .connect(this.userVolume!);

    this.bassOsc.start();
    this.bassOsc2.start();
    this.bassOsc3.start();
    this.bassGong = "wait";
    this.bassGongUntil = performance.now() + 4000 + Math.random() * 6000;
    this.bassGongLevel = 0;

    // —— Wind ——
    this.windFilter = ctx.createBiquadFilter();
    this.windFilter.type = "bandpass";
    this.windFilter.frequency.value = 520;
    this.windFilter.Q.value = 0.7;

    this.windGain = ctx.createGain();
    this.windGain.gain.value = 0;

    const noise = ctx.createBufferSource();
    noise.buffer = createNoiseBuffer(ctx);
    noise.loop = true;
    noise
      .connect(this.windFilter)
      .connect(this.windGain)
      .connect(this.masterHighpass);
    noise.start(0, 0.4);
    this.noiseSource = noise;

    // —— Mouse air ——
    this.mouseNoiseFilter = ctx.createBiquadFilter();
    this.mouseNoiseFilter.type = "highpass";
    this.mouseNoiseFilter.frequency.value = 3600;
    this.mouseNoiseFilter.Q.value = 0.35;

    this.mouseNoiseGain = ctx.createGain();
    this.mouseNoiseGain.gain.value = 0;

    const airNoise = ctx.createBufferSource();
    airNoise.buffer = createNoiseBuffer(ctx);
    airNoise.loop = true;
    airNoise
      .connect(this.mouseNoiseFilter)
      .connect(this.mouseNoiseGain)
      .connect(this.masterHighpass);
    airNoise.start(0, 0.9);
    this.mouseNoiseSource = airNoise;

    // —— Rain field (continuous texture) ——
    this.rainFilter = ctx.createBiquadFilter();
    this.rainFilter.type = "bandpass";
    this.rainFilter.frequency.value = 4200;
    this.rainFilter.Q.value = 0.55;

    this.rainGain = ctx.createGain();
    this.rainGain.gain.value = 0;

    const rainNoise = ctx.createBufferSource();
    rainNoise.buffer = createNoiseBuffer(ctx);
    rainNoise.loop = true;
    rainNoise
      .connect(this.rainFilter)
      .connect(this.rainGain)
      .connect(this.masterHighpass);
    rainNoise.start(0, 1.7);
    this.rainSource = rainNoise;

    // —— Background temperature pad (quiet, locked pitch, vaporous) ——
    this.howlBp = ctx.createBiquadFilter();
    this.howlBp.type = "lowpass";
    this.howlBp.frequency.value = 780;
    this.howlBp.Q.value = 0.35;

    // Keep delay node unused in path (no delay = no pitch smear).
    this.howlDelay = ctx.createDelay(0.08);
    this.howlDelay.delayTime.value = 0.001;
    this.howlFeedback = ctx.createGain();
    this.howlFeedback.gain.value = 0.0001;

    this.howlDrive = ctx.createGain();
    this.howlDrive.gain.value = 0.14;

    const chordMix = ctx.createGain();
    chordMix.gain.value = 1;

    this.howlOscs = this.howlVoicing.map((ratio, i) => {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = 130 * ratio;
      osc.detune.value = 0;
      const g = ctx.createGain();
      g.gain.value = i === 0 ? 0.55 : i === 1 ? 0.32 : 0.28;
      osc.connect(g).connect(chordMix);
      osc.start();
      return osc;
    });

    this.howlNoiseGain = ctx.createGain();
    this.howlNoiseGain.gain.value = 0.0001;

    const howlNoise = ctx.createBufferSource();
    howlNoise.buffer = createNoiseBuffer(ctx);
    howlNoise.loop = true;

    // Subtle bandpass texture (not pitched).
    const texBp = ctx.createBiquadFilter();
    texBp.type = "bandpass";
    texBp.frequency.value = 900;
    texBp.Q.value = 0.5;

    chordMix.connect(this.howlDrive).connect(this.howlBp);
    howlNoise.connect(this.howlNoiseGain).connect(texBp).connect(this.howlBp);

    this.howlDryGain = ctx.createGain();
    this.howlDryGain.gain.value = 0.0001;
    this.howlGain = ctx.createGain();
    this.howlGain.gain.value = 0.06;

    this.howlWetSend = ctx.createGain();
    this.howlWetSend.gain.value = 0.0001;
    this.howlConvolver = ctx.createConvolver();
    // Very long, soft vapor — pad hangs in the background.
    this.howlConvolver.buffer = createReverbImpulse(ctx, 7.5, 1.55);
    this.howlWetGain = ctx.createGain();
    this.howlWetGain.gain.value = 0.85;

    // Direct from filter — no delay in the path.
    this.howlBp.connect(this.howlDryGain).connect(this.howlGain).connect(this.userVolume!);
    this.howlBp
      .connect(this.howlWetSend)
      .connect(this.howlConvolver)
      .connect(this.howlWetGain)
      .connect(this.userVolume!);

    this.howlLfo = ctx.createOscillator();
    this.howlLfo.type = "sine";
    this.howlLfo.frequency.value = 0.03;
    this.howlLfoGain = ctx.createGain();
    this.howlLfoGain.gain.value = 0;
    this.howlLfo.connect(this.howlLfoGain);
    this.howlLfo.start();

    howlNoise.start(0, 2.1);
    this.howlNoiseSource = howlNoise;
    this.howlSwell = "wait";
    this.howlSwellUntil = performance.now() + 5000 + Math.random() * 8000;
    this.howlSwellLevel = 0;

    // —— Drop bus: dry click + delay texture (Alva Noto style) ——
    this.dropBus = ctx.createGain();
    this.dropBus.gain.value = 1;

    this.dropDry = ctx.createGain();
    this.dropDry.gain.value = 0.85;
    this.dropBus.connect(this.dropDry).connect(this.masterHighpass);

    this.dropDelay = ctx.createDelay(1.2);
    this.dropDelay.delayTime.value = 0.22;

    this.dropDelayFilter = ctx.createBiquadFilter();
    this.dropDelayFilter.type = "lowpass";
    this.dropDelayFilter.frequency.value = 6000;
    this.dropDelayFilter.Q.value = 0.4;

    this.dropDelayFeedback = ctx.createGain();
    this.dropDelayFeedback.gain.value = 0.42;

    this.dropDelayWet = ctx.createGain();
    this.dropDelayWet.gain.value = 0.55;

    this.dropBus.connect(this.dropDelay);
    this.dropDelay
      .connect(this.dropDelayFilter)
      .connect(this.dropDelayWet)
      .connect(this.masterHighpass);
    // Feedback loop (filtered so repeats stay clean, not noisy).
    this.dropDelayFilter.connect(this.dropDelayFeedback).connect(this.dropDelay);
    this.clickBuffers = [0, 1, 2, 3, 4, 5].map((v) => createClickBuffer(ctx, v));
    this.clickBuffer = this.clickBuffers[0] ?? createClickBuffer(ctx, 0);
    this.uiNoiseBuffer = createNoiseBuffer(ctx, 1.2);

    // —— Strike accumulate bed (fuzz + textured reverb that stacks) ——
    this.strikeIn = ctx.createGain();
    this.strikeIn.gain.value = 1;

    this.strikeShaper = ctx.createWaveShaper();
    this.strikeShaper.curve = createFuzzCurve(2.8);
    this.strikeShaper.oversample = "2x";

    this.strikeFilter = ctx.createBiquadFilter();
    this.strikeFilter.type = "bandpass";
    this.strikeFilter.frequency.value = 1800;
    this.strikeFilter.Q.value = 0.55;

    this.strikeVerb = ctx.createConvolver();
    // Longer, grainier impulse — textured tail.
    this.strikeVerb.buffer = createReverbImpulse(ctx, 9.5, 1.25);

    this.strikeFbDelay = ctx.createDelay(1.5);
    this.strikeFbDelay.delayTime.value = 0.38;

    this.strikeFbGain = ctx.createGain();
    this.strikeFbGain.gain.value = 0.48;

    this.strikeBedGain = ctx.createGain();
    this.strikeBedGain.gain.value = 0.0001;

    this.strikeIn
      .connect(this.strikeShaper)
      .connect(this.strikeFilter)
      .connect(this.strikeVerb);
    this.strikeVerb.connect(this.strikeBedGain).connect(this.userVolume!);
    // Feedback loop: each new strike recirculates previous grit.
    this.strikeVerb
      .connect(this.strikeFbDelay)
      .connect(this.strikeFbGain)
      .connect(this.strikeFilter);

    // Parallel click reverb — long hall, used as a wet send beside the dry tick.
    this.strikeClickVerb = ctx.createConvolver();
    this.strikeClickVerb.buffer = createReverbImpulse(ctx, 12, 1.15);
    this.strikeClickWet = ctx.createGain();
    this.strikeClickWet.gain.value = 1.8;
    this.strikeClickVerb.connect(this.strikeClickWet).connect(this.userVolume!);

    // —— UI interaction tones (independent of storm mute) ——
    this.uiBus = ctx.createGain();
    this.uiBus.gain.value = 0.85;

    this.uiConvolver = ctx.createConvolver();
    this.uiConvolver.buffer = createReverbImpulse(ctx, 5.5, 2.1);

    const uiDry = ctx.createGain();
    uiDry.gain.value = 0.28;
    const uiWet = ctx.createGain();
    uiWet.gain.value = 1.05;

    this.uiBus.connect(uiDry).connect(this.userVolume!);
    this.uiBus.connect(this.uiConvolver);
    this.uiConvolver.connect(uiWet).connect(this.userVolume!);
  }

  /** User volume 0…1. */
  getVolume() {
    return this.volumeValue;
  }

  setVolume(value: number) {
    this.volumeValue = clamp(value, 0, 1);
    if (this.userVolume && this.ctx) {
      setTarget(this.userVolume.gain, this.volumeValue, this.ctx, 0.05);
    }
  }

  /** Instantaneous output level 0…1 for the VU meter. */
  getLevel() {
    if (!this.analyser || !this.analyserBuffer || this.status !== "running") {
      return 0;
    }
    this.analyser.getFloatTimeDomainData(this.analyserBuffer);
    let sum = 0;
    for (let i = 0; i < this.analyserBuffer.length; i += 1) {
      const s = this.analyserBuffer[i]!;
      sum += s * s;
    }
    const rms = Math.sqrt(sum / this.analyserBuffer.length);
    // Perceptual dB scale: −54 dBFS → 0, −8 dBFS → 1. Keeps ambient
    // material visible mid-meter instead of pinned at the bottom.
    const db = 20 * Math.log10(Math.max(rms, 1e-6));
    return clamp((db + 54) / 46, 0, 1);
  }

  /**
   * Rain tick — ultra-short click with generative variety (rate, filter, pan, level).
   */
  private fireDrop(size01: number) {
    const ctx = this.ctx;
    const bus = this.dropBus;
    const buffers = this.clickBuffers.length ? this.clickBuffers : null;
    const buf =
      buffers?.[Math.floor(Math.random() * buffers.length)] ?? this.clickBuffer;
    if (!ctx || !bus || !buf || this.status !== "running") return;

    const now = ctx.currentTime;
    // Wide level variety — some almost whisper ticks.
    const peak = (0.28 + size01 * 0.45) * (0.45 + Math.random() * 0.9);

    const src = ctx.createBufferSource();
    src.buffer = buf;
    // Broad playback-rate spread = timbral variety without long body.
    src.playbackRate.value = 0.7 + Math.random() * 1.6;

    const hp = ctx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 900 + Math.random() * 3200;
    hp.Q.value = 0.1 + Math.random() * 0.35;

    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 3500 + Math.random() * 7000;
    lp.Q.value = 0.2 + Math.random() * 0.5;

    // Hard, tiny envelope — shorter than before.
    const dur = 0.002 + Math.random() * 0.003;
    const amp = ctx.createGain();
    amp.gain.setValueAtTime(peak, now);
    amp.gain.exponentialRampToValueAtTime(0.0001, now + dur);

    const pan = ctx.createStereoPanner();
    pan.pan.value = (Math.random() * 2 - 1) * (0.55 + Math.random() * 0.45);

    const dryTap = ctx.createGain();
    dryTap.gain.value = 0.75 + Math.random() * 0.5;
    const wetSend = ctx.createGain();
    wetSend.gain.value = 0.12 + Math.random() * 0.35;

    src.connect(hp).connect(lp).connect(amp).connect(pan);
    pan.connect(dryTap).connect(bus);
    if (this.convolver) {
      pan.connect(wetSend).connect(this.convolver);
    }

    src.start(now);
    src.stop(now + dur + 0.004);
    src.onended = () => {
      src.disconnect();
      hp.disconnect();
      lp.disconnect();
      amp.disconnect();
      pan.disconnect();
      dryTap.disconnect();
      wetSend.disconnect();
    };
  }

  /**
   * Click field while storm is live.
   * Light ≈ 3/s · heavy ≈ 8/s — timing also jittered for variety.
   */
  private scheduleDrops(nowMs: number) {
    if (!this.stormLive) return;

    const intensity = Math.max(this.waterIntensity, 1.5);
    const intervalMs = mapRange(intensity, 1.5, 12, 320, 120);
    const size01 = clamp(mapRange(intensity, 1.5, 12, 0.45, 1), 0, 1);

    while (nowMs >= this.nextDropAt) {
      this.fireDrop(size01 * (0.4 + Math.random() * 0.6));
      // Wider timing jitter so the field doesn't feel mechanical.
      this.nextDropAt += intervalMs * (0.35 + Math.random() * 1.1);
    }
  }

  /**
   * Strike: clean dry click + heavy parallel reverb send (both at once).
   */
  triggerStrike(strike: StrikeEvent) {
    if (!this.stormLive) return;
    const ctx = this.ctx;
    if (
      !ctx ||
      this.status !== "running" ||
      !this.clickBuffer ||
      !this.userVolume
    ) {
      return;
    }

    const now = ctx.currentTime;
    const closeness = clamp(1 - strike.distanceKm / 250, 0, 1);
    const peak = 1.55 + closeness * 0.45;

    const panVal = clamp(
      Math.sin((strike.bearingDeg * Math.PI) / 180) * 0.9,
      -1,
      1,
    );

    // —— Body click: short impulse with low-mid weight (not a noise crackle) ——
    const src = ctx.createBufferSource();
    src.buffer = this.clickBuffer;
    src.playbackRate.value = 0.55 + closeness * 0.12; // slower = thicker body

    const hp = ctx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 180 + closeness * 120; // keep body / punch
    hp.Q.value = 0.3;

    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 4200 + closeness * 800;
    lp.Q.value = 0.45;

    // Soft low shelf boost for “cuerpo”
    const body = ctx.createBiquadFilter();
    body.type = "lowshelf";
    body.frequency.value = 280;
    body.gain.value = 6 + closeness * 3;

    const amp = ctx.createGain();
    amp.gain.setValueAtTime(0.0001, now);
    amp.gain.linearRampToValueAtTime(peak, now + 0.0015);
    amp.gain.exponentialRampToValueAtTime(0.0001, now + 0.055);

    const pan = ctx.createStereoPanner();
    pan.pan.value = panVal;

    // Dry = señal limpia. Wet send = mucho reverb en paralelo.
    const dry = ctx.createGain();
    dry.gain.value = 1.25 + closeness * 0.25;
    const verbSend = ctx.createGain();
    verbSend.gain.value = 2.0 + closeness * 0.7;

    src.connect(hp).connect(body).connect(lp).connect(amp).connect(pan);
    pan.connect(dry).connect(this.userVolume);
    if (this.strikeClickVerb) {
      pan.connect(verbSend).connect(this.strikeClickVerb);
    }

    // Light accumulate bed (texture after the hit).
    if (this.strikeIn) {
      const toBed = ctx.createGain();
      toBed.gain.value = 0.35 + closeness * 0.15;
      pan.connect(toBed).connect(this.strikeIn);
      src.onended = () => {
        src.disconnect();
        hp.disconnect();
        body.disconnect();
        lp.disconnect();
        amp.disconnect();
        pan.disconnect();
        dry.disconnect();
        verbSend.disconnect();
        toBed.disconnect();
      };
    } else {
      src.onended = () => {
        src.disconnect();
        hp.disconnect();
        body.disconnect();
        lp.disconnect();
        amp.disconnect();
        pan.disconnect();
        dry.disconnect();
        verbSend.disconnect();
      };
    }

    src.start(now);
    src.stop(now + 0.07);

    this.strikeBedLevel = Math.min(1, this.strikeBedLevel + 0.14 + closeness * 0.1);
    if (this.strikeBedGain) {
      this.strikeBedGain.gain.setTargetAtTime(
        Math.max(0.03, this.strikeBedLevel * 0.3),
        now,
        0.08,
      );
    }

    if (this.bassGain && this.bassGong === "sound") {
      const level = this.bassGongLevel || this.bassLevel;
      this.bassGain.gain.setTargetAtTime(Math.max(0.0001, level * 0.4), now, 0.01);
      this.bassGain.gain.setTargetAtTime(Math.max(0.0001, level), now + 0.2, 0.2);
    }

    this.strikeGlowTarget = Math.min(
      1,
      this.strikeGlowTarget + 0.75 + closeness * 0.3,
    );
  }

  /**
   * Current harmony tonic for UI (pad lock if sounding, else temp-derived).
   */
  getHarmonyRootHz() {
    if (this.howlLockedRoot > 0 && this.howlPitchApplied) {
      return this.howlLockedRoot;
    }
    if (this.howlRootHz > 0) return this.howlRootHz;
    return clamp(this.lastBassFreq * 8, 160, 640);
  }

  /** Sync UI scale-degree from storm place / country. */
  setPlaceFromStorm(storm: StormSnapshot | null | undefined) {
    const key = placeKeyFromStorm({
      locationName: storm?.locationName,
      lat: storm?.center?.lat,
      lon: storm?.center?.lon,
    });
    if (key === this.placeKey) return;
    this.placeKey = key;
    this.placeDegree = placeDegreeIndex(key);
  }

  /**
   * UI pitch locked to current harmony.
   * tonic = project clicks; place = general; placeFifth = Work/About.
   */
  private uiHarmonyHz(role: "tonic" | "place" | "placeFifth" = "place") {
    const root = this.getHarmonyRootHz();
    let ratio = 1;
    if (role === "tonic") {
      ratio = 1;
    } else if (role === "placeFifth") {
      ratio = degreeRatio(this.placeDegree) * 1.5;
    } else {
      ratio = degreeRatio(this.placeDegree);
    }
    return clamp(root * ratio * 2, 280, 1400);
  }

  /**
   * Filter UI — atonal noise click into a vaporous reverb. No pitched tone.
   */
  triggerUiToneVapor() {
    const ctx = this.ctx;
    if (!ctx || this.status !== "running") return;
    if (!this.uiNoiseBuffer && !this.clickBuffer) return;

    if (ctx.state === "suspended") {
      void ctx.resume();
    }

    const now = ctx.currentTime;
    const dest = this.userVolume;
    if (!dest) return;

    // Dedicated long/soft impulse so the click dissolves into air.
    const vaporVerb = ctx.createConvolver();
    vaporVerb.buffer = createReverbImpulse(ctx, 7.2, 1.7);

    const dry = ctx.createGain();
    dry.gain.value = 0.22;
    const wet = ctx.createGain();
    wet.gain.value = 1.45;

    const mix = ctx.createGain();
    mix.gain.value = 1;
    mix.connect(dry).connect(dest);
    mix.connect(vaporVerb);
    vaporVerb.connect(wet).connect(dest);

    // Transient: short noise burst (and optional click sample).
    const noise = ctx.createBufferSource();
    noise.buffer = this.uiNoiseBuffer ?? this.clickBuffer!;
    noise.playbackRate.value = 1.8 + Math.random() * 1.4;

    const hp = ctx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 1600;
    hp.Q.value = 0.5;

    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 3200 + Math.random() * 2400;
    bp.Q.value = 0.45;

    const amp = ctx.createGain();
    amp.gain.setValueAtTime(0.0001, now);
    amp.gain.linearRampToValueAtTime(0.16, now + 0.003);
    amp.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);

    const pan = ctx.createStereoPanner();
    pan.pan.value = (Math.random() * 2 - 1) * 0.5;

    noise.connect(hp).connect(bp).connect(amp).connect(pan).connect(mix);
    noise.start(now);
    noise.stop(now + 0.14);

    if (this.clickBuffer) {
      const click = ctx.createBufferSource();
      click.buffer = this.clickBuffer;
      const cAmp = ctx.createGain();
      cAmp.gain.setValueAtTime(0.0001, now);
      cAmp.gain.linearRampToValueAtTime(0.2, now + 0.001);
      cAmp.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);
      click.connect(cAmp).connect(pan);
      click.start(now);
      click.stop(now + 0.05);
      click.onended = () => {
        click.disconnect();
        cAmp.disconnect();
      };
    }

    noise.onended = () => {
      noise.disconnect();
      hp.disconnect();
      bp.disconnect();
      amp.disconnect();
      pan.disconnect();
      // Keep verb graph a moment for the tail, then tear down.
      window.setTimeout(() => {
        try {
          mix.disconnect();
          dry.disconnect();
          wet.disconnect();
          vaporVerb.disconnect();
        } catch {
          // ignore
        }
      }, 8000);
    };
  }

  /**
   * Classic UI tone for Work / About —
   * bright, noisy, quieter (not bass-heavy).
   */
  triggerUiToneClassic() {
    const ctx = this.ctx;
    const bus = this.uiBus;
    if (!ctx || this.status !== "running" || !bus) return;

    if (ctx.state === "suspended") {
      void ctx.resume();
    }

    const now = ctx.currentTime;
    // Work / About: place degree + fifth — changes with storm country.
    const freq = this.uiHarmonyHz("placeFifth");
    const peak = 0.09;

    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = freq;

    const osc2 = ctx.createOscillator();
    osc2.type = "triangle";
    osc2.frequency.value = freq * 2.01;

    const filter = ctx.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.value = 500;
    filter.Q.value = 0.4;

    const amp = ctx.createGain();
    amp.gain.setValueAtTime(0.0001, now);
    amp.gain.linearRampToValueAtTime(peak, now + 0.006);
    amp.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);

    const pan = ctx.createStereoPanner();
    pan.pan.value = (Math.random() * 2 - 1) * 0.4;

    const mix = ctx.createGain();
    mix.gain.value = 1;
    const mix2 = ctx.createGain();
    mix2.gain.value = 0.22;

    osc.connect(mix);
    osc2.connect(mix2).connect(mix);
    mix.connect(filter).connect(amp).connect(pan).connect(bus);

    osc.start(now);
    osc2.start(now);
    osc.stop(now + 0.35);
    osc2.stop(now + 0.35);
    osc.onended = () => {
      osc.disconnect();
      osc2.disconnect();
      mix.disconnect();
      mix2.disconnect();
      filter.disconnect();
      amp.disconnect();
      pan.disconnect();
    };

    // Noisy air around the beep.
    if (this.uiNoiseBuffer) {
      const noise = ctx.createBufferSource();
      noise.buffer = this.uiNoiseBuffer;
      noise.playbackRate.value = 1.2 + Math.random() * 0.4;

      const nHp = ctx.createBiquadFilter();
      nHp.type = "highpass";
      nHp.frequency.value = 1800;
      nHp.Q.value = 0.5;

      const nBp = ctx.createBiquadFilter();
      nBp.type = "bandpass";
      nBp.frequency.value = freq * 1.6;
      nBp.Q.value = 1.2;

      const nAmp = ctx.createGain();
      nAmp.gain.setValueAtTime(0.0001, now);
      nAmp.gain.linearRampToValueAtTime(0.05, now + 0.01);
      nAmp.gain.exponentialRampToValueAtTime(0.0001, now + 0.32);

      const nPan = ctx.createStereoPanner();
      nPan.pan.value = pan.pan.value * -0.6;

      noise.connect(nHp).connect(nBp).connect(nAmp).connect(nPan).connect(bus);
      noise.start(now);
      noise.stop(now + 0.4);
      noise.onended = () => {
        noise.disconnect();
        nHp.disconnect();
        nBp.disconnect();
        nAmp.disconnect();
        nPan.disconnect();
      };
    }
  }

  /**
   * Project open — tonic of the current background harmony (most resolved).
   */
  triggerUiToneTonic() {
    const ctx = this.ctx;
    const bus = this.uiBus;
    if (!ctx || this.status !== "running" || !bus) return;

    if (ctx.state === "suspended") {
      void ctx.resume();
    }

    const now = ctx.currentTime;
    const freq = this.uiHarmonyHz("tonic");
    const peak = 0.11;

    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = freq;

    const osc2 = ctx.createOscillator();
    osc2.type = "sine";
    osc2.frequency.value = freq * 2;
    const mix2 = ctx.createGain();
    mix2.gain.value = 0.28;

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = freq * 4;
    filter.Q.value = 0.4;

    const amp = ctx.createGain();
    amp.gain.setValueAtTime(0.0001, now);
    amp.gain.linearRampToValueAtTime(peak, now + 0.008);
    amp.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);

    const pan = ctx.createStereoPanner();
    pan.pan.value = 0;

    const mix = ctx.createGain();
    mix.gain.value = 1;
    osc.connect(mix);
    osc2.connect(mix2).connect(mix);
    mix.connect(filter).connect(amp).connect(pan).connect(bus);

    osc.start(now);
    osc2.start(now);
    osc.stop(now + 0.55);
    osc2.stop(now + 0.55);
    osc.onended = () => {
      osc.disconnect();
      osc2.disconnect();
      mix.disconnect();
      mix2.disconnect();
      filter.disconnect();
      amp.disconnect();
      pan.disconnect();
    };
  }

  /**
   * Default UI tone — scale degree from storm country, over current tonic.
   */
  triggerUiTone() {
    const ctx = this.ctx;
    const bus = this.uiBus;
    if (!ctx || this.status !== "running" || !bus) return;

    if (ctx.state === "suspended") {
      void ctx.resume();
    }

    const now = ctx.currentTime;
    const freq = this.uiHarmonyHz("place");

    // One sine only — clearly tonal.
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = freq;

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(freq * 3, now);
    filter.frequency.exponentialRampToValueAtTime(freq * 1.4, now + 0.8);
    filter.Q.value = 0.5;

    // Single envelope: tiny peak (click) → quiet sustain (interference) → fade.
    const amp = ctx.createGain();
    amp.gain.setValueAtTime(0.0001, now);
    amp.gain.linearRampToValueAtTime(0.07, now + 0.003); // soft click peak
    amp.gain.exponentialRampToValueAtTime(0.018, now + 0.05); // settle to bed
    amp.gain.setTargetAtTime(0.0001, now + 0.15, 0.35); // dissolve into background

    const pan = ctx.createStereoPanner();
    pan.pan.value = (Math.random() * 2 - 1) * 0.35;

    osc.connect(filter).connect(amp).connect(pan).connect(bus);

    // Quiet bleed into storm texture as interference (not a second hit).
    if (this.stormLive && this.masterFilter) {
      const bed = ctx.createGain();
      bed.gain.value = 0.12;
      amp.connect(bed).connect(this.masterFilter);
    }

    osc.start(now);
    osc.stop(now + 1.6);
    osc.onended = () => {
      osc.disconnect();
      filter.disconnect();
      amp.disconnect();
      pan.disconnect();
    };
  }

  update(
    weather: WeatherSnapshot,
    astro: AstroSnapshot,
    mouse: MouseSnapshot,
    storm?: StormSnapshot,
  ) {
    const ctx = this.ctx;
    if (!ctx || this.status !== "running" || !this.masterFilter) return;

    // No storm locked yet → silence atmosphere, but keep bass pitch for UI tones.
    this.stormLive = Boolean(storm?.active && storm.center);
    this.lastBassFreq = mapRange(weather.temperatureC, -5, 38, 40, 90);
    this.setPlaceFromStorm(storm);
    if (!this.stormLive) {
      this.waterIntensity = 0;
      if (this.bodyNoiseGain) setTarget(this.bodyNoiseGain.gain, 0, ctx, 0.3);
      if (this.bassGain) setTarget(this.bassGain.gain, 0.0001, ctx, 0.3);
      if (this.bassWetSend) setTarget(this.bassWetSend.gain, 0.0001, ctx, 0.35);
      if (this.windGain) setTarget(this.windGain.gain, 0, ctx, 0.3);
      if (this.mouseNoiseGain) setTarget(this.mouseNoiseGain.gain, 0, ctx, 0.3);
      if (this.dropDelayWet) setTarget(this.dropDelayWet.gain, 0, ctx, 0.3);
      if (this.dropDry) setTarget(this.dropDry.gain, 0, ctx, 0.3);
      if (this.howlGain) setTarget(this.howlGain.gain, 0.0001, ctx, 0.35);
      if (this.howlDryGain) setTarget(this.howlDryGain.gain, 0.0001, ctx, 0.35);
      if (this.howlWetSend) setTarget(this.howlWetSend.gain, 0.0001, ctx, 0.45);
      this.strikeBedLevel = 0;
      if (this.strikeBedGain) setTarget(this.strikeBedGain.gain, 0.0001, ctx, 0.4);
      if (this.masterGain) setTarget(this.masterGain.gain, 0.0001, ctx, 0.4);
      return;
    }

    if (this.masterGain) setTarget(this.masterGain.gain, 1.5, ctx, 0.8);

    // Water intensity: Open-Meteo precip (mm of the preceding hour ≈ mm/h)
    // plus convective density from strike rate when the grid reports dry.
    const precip = Math.max(0, weather.precipitationMm);
    const humidityBoost =
      weather.humidityPct > 70
        ? mapRange(weather.humidityPct, 70, 100, 0, 1.2)
        : 0;
    const strikeDensity = mapRange(storm?.strikesPerMin ?? 0, 0, 180, 0, 5);
    this.waterIntensity = precip + humidityBoost * 0.35 + strikeDensity * 0.55;

    // Delay field = the texture. Storm params shape time / feedback / wet.
    if (this.dropDelay && this.dropDelayFeedback && this.dropDelayWet && this.dropDry) {
      // More water → slightly shorter, denser echoes; pressure shifts time.
      const baseDelay = mapRange(this.waterIntensity, 0.5, 12, 0.32, 0.11);
      const pressureShift =
        weather.pressureHpa < 1005
          ? 0.04
          : weather.pressureHpa > 1020
            ? -0.025
            : 0;
      setTarget(
        this.dropDelay.delayTime,
        clamp(baseDelay + pressureShift, 0.08, 0.55),
        ctx,
        0.8,
      );

      // Humidity + intensity → longer trails; strike opens feedback briefly.
      const feedback = clamp(
        mapRange(weather.humidityPct, 30, 95, 0.22, 0.42) +
          mapRange(this.waterIntensity, 0.5, 12, 0, 0.08) +
          this.strikeGlow * 0.12,
        0.12,
        0.48,
      );
      setTarget(this.dropDelayFeedback.gain, feedback, ctx, 0.6);

      const delayWet = clamp(
        mapRange(this.waterIntensity, 0.5, 12, 0.28, 0.5) + this.strikeGlow * 0.1,
        0.2,
        0.6,
      );
      setTarget(this.dropDelayWet.gain, delayWet, ctx, 0.5);
      setTarget(this.dropDry.gain, 1, ctx, 0.5);

      if (this.dropDelayFilter) {
        setTarget(
          this.dropDelayFilter.frequency,
          mapRange(this.waterIntensity, 0.5, 12, 7500, 4200),
          ctx,
          0.7,
        );
      }
    }

    // Temperature → fundamental (slightly higher range = less sub boom).
    const fundamental = mapRange(weather.temperatureC, -5, 38, 90, 210);
    this.lastFundamental = fundamental;

    const pressureCents =
      weather.pressureHpa < 1005 ? -5 : weather.pressureHpa > 1020 ? 4 : 0;

    const humidity01 = clamp(mapRange(weather.humidityPct, 20, 95, 0, 1), 0, 1);
    if (this.thirdVoice) {
      this.thirdVoice.ratio = 1.25 - humidity01 * 0.05;
      // Muted while designing events.
      setTarget(this.thirdVoice.gain.gain, 0, ctx, GAIN_SMOOTH);
    }

    if (this.ninthVoice) {
      setTarget(this.ninthVoice.gain.gain, 0, ctx, GAIN_SMOOTH);
    }

    const velocity01 = clamp(mouse.velocity / 1500, 0, 1);
    const detuneSpread = 5 + velocity01 * 10;

    for (const voice of this.voices) {
      for (const { osc, baseDetune } of voice.oscs) {
        setTarget(osc.frequency, fundamental * voice.ratio, ctx, SMOOTH);
        setTarget(
          osc.detune,
          Math.sign(baseDetune) * detuneSpread + pressureCents,
          ctx,
          0.8,
        );
      }
      setTarget(
        voice.lfo.frequency,
        voice.lfoRateHz * (1 + velocity01 * 1.2),
        ctx,
        1.2,
      );
    }

    // Chord filter stays mid-open; humidity darkens a little.
    const humidityCutoff = mapRange(weather.humidityPct, 20, 95, 2200, 900);
    const mouseOpenness = mapRange(mouse.ny, 0, 1, 1.25, 0.8);
    const chordCutoff =
      humidityCutoff * mouseOpenness * (1 + velocity01 * 0.25) *
      (1 + this.strikeGlow * 0.35);
    if (this.chordFilter) {
      setTarget(this.chordFilter.frequency, chordCutoff, ctx, FILTER_SMOOTH);
      setTarget(this.chordFilter.Q, 0.5 + velocity01 * 0.7, ctx, FILTER_SMOOTH);
    }

    // Bass texture ← temperature (cold = deeper, warm = higher rumble).
    if (this.bodyNoiseFilter && this.bodyNoiseGain) {
      const bassHz = mapRange(weather.temperatureC, -5, 38, 42, 100);
      setTarget(this.bodyNoiseFilter.frequency, bassHz, ctx, FILTER_SMOOTH);
      setTarget(this.bodyNoiseFilter.Q, 0.35 + humidity01 * 0.15, ctx, FILTER_SMOOTH);
      // Level driven by gong envelope in tickBassGong — don't force continuous rumble.
    }

    // Temperature → gong root; appearance gap from storm/weather data.
    const rain01 = clamp(mapRange(this.waterIntensity, 0, 10, 0, 1), 0, 1);
    this.lastBassFreq = mapRange(weather.temperatureC, -5, 38, 40, 90);
    this.bassLevel = 0.055 + rain01 * 0.02;

    // Generative wait between gongs (ms): calmer weather → rarer; wet/active → denser.
    const pressureStretch =
      weather.pressureHpa > 1020 ? 1.25 : weather.pressureHpa < 1005 ? 0.8 : 1;
    const activity = clamp(rain01 * 0.55 + mapRange(storm?.strikesPerMin ?? 0, 0, 120, 0, 0.45), 0, 1);
    const humidityStretch = mapRange(weather.humidityPct, 30, 95, 1.15, 0.85);
    this.bassGongGapMs = clamp(
      16_000 * pressureStretch * humidityStretch * (1.35 - activity * 0.7),
      8_000,
      42_000,
    );

    if (this.bassFilter) {
      setTarget(
        this.bassFilter.frequency,
        140 + rain01 * 80 + this.strikeGlow * 50,
        ctx,
        FILTER_SMOOTH,
      );
    }
    // Don't overwrite bassGain here — tickBassGong owns the envelope.

    // Wind — continuous air texture from storm wind speed / gusts.
    const windHz = mapRange(weather.windSpeedMs, 0, 18, 320, 1800);
    const windQ = mapRange(weather.windSpeedMs, 0, 18, 0.55, 1.6);
    const baseWindGain = mapRange(weather.windSpeedMs, 0, 16, 0.012, 0.07);
    const gustFactor = clamp(
      weather.windGustMs / Math.max(weather.windSpeedMs, 0.5),
      1,
      3,
    );
    const windGain = baseWindGain * (1 + (gustFactor - 1) * 0.5);

    if (this.windFilter) {
      setTarget(this.windFilter.frequency, windHz, ctx, FILTER_SMOOTH);
      setTarget(this.windFilter.Q, windQ, ctx, FILTER_SMOOTH);
    }
    if (this.windGain) {
      setTarget(this.windGain.gain, windGain, ctx, 0.55);
    }

    if (this.rainGain) {
      setTarget(this.rainGain.gain, 0, ctx, 0.7);
    }
    if (this.rainFilter) {
      const rainHz = mapRange(weather.precipitationMm, 0, 10, 5200, 2800);
      setTarget(this.rainFilter.frequency, rainHz, ctx, 0.7);
    }

    // Background pad — pitch locked per gesture (no glide / no delay feedback).
    if (
      this.howlOscs.length &&
      this.howlBp &&
      this.howlGain &&
      this.howlLfoGain &&
      this.howlNoiseGain
    ) {
      const bass = Math.max(
        40,
        this.lastBassFreq || mapRange(weather.temperatureC, -5, 38, 40, 90),
      );
      const root = clamp(bass * Math.pow(2, this.howlOctave), 90, 240);
      this.howlRootHz = root;

      // Apply pitch once at gesture start — never setTarget every frame.
      if (this.howlSwell === "sound" && !this.howlPitchApplied) {
        this.howlLockedRoot = root;
        this.howlPitchApplied = true;
        const nowT = ctx.currentTime;
        this.howlOscs.forEach((osc, i) => {
          const ratio = this.howlVoicing[i] ?? 1;
          const hz = this.howlLockedRoot * ratio;
          osc.frequency.cancelScheduledValues(nowT);
          osc.frequency.setValueAtTime(hz, nowT);
        });
      }

      setTarget(this.howlBp.frequency, 620 + humidity01 * 220, ctx, 1.2);
      setTarget(this.howlBp.Q, 0.35, ctx, 1.0);
      if (this.howlFeedback) setTarget(this.howlFeedback.gain, 0.0001, ctx, 0.5);

      setTarget(this.howlGain.gain, 0.05 + rain01 * 0.015, ctx, 1.0);
      // Soft noise texture only while the pad is sounding.
      const tex =
        this.howlSwell === "sound" || this.howlSwell === "tail"
          ? 0.006 + rain01 * 0.006
          : 0.0001;
      setTarget(this.howlNoiseGain.gain, tex, ctx, 0.8);
      if (this.howlDrive) {
        setTarget(this.howlDrive.gain, 0.12 + rain01 * 0.02, ctx, 1.0);
      }
      setTarget(this.howlLfoGain.gain, 0, ctx, 0.5);
    }

    // Master brightness: open air + mouse + strike flash.
    const baseCutoff = mapRange(astro.sunElevationDeg, -18, 60, 2800, 5200);
    const velocityLift = mapRange(clamp(mouse.velocity, 0, 1600), 0, 1600, 0, 900);
    const strikeOpen = this.strikeGlow * 2800;
    setTarget(
      this.masterFilter.frequency,
      baseCutoff + velocityLift + strikeOpen,
      ctx,
      0.35,
    );

    // Mouse air — quiet high hiss that follows movement.
    if (this.mouseNoiseGain && this.mouseNoiseFilter) {
      const airGain = mapRange(
        clamp(mouse.velocity, 0, 1800),
        0,
        1800,
        0.0001,
        0.04,
      );
      setTarget(this.mouseNoiseGain.gain, airGain, ctx, 0.25);
      setTarget(
        this.mouseNoiseFilter.frequency,
        mapRange(clamp(mouse.velocity, 0, 1800), 0, 1800, 4200, 2800),
        ctx,
        0.35,
      );
    }

    const windPan = mapRange(weather.windDirectionDeg, 0, 360, -0.55, 0.55);
    const mousePan = Math.sin(mouse.direction) * 0.28;
    const pan = clamp(windPan * 0.7 + mousePan * 0.3, -1, 1);
    if (this.panner) {
      setTarget(this.panner.pan, pan, ctx, 0.5);
    }

    // Reverb carries the click field.
    if (this.wetGain) {
      setTarget(
        this.wetGain.gain,
        0.5 + this.strikeGlow * 0.2,
        ctx,
        0.6,
      );
    }
  }
}
