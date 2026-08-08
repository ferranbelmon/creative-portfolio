// GLSL TOP — Blur estético con mezcla de color / gradientes suaves
//
// Inputs:
//   sTD2DInputs[0] = imagen base
//   sTD2DInputs[1] = mapa de dirección (según uMode)
//
// uMode 0 — Flow map:  RG = dirección (0.5,0.5 = isotrópico) · B = fuerza local
// uMode 1 — Ángulo:    R = ángulo (0–1 → 0–360°) · G = fuerza local
// uMode 2 — Kuwahara:  ignora dirección, regiones de color plano con transiciones suaves
//
// Uniforms:
//   uMode        — 0 flow · 1 ángulo · 2 kuwahara
//   uLength      — longitud del blur en píxeles (20–80)
//   uSamples     — muestras por eje (8–24)
//   uPerpMix     — mezcla perpendicular (0–0.5, suaviza gradientes de color)
//   uStrength    — intensidad del efecto (0–1)
//   uKuwahara    — radio kuwahara en píxeles (mode 2, 4–16)

uniform float uMode;
uniform float uLength;
uniform float uSamples;
uniform float uPerpMix;
uniform float uStrength;
uniform float uKuwahara;

out vec4 fragColor;

const int MAX_SAMPLES = 24;

vec2 getDirection(vec2 uv) {
  vec4 map = texture(sTD2DInputs[1], uv);
  int mode = int(uMode + 0.5);

  if (mode == 1) {
    float ang = map.r * 6.283185;
    float str = map.g > 0.001 ? map.g : 1.0;
    return vec2(cos(ang), sin(ang)) * str;
  }

  vec2 flow = map.rg * 2.0 - 1.0;
  float str = map.b > 0.001 ? map.b : 1.0;
  float len = length(flow);
  if (len < 0.001) return vec2(0.0);
  return flow / len * str;
}

vec4 gaussianIsotropic(vec2 uv, vec2 res, float radiusPx, int samples) {
  vec4 acc = vec4(0.0);
  float wsum = 0.0;

  for (int i = -MAX_SAMPLES; i <= MAX_SAMPLES; i++) {
    if (abs(i) > samples) continue;
    float fi = float(i);
    float t = fi / float(samples);
    float w = exp(-t * t * 2.5);

    float ang = fi * 2.399963;
    vec2 off = vec2(cos(ang), sin(ang)) * radiusPx * abs(t) / res;
    acc += texture(sTD2DInputs[0], uv + off) * w;
    wsum += w;
  }

  return acc / wsum;
}

vec4 directionalBlur(vec2 uv, vec2 res, vec2 dir, float radiusPx, int samples) {
  if (length(dir) < 0.001) {
    return gaussianIsotropic(uv, res, radiusPx, samples);
  }

  vec2 nDir = normalize(dir);
  vec2 pDir = vec2(-nDir.y, nDir.x);

  vec4 acc = vec4(0.0);
  float wsum = 0.0;

  for (int i = -MAX_SAMPLES; i <= MAX_SAMPLES; i++) {
    if (abs(i) > samples) continue;
    float fi = float(i);
    float t = fi / float(samples);
    float w = exp(-t * t * 2.0);

    vec2 off = nDir * radiusPx * t / res;
    off += pDir * radiusPx * t * uPerpMix / res;

    acc += texture(sTD2DInputs[0], uv + off) * w;
    wsum += w;
  }

  return acc / wsum;
}

vec3 kuwahara(vec2 uv, vec2 res, float radiusPx) {
  float r = max(radiusPx, 1.0) / res.x;

  vec3 m0 = vec3(0.0), m1 = vec3(0.0), m2 = vec3(0.0), m3 = vec3(0.0);
  float s0 = 0.0, s1 = 0.0, s2 = 0.0, s3 = 0.0;
  float n0 = 0.0, n1 = 0.0, n2 = 0.0, n3 = 0.0;

  for (int y = -2; y <= 2; y++) {
    for (int x = -2; x <= 2; x++) {
      vec2 off = vec2(float(x), float(y)) * r * 0.5;
      vec3 c = texture(sTD2DInputs[0], uv + off).rgb;

      if (x >= 0 && y >= 0) { m0 += c; n0 += 1.0; }
      if (x < 0 && y >= 0)  { m1 += c; n1 += 1.0; }
      if (x < 0 && y < 0)   { m2 += c; n2 += 1.0; }
      if (x >= 0 && y < 0)  { m3 += c; n3 += 1.0; }
    }
  }

  m0 /= n0; m1 /= n1; m2 /= n2; m3 /= n3;

  float v0 = 0.0, v1 = 0.0, v2 = 0.0, v3 = 0.0;

  for (int y = -2; y <= 2; y++) {
    for (int x = -2; x <= 2; x++) {
      vec2 off = vec2(float(x), float(y)) * r * 0.5;
      vec3 c = texture(sTD2DInputs[0], uv + off).rgb;

      if (x >= 0 && y >= 0) v0 += dot(c - m0, c - m0);
      if (x < 0 && y >= 0)  v1 += dot(c - m1, c - m1);
      if (x < 0 && y < 0)   v2 += dot(c - m2, c - m2);
      if (x >= 0 && y < 0)  v3 += dot(c - m3, c - m3);
    }
  }

  float vmin = min(min(v0, v1), min(v2, v3));
  if (vmin == v0) return m0;
  if (vmin == v1) return m1;
  if (vmin == v2) return m2;
  return m3;
}

void main() {
  vec2 uv = vUV.st;
  vec2 res = uTD2DInfos[0].res.zw;

  vec4 original = texture(sTD2DInputs[0], uv);
  int samples = int(clamp(uSamples, 4.0, float(MAX_SAMPLES)));
  int mode = int(uMode + 0.5);

  vec4 blurred;

  if (mode == 2) {
    vec3 k = kuwahara(uv, res, uKuwahara);
    blurred = vec4(k, original.a);
  } else {
    vec2 dir = getDirection(uv);
    float str = length(dir);
    if (str < 0.001) str = 1.0;
    blurred = directionalBlur(uv, res, dir, uLength * str, samples);
    blurred.a = original.a;
  }

  float blend = clamp(uStrength, 0.0, 1.0);
  vec3 result = mix(original.rgb, blurred.rgb, blend);

  fragColor = TDOutputSwizzle(vec4(result, original.a));
}
