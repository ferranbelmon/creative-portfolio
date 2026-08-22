import * as THREE from "three";

/** Edita aquí — un solo sitio para todos los knobs del hero. */
export const heroTuning = {
  /** Suavizado del ratón → luz (0–1). */
  lightSmooth: 0.2,
  /** Cuánto se mueve la luz con el ratón (0–1). */
  mouseInfluence: 0.3,

  /** Oclusión → blur del halo (px). */
  occlusionBlurRadius: 12,
  /** Intensidad del anillo emisivo en bordes. */
  haloGain: 2.2,
  /** Silueta oclusor en el ring (0–1). */
  haloOccCutoff: 0.96,
  /** Falloff del anillo (>1 = más suave). */
  haloPow: 0.92,

  /** Separación RGB al final del rayo (px). */
  chromaticShiftPx: 12,
  /** Separación RGB en el origen de luz (px). */
  chromaticOriginPx: 2,
  /** Brillo global de god rays. */
  godraysExposure: 2.25,
  /** Atenuación por paso del march (0.95–0.99). */
  godraysDecay: 0.97,
  /** Curva de contraste post-march (>1 = más apagado). */
  godraysFalloffPow: 0.94,
  /** Multiplicador R/G/B del haz. */
  godraysRgbGain: [1.12, 1.10, 1.12] as [number, number, number],

  /** Bloom: umbral extract (0–1). */
  bloomThreshold: 0.08,
  bloomSoftness: 0.72,
  bloomStrength: 2.55,
  bloomBlurRadius: 2.2,
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

export function applyHeroTuning(
  uniforms: HeroUniformGroups,
  width: number,
  height: number,
) {
  const t = heroTuning;
  const uvScale = 1 / Math.max(1, Math.min(width, height));

  uniforms.occlusionBlur.uBlurRadius.value = t.occlusionBlurRadius;
  uniforms.emissiveHalo.uHaloGain.value = t.haloGain;
  uniforms.emissiveHalo.uOccCutoff.value = t.haloOccCutoff;
  uniforms.emissiveHalo.uHaloPow.value = t.haloPow;

  uniforms.godrays.uChromaticShift.value = t.chromaticShiftPx * uvScale;
  uniforms.godrays.uChromaticOrigin.value = t.chromaticOriginPx * uvScale;
  uniforms.godrays.uExposure.value = t.godraysExposure;
  uniforms.godrays.uDecay.value = t.godraysDecay;
  uniforms.godrays.uFalloffPow.value = t.godraysFalloffPow;
  uniforms.godrays.uRgbGain.value.set(
    t.godraysRgbGain[0],
    t.godraysRgbGain[1],
    t.godraysRgbGain[2],
  );

  uniforms.bloomExtract.uThreshold.value = t.bloomThreshold;
  uniforms.bloomExtract.uSoftness.value = t.bloomSoftness;
  uniforms.bloomBlur.uBlurRadius.value = t.bloomBlurRadius;
  uniforms.bloomComposite.uBloomStrength.value = t.bloomStrength;
}
