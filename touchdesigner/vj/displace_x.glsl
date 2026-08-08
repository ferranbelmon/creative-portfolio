// GLSL TOP — Desplazamiento horizontal (X) modulado por textura en escala de grises
//
// Inputs:
//   sTD2DInputs[0] = imagen base
//   sTD2DInputs[1] = mapa gris (R modula el desplazamiento en X)
//
// Uniforms:
//   uAmount  — desplazamiento máximo en píxeles
//   uBias    — punto neutro del mapa (0.5 = gris medio sin desplazamiento)
//   uScale   — multiplicador global (0–2)
//   uTime    — absTime.seconds
//   uSpeed   — velocidad de desplazamiento del mapa (UV/s, negativo = invertir)

uniform float uAmount;
uniform float uBias;
uniform float uScale;
uniform float uTime;
uniform float uSpeed;

out vec4 fragColor;

void main() {
  vec2 uv = vUV.st;
  vec2 res = uTD2DInfos[0].res.zw;

  vec2 mapUv = vec2(uv.x + uTime * uSpeed, uv.y);
  float map = texture(sTD2DInputs[1], mapUv).r;

  float delta = (map - uBias) * uScale * uAmount / res.x;
  vec2 displaced = vec2(uv.x + delta, uv.y);
  vec3 col = texture(sTD2DInputs[0], displaced).rgb;

  fragColor = TDOutputSwizzle(vec4(col, 1.0));
}
