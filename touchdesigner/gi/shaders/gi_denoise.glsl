// GLSL TOP — Suavizado espacial del GI (elimina rayos visibles)
// Inputs:
//   sTD2DInputs[0] = salida de gi
//   sTD2DInputs[1] = scene TOP (máscara: no difuminar emisores)
//
// Uniforms:
//   uBlurRadius   — radio en píxeles (2–4)
//   uBlurStrength — mezcla 0–1 (0.7–0.9 recomendado)

uniform float uBlurRadius;
uniform float uBlurStrength;

out vec4 fragColor;

void main() {
  vec2 uv = vUV.st;
  vec2 res = uTD2DInfos[0].res.zw;
  vec2 px = uBlurRadius / res;

  vec4 scene = texture(sTD2DInputs[1], uv);
  vec4 center = texture(sTD2DInputs[0], uv);

  if (scene.a > 0.1) {
    fragColor = center;
    return;
  }

  vec4 blurred = vec4(0.0);
  float weight = 0.0;

  const float k[5] = float[](0.06136, 0.24477, 0.38774, 0.24477, 0.06136);

  for (int y = -2; y <= 2; y++) {
    for (int x = -2; x <= 2; x++) {
      vec2 off = vec2(float(x), float(y)) * px;
      vec4 sampleCol = texture(sTD2DInputs[0], uv + off);
      float w = k[x + 2] * k[y + 2];
      blurred += sampleCol * w;
      weight += w;
    }
  }

  blurred /= weight;
  fragColor = mix(center, blurred, clamp(uBlurStrength, 0.0, 1.0));
}
