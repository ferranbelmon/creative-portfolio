// GLSL TOP — Ambiente: polvo · posterizado · vapor · ruido
//
// Inputs:
//   sTD2DInputs[0] = imagen base
//   sTD2DInputs[1] = mapa gris (R modula intensidad por zona, 0 = sin efecto)
//
// Uniforms:
//   uStrength    — intensidad global (0–1)
//   uLevels      — niveles de posterización (3–16)
//   uBlur        — blur vaporoso en píxeles (0–40)
//   uDistort     — deformación del espacio (0–0.04)
//   uDust        — densidad de motas de polvo (0–0.4)
//   uGrain       — grano fino (0–0.12)
//   uHaze        — velo vaporoso sobre sombras (0–0.5)
//   uNoiseScale  — escala del ruido orgánico (2–10)
//   uContrast    — contraste post-posterize (0.8–1.4)
//   uSamples     — muestras blur (4–12)
//   uTime        — absTime.seconds
//   uSpeed       — velocidad animación

uniform float uStrength;
uniform float uLevels;
uniform float uBlur;
uniform float uDistort;
uniform float uDust;
uniform float uGrain;
uniform float uHaze;
uniform float uNoiseScale;
uniform float uContrast;
uniform float uSamples;
uniform float uTime;
uniform float uSpeed;

out vec4 fragColor;

const int MAX_SAMPLES = 12;
const float GOLDEN = 2.399963;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float hash3(vec3 p) {
  return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
    f.y
  );
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 3; i++) {
    v += a * noise(p);
    p *= 2.2;
    a *= 0.5;
  }
  return v;
}

vec2 warp(vec2 uv, float amount, float scale, float time) {
  vec2 p = uv * scale + vec2(time * 0.11, -time * 0.09);
  return uv + vec2(fbm(p), fbm(p + 3.1)) * amount * 2.0 - amount;
}

vec3 posterize(vec3 c, float levels) {
  float l = max(levels, 2.0);
  return floor(c * l + 0.0001) / (l - 1.0);
}

vec3 softBlur(vec2 uv, vec2 res, vec2 warped, float radiusPx, int samples, float time) {
  vec4 acc = vec4(0.0);
  float wsum = 0.0;

  for (int i = 0; i < MAX_SAMPLES; i++) {
    if (i >= samples) break;
    float fi = float(i);
    float rnd = hash(uv * res + fi * 13.1 + time);
    float ang = GOLDEN * fi + rnd * 6.283185;
    float rad = radiusPx * (0.4 + rnd * 0.6) / max(res.x, res.y);
    vec2 off = vec2(cos(ang), sin(ang)) * rad;
    float w = 1.0 - fi / float(samples);
    acc += texture(sTD2DInputs[0], warped + off) * w;
    wsum += w;
  }

  return wsum > 0.0 ? acc.rgb / wsum : texture(sTD2DInputs[0], uv).rgb;
}

void main() {
  vec2 uv = vUV.st;
  vec2 res = uTD2DInfos[0].res.zw;
  float time = uTime * uSpeed;

  vec3 original = texture(sTD2DInputs[0], uv).rgb;
  float modMap = texture(sTD2DInputs[1], uv).r;
  float fx = clamp(modMap * uStrength, 0.0, 1.0);

  if (fx < 0.001) {
    fragColor = TDOutputSwizzle(vec4(original, 1.0));
    return;
  }

  int samples = int(clamp(uSamples, 2.0, float(MAX_SAMPLES)));
  float scale = max(uNoiseScale, 0.5);

  vec2 warped = warp(uv, uDistort * fx, scale, time);
  vec3 col = softBlur(uv, res, warped, uBlur * fx, samples, time);

  col = posterize(col, mix(256.0, uLevels, fx));
  col = pow(col, vec3(uContrast));

  float lum = dot(col, vec3(0.299, 0.587, 0.114));
  float mist = fbm(uv * scale * 1.7 + time * 0.05);
  col = mix(col, vec3(lum) + mist * 0.08, uHaze * fx);

  float dustFine = hash3(vec3(uv * res * 1.3, time * 0.3));
  float dustCoarse = fbm(uv * res * 0.04 + time * 0.02);
  float speckle = smoothstep(0.92 - uDust * fx, 1.0, dustFine);
  float dustVeil = dustCoarse * uDust * fx * 0.35;
  col += speckle * 0.25 * fx;
  col -= dustVeil * 0.15;
  col = mix(col, col * (0.85 + dustCoarse * 0.3), uDust * fx * 0.5);

  float grain = (hash(uv * res * 3.7 + time * 31.0) - 0.5) * uGrain * fx;
  col += grain;

  col = clamp(col, 0.0, 1.0);
  vec3 result = mix(original, col, fx);

  fragColor = TDOutputSwizzle(vec4(result, 1.0));
}
