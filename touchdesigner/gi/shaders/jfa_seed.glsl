// GLSL TOP — JFA seed: guarda el uv de píxeles con alpha en RG
// Input 0: scene TOP (RGB = emisión, alpha > 0 = ocupado)

out vec4 fragColor;

void main() {
  vec2 uv = vUV.st;
  float alpha = texture(sTD2DInputs[0], uv).a;
  fragColor = vec4(uv * alpha, 0.0, 1.0);
}
