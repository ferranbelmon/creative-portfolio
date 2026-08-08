// GLSL TOP — Distorsión espacial no radial (VJ / luz distorsionada)
// Solo deforma UV — sin RGB split, sin ripples concéntricos.
//
// Inputs:
//   sTD2DInputs[0] = imagen / video / GI
//
// Uniforms:
//   uTime    — absTime.seconds
//   uFreq    — frecuencia de ondas (2–20)
//   uAmp     — intensidad de distorsión (0–0.05)
//   uSpeed   — velocidad de animación (0.5–2)
//   uPos     — desplaza fase del campo (Panel CHOP u,v o LFO)
//   uWarp    — 0 = una pasada, 1 = domain warp extra (más caótico)

uniform float uTime;
uniform float uFreq;
uniform float uAmp;
uniform float uSpeed;
uniform vec2 uPos;
uniform float uWarp;

out vec4 fragColor;

vec2 distort(vec2 uv) {
  vec2 p = uv;

  // uPos modula fase, no actúa como centro radial
  float t = uTime * uSpeed;
  vec2 phase = uPos * 6.283185;

  // Ejes de onda no alineados (interferencia, no círculos)
  float wx = sin(p.y * uFreq + t * 1.31 + phase.x);
  float wy = cos(p.x * uFreq * 1.07 - t * 0.97 + phase.y);
  float wd = sin((p.x + p.y) * uFreq * 0.73 + t * 0.83 + phase.x * 0.5);
  float wc = cos((p.x - p.y) * uFreq * 0.89 - t * 1.17 - phase.y * 0.5);

  p += vec2(wx + wd * 0.6, wy + wc * 0.6) * uAmp;

  if (uWarp > 0.5) {
    p.x += sin(p.y * uFreq * 1.4 - t * 1.2 + phase.y) * uAmp * 0.45;
    p.y += cos(p.x * uFreq * 1.25 + t * 0.85 + phase.x) * uAmp * 0.45;
  }

  return p;
}

void main() {
  vec2 uv = vUV.st;
  vec2 warped = distort(uv);
  vec3 col = texture(sTD2DInputs[0], warped).rgb;
  fragColor = TDOutputSwizzle(vec4(col, 1.0));
}
