// GLSL TOP — Jump Flood Algorithm pass
// Input: sTD2DInputs[0] = previous JFA pass
// Uniform: uOffset (float, pixel offset for this pass)

uniform float uOffset;

out vec4 fragColor;

void main() {
  vec2 uv = vUV.st;
  vec2 res = uTD2DInfos[0].res.zw;

  vec4 nearestSeed = vec4(-2.0, -2.0, 0.0, 0.0);
  float nearestDist = 999999.9;

  for (float y = -1.0; y <= 1.0; y += 1.0) {
    for (float x = -1.0; x <= 1.0; x += 1.0) {
      vec2 sampleUV = uv + vec2(x, y) * uOffset / res;

      if (sampleUV.x < 0.0 || sampleUV.x > 1.0 || sampleUV.y < 0.0 || sampleUV.y > 1.0) {
        continue;
      }

      vec4 sampleValue = texture(sTD2DInputs[0], sampleUV);
      vec2 sampleSeed = sampleValue.xy;

      if (sampleSeed.x != 0.0 || sampleSeed.y != 0.0) {
        vec2 diff = sampleSeed - uv;
        float dist = dot(diff, diff);
        if (dist < nearestDist) {
          nearestDist = dist;
          nearestSeed = sampleValue;
        }
      }
    }
  }

  fragColor = nearestSeed;
}
