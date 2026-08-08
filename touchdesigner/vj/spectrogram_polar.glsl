// GLSL TOP — Espectrograma: cada columna vertical → ángulo polar
//                         cada fila horizontal → radio (anillos concéntricos)
//
// Input:
//   sTD2DInputs[0] = imagen con líneas/columnas verticales
//
// Uniforms:
//   uRotation    — giro en vueltas (0–1 = 360°)
//   uInnerRadius — agujero central normalizado (0–0.9)
//   uInvertY     — invierte eje Y → radio
//   uSoftEdge    — suavizado borde exterior

uniform float uRotation;
uniform float uInnerRadius;
uniform float uInvertY;
uniform float uSoftEdge;

out vec4 fragColor;

const float TAU = 6.28318530718;

void main() {
  vec2 res = uTDOutputInfo.res.zw;
  vec2 uv = vUV.st;

  // Espacio centrado cuadrado (círculo perfecto, anillos concéntricos)
  vec2 p = (uv - 0.5) * 2.0;
  p.x *= res.x / res.y;

  float r = length(p);
  float inner = clamp(uInnerRadius, 0.0, 0.95);

  float outerMask = 1.0 - smoothstep(1.0 - uSoftEdge, 1.0, r);
  float innerMask = smoothstep(inner, inner + uSoftEdge, r);
  float mask = outerMask * innerMask;

  if (mask < 0.001) {
    fragColor = TDOutputSwizzle(vec4(0.0));
    return;
  }

  // Ángulo 0…2π (evita duplicar medio círculo)
  float ang = atan(p.y, p.x);
  if (ang < 0.0) ang += TAU;

  // Columna vertical → ángulo
  float srcX = fract(ang / TAU + uRotation);

  // Fila → radio normalizado (anillo concéntrico)
  float srcY = (r - inner) / max(1.0 - inner, 0.001);
  if (uInvertY > 0.5) srcY = 1.0 - srcY;
  srcY = clamp(srcY, 0.0, 1.0);

  vec3 col = texture(sTD2DInputs[0], vec2(srcX, srcY)).rgb;
  col *= mask;

  fragColor = TDOutputSwizzle(vec4(col, 1.0));
}
