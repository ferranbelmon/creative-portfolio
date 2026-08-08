// GLSL TOP — Gradient map modulado por imagen en escala de grises
// NO es blur: remapea cada píxel a un color de un gradiente.
//
// Inputs:
//   sTD2DInputs[0] = imagen fuente (define la paleta del gradiente)
//   sTD2DInputs[1] = mapa gris (R = posición en el gradiente, 0→1)
//
// Uniforms:
//   uMode       — 0 = local · 1 = tira vertical · 2 = global
//   uContrast   — contraste del ramp (0.5–2)
//   uBias       — desplaza el punto medio del gradiente (0–1)
//   uBlend      — mezcla con imagen original (0 = solo gradiente, 1 = original)

uniform float uMode;
uniform float uContrast;
uniform float uBias;
uniform float uBlend;

out vec4 fragColor;

vec3 ramp3(vec3 a, vec3 b, vec3 c, float t) {
  t = clamp(t, 0.0, 1.0);
  if (t < 0.5) {
    return mix(a, b, t * 2.0);
  }
  return mix(b, c, (t - 0.5) * 2.0);
}

void main() {
  vec2 uv = vUV.st;
  vec3 original = texture(sTD2DInputs[0], uv).rgb;

  float t = texture(sTD2DInputs[1], uv).r;
  t = clamp((t - uBias + 0.5) * uContrast, 0.0, 1.0);

  vec3 dark;
  vec3 mid;
  vec3 bright;

  int mode = int(uMode + 0.5);

  if (mode == 1) {
    dark = texture(sTD2DInputs[0], vec2(uv.x, 0.08)).rgb;
    mid = texture(sTD2DInputs[0], vec2(uv.x, 0.5)).rgb;
    bright = texture(sTD2DInputs[0], vec2(uv.x, 0.92)).rgb;
  } else if (mode == 2) {
    dark = texture(sTD2DInputs[0], vec2(0.1, 0.1)).rgb;
    mid = texture(sTD2DInputs[0], vec2(0.5, 0.5)).rgb;
    bright = texture(sTD2DInputs[0], vec2(0.9, 0.9)).rgb;
  } else {
    vec3 src = original;
    dark = src * 0.25;
    mid = src;
    bright = min(src * 2.2 + 0.05, vec3(1.0));
  }

  vec3 gradient = ramp3(dark, mid, bright, t);
  vec3 result = mix(gradient, original, clamp(uBlend, 0.0, 1.0));

  fragColor = TDOutputSwizzle(vec4(result, 1.0));
}
