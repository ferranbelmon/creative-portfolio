// GLSL TOP — Halftone modulado por máscara en escala de grises
//
// Inputs:
//   sTD2DInputs[0] = imagen base (postFX)
//   sTD2DInputs[1] = máscara gris (R = intensidad del halftone, 0 = sin efecto)
//
// Uniforms:
//   uDotSize    — tamaño de celda en píxeles (6–24)
//   uAngle      — ángulo del patrón en radianes (0.4 ≈ 23°)
//   uIntensity  — intensidad global (0–1)
//   uContrast   — contraste del patrón (0.5–2)
//   uSoftness   — suavidad del borde del punto (0 = duro, 0.15 = suave)
//   uInvert     — 0 = zonas oscuras = puntos grandes (offset) · 1 = invertido

uniform float uDotSize;
uniform float uAngle;
uniform float uIntensity;
uniform float uContrast;
uniform float uSoftness;
uniform float uInvert;

out vec4 fragColor;

float luminance(vec3 c) {
  return dot(c, vec3(0.299, 0.587, 0.114));
}

vec2 halftoneUv(vec2 uv, vec2 res) {
  vec2 p = uv * res;
  float c = cos(uAngle);
  float s = sin(uAngle);
  p = mat2(c, -s, s, c) * p;
  float size = max(uDotSize, 1.0);
  return p / size;
}

float halftoneDot(vec2 cellUv, float lum, vec2 aspect) {
  vec2 p = cellUv * aspect;
  float ink = uInvert > 0.5 ? lum : 1.0 - lum;
  ink = pow(clamp(ink, 0.0, 1.0), uContrast);
  float radius = ink * 0.5;
  float dist = length(p);
  return 1.0 - smoothstep(radius - uSoftness, radius + uSoftness, dist);
}

void main() {
  vec2 uv = vUV.st;
  vec2 res = uTD2DInfos[0].res.zw;
  vec2 aspect = vec2(1.0, res.x / res.y);

  vec3 original = texture(sTD2DInputs[0], uv).rgb;
  float modMask = texture(sTD2DInputs[1], uv).r;
  float effect = clamp(modMask * uIntensity, 0.0, 1.0);

  vec2 hc = halftoneUv(uv, res);
  vec2 cellId = floor(hc);
  vec2 cellUv = fract(hc) - 0.5;

  vec2 cellCenterUv = (cellId + 0.5) * max(uDotSize, 1.0);
  float ca = cos(-uAngle);
  float sa = sin(-uAngle);
  cellCenterUv = mat2(ca, -sa, sa, ca) * cellCenterUv / res;

  float lum = luminance(texture(sTD2DInputs[0], cellCenterUv).rgb);
  float dot = halftoneDot(cellUv, lum, aspect);

  vec3 halftoned = original * dot;
  vec3 result = mix(original, halftoned, effect);

  fragColor = TDOutputSwizzle(vec4(result, 1.0));
}
