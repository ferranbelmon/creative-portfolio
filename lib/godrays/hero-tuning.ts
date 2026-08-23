import * as THREE from "three";

export type HeroTheme = "dark" | "light";

/** Knobs visuales del look (un bloque por tema). */
export type HeroLookTuning = {
  /** Oclusión → blur del halo (px). */
  occlusionBlurRadius: number;
  /** Intensidad del anillo emisivo en bordes. */
  haloGain: number;
  /** Silueta oclusor en el ring (0–1). */
  haloOccCutoff: number;
  /** Falloff del anillo (>1 = más suave). */
  haloPow: number;

  /** Separación RGB al final del rayo (px). */
  chromaticShiftPx: number;
  /** Separación RGB en el origen de luz (px). */
  chromaticOriginPx: number;
  /** Brillo global de god rays. */
  godraysExposure: number;
  /** Atenuación por paso del march (0.95–0.99). */
  godraysDecay: number;
  /** Curva de contraste post-march (>1 = más apagado). */
  godraysFalloffPow: number;
  /** Multiplicador R/G/B del haz. */
  godraysRgbGain: [number, number, number];

  /** Bloom: umbral extract (0–1). */
  bloomThreshold: number;
  bloomSoftness: number;
  bloomStrength: number;
  bloomBlurRadius: number;
};

/** Edita aquí — knobs compartidos + look día / noche. */
export const heroTuning = {
  /** Suavizado del ratón → luz (0–1). */
  lightSmooth: 0.2,
  /** Cuánto se mueve la luz con el ratón (0–1). */
  mouseInfluence: 0.3,
  /** Click: kick outward strength (idle float always runs). */
  burstStrength: 7.5,

  /** Modo noche. */
  dark: {
    occlusionBlurRadius: 9,
    haloGain: 2.0,
    haloOccCutoff: 0.98,
    haloPow: 0.99,

    chromaticShiftPx: 7,
    chromaticOriginPx: 1,
    godraysExposure: 2.95,
    godraysDecay: 1.002,
    godraysFalloffPow: 0.93,
    godraysRgbGain: [1.12, 1.1, 1.18],

    bloomThreshold: 0.08,
    bloomSoftness: 0.72,
    bloomStrength: 2.55,
    bloomBlurRadius: 2.2,
  } satisfies HeroLookTuning,

  /** Modo día. */
  light: {
    occlusionBlurRadius: 9,
    haloGain: 1.7,
    haloOccCutoff: 0.98,
    haloPow: 0.99,

    chromaticShiftPx: 10,
    chromaticOriginPx: 3,
    godraysExposure: 2.95,
    godraysDecay: 0.965,
    godraysFalloffPow: 0.85,
    godraysRgbGain: [1.12, 1.1, 1.18],

    bloomThreshold: 0.08,
    bloomSoftness: 0.72,
    bloomStrength: 2.15,
    bloomBlurRadius: 2.2,
  } satisfies HeroLookTuning,
};

export type HeroUniformGroups = {
  occlusionBlur: {
    uBlurRadius: { value: number };
  };
  emissiveHalo: {
    uHaloGain: { value: number };
    uOccCutoff: { value: number };
    uHaloPow: { value: number };
  };
  godrays: {
    uChromaticOrigin: { value: number };
    uChromaticShift: { value: number };
    uExposure: { value: number };
    uDecay: { value: number };
    uFalloffPow: { value: number };
    uRgbGain: { value: THREE.Vector3 };
  };
  bloomExtract: {
    uThreshold: { value: number };
    uSoftness: { value: number };
  };
  bloomBlur: {
    uBlurRadius: { value: number };
  };
  bloomComposite: {
    uBloomStrength: { value: number };
  };
};

export function resolveHeroTheme(): HeroTheme {
  return document.documentElement.classList.contains("light")
    ? "light"
    : "dark";
}

/** Escala visual de referencia (CSS px). Los knobs en "px" se interpretan respecto a esto. */
const LOOK_REF_MIN = 1080;

export function applyHeroTuning(
  uniforms: HeroUniformGroups,
  width: number,
  height: number,
  theme: HeroTheme = "dark",
) {
  const look = theme === "light" ? heroTuning.light : heroTuning.dark;
  const minDim = Math.max(1, Math.min(width, height));
  // Misma apariencia en móvil y desktop: px del tuning ≈ px a LOOK_REF_MIN.
  const pxScale = minDim / LOOK_REF_MIN;

  uniforms.occlusionBlur.uBlurRadius.value =
    look.occlusionBlurRadius * pxScale;
  uniforms.emissiveHalo.uHaloGain.value = look.haloGain;
  uniforms.emissiveHalo.uOccCutoff.value = look.haloOccCutoff;
  uniforms.emissiveHalo.uHaloPow.value = look.haloPow;

  // Cromática en UV (antes: px/minDim → más agresivo en pantallas pequeñas).
  uniforms.godrays.uChromaticShift.value =
    look.chromaticShiftPx / LOOK_REF_MIN;
  uniforms.godrays.uChromaticOrigin.value =
    look.chromaticOriginPx / LOOK_REF_MIN;
  uniforms.godrays.uExposure.value = look.godraysExposure;
  uniforms.godrays.uDecay.value = look.godraysDecay;
  uniforms.godrays.uFalloffPow.value = look.godraysFalloffPow;
  uniforms.godrays.uRgbGain.value.set(
    look.godraysRgbGain[0],
    look.godraysRgbGain[1],
    look.godraysRgbGain[2],
  );

  uniforms.bloomExtract.uThreshold.value = look.bloomThreshold;
  uniforms.bloomExtract.uSoftness.value = look.bloomSoftness;
  uniforms.bloomBlur.uBlurRadius.value = look.bloomBlurRadius * pxScale;
  uniforms.bloomComposite.uBloomStrength.value = look.bloomStrength;
}
