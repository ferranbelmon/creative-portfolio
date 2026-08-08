// GLSL TOP — Convert JFA seed texture to signed distance field
// Input: sTD2DInputs[0] = final JFA texture

out vec4 fragColor;

void main() {
  vec2 uv = vUV.st;
  vec2 nearestSeed = texture(sTD2DInputs[0], uv).xy;
  float dist = clamp(distance(uv, nearestSeed), 0.0, 1.0);
  fragColor = vec4(dist, dist, dist, 1.0);
}
