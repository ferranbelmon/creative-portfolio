// GLSL TOP — Vapor / textura ruidosa (distorsión + blur estocástico)
//
// Inputs:
//   sTD2DInputs[0] = imagen base
//   sTD2DInputs[1] = mapa gris — modula intensidad, velocidad y escala del ruido por zona
//
// Uniforms:
//   uDistort    — distorsión orgánica (0–0.08)
//   uBlur       — radio scatter blur en píxeles (10–60)
//   uNoiseScale — escala base del ruido (2–12)
//   uSamples    — muestras de blur (6–16)
//   uStrength   — intensidad global (0–1)
//   uGrain      — grano fino (0–0.15)
//   uTime       — absTime.seconds
//   uSpeed      — velocidad base de animación
//   uSpeedMin   — velocidad mínima donde mapa = negro (0–1, relativo a uSpeed)
//   uScaleMin   — escala ruido mínima donde mapa = negro (0.3–1)
//   uScaleMax   — escala ruido máxima donde mapa = blanco (1–3)

uniform float uDistort;
uniform float uBlur;
uniform float uNoiseScale;
uniform float uSamples;
uniform float uStrength;
uniform float uGrain;
uniform float uTime;
uniform float uSpeed;
uniform float uSpeedMin;
uniform float uScaleMin;
uniform float uScaleMax;

out vec4 fragColor;

const int MAX_SAMPLES = 16;
const float GOLDEN = 2.399963;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 4; i++) {
    v += a * noise(p);
    p *= 2.1;
    a *= 0.5;
  }
  return v;
}

vec2 vaporWarp(vec2 uv, float amount, float noiseScale, float speed) {
  float ns = max(noiseScale, 0.1);
  float time = uTime * speed;
  vec2 p = uv * ns + vec2(time * 0.17, -time * 0.13);
  float nx = fbm(p) * 2.0 - 1.0;
  float ny = fbm(p + 4.7) * 2.0 - 1.0;
  return uv + vec2(nx, ny) * amount;
}

vec4 vaporBlur(vec2 uv, vec2 res, float modMap, float effect) {
  float localSpeed = uSpeed * mix(uSpeedMin, 1.0, modMap);
  float localScale = uNoiseScale * mix(uScaleMin, uScaleMax, modMap);

  float blurPx = uBlur * effect;
  float distort = uDistort * effect;
  int samples = int(clamp(uSamples, 2.0, float(MAX_SAMPLES)));

  vec2 warped = vaporWarp(uv, distort, localScale, localSpeed);

  vec4 acc = vec4(0.0);
  float wsum = 0.0;

  for (int i = 0; i < MAX_SAMPLES; i++) {
    if (i >= samples) break;

    float fi = float(i);
    float rnd = hash(uv * res + fi * 17.3 + uTime * localSpeed);
    float ang = GOLDEN * fi + rnd * 6.283185;
    float rad = blurPx * (0.35 + rnd * 0.65) / max(res.x, res.y);

    vec2 off = vec2(cos(ang), sin(ang)) * rad;
    vec2 nudge = vec2(hash(warped + fi) - 0.5, hash(warped + fi + 9.1) - 0.5) * distort * 0.5;

    float w = 1.0 - fi / float(samples);
    acc += texture(sTD2DInputs[0], warped + off + nudge) * w;
    wsum += w;
  }

  return wsum > 0.0 ? acc / wsum : texture(sTD2DInputs[0], uv);
}

void main() {
  vec2 uv = vUV.st;
  vec3 original = texture(sTD2DInputs[0], uv).rgb;

  float modMap = texture(sTD2DInputs[1], uv).r;
  float effect = clamp(modMap * uStrength, 0.0, 1.0);

  vec4 vapor = vaporBlur(uv, uTD2DInfos[0].res.zw, modMap, effect);

  float localSpeed = uSpeed * mix(uSpeedMin, 1.0, modMap);
  float grain = (hash(uv * uTD2DInfos[0].res.zw + uTime * 47.0 * localSpeed) - 0.5) * uGrain * effect;
  vec3 result = mix(original, vapor.rgb + grain, effect);

  fragColor = TDOutputSwizzle(vec4(result, 1.0));
}
