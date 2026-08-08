// GLSL TOP — Cross blur (rayos verticales + horizontales por píxel)
// Sin punto de origen: cada píxel genera su propia cruz.
//
// Input:
//   sTD2DInputs[0] = imagen base
//
// Uniforms:
//   uSamples      — muestras por eje (4–32)
//   uVertLength   — longitud del rayo vertical en píxeles
//   uHorizLength  — longitud del rayo horizontal en píxeles
//   uVertWeight   — peso del eje vertical (0–2)
//   uHorizWeight  — peso del eje horizontal (0–2)
//   uStrength     — mezcla efecto / original (0–1)
//   uDecay        — agudez de la punta (2 = suave, 4–6 = punta afilada)
//   uThreshold    — 0 = todo · >0 = solo píxeles brillantes aportan al blur

uniform float uSamples;
uniform float uVertLength;
uniform float uHorizLength;
uniform float uVertWeight;
uniform float uHorizWeight;
uniform float uStrength;
uniform float uDecay;
uniform float uThreshold;

out vec4 fragColor;

const int MAX_SAMPLES = 32;
const float HALF_PI = 1.5707963;

float luminance(vec3 c) {
  return dot(c, vec3(0.299, 0.587, 0.114));
}

// t=0 cerca del píxel · t=1 en la punta del rayo
float pointedFalloff(float t) {
  float rem = clamp(1.0 - t, 0.0, 1.0);
  float body = sin(rem * HALF_PI);
  float tip = rem * rem;
  return pow(body, max(uDecay, 0.1)) * tip;
}

vec4 sampleRay(vec2 uv, vec2 dir, float lengthPx, vec2 res, float weight) {
  vec4 acc = vec4(0.0);
  float wsum = 0.0;
  int samples = int(clamp(uSamples, 1.0, float(MAX_SAMPLES)));

  for (int i = 0; i < MAX_SAMPLES; i++) {
    if (i >= samples) break;

    float t = (float(i) + 1.0) / float(samples);
    float falloff = pointedFalloff(t);
    vec2 offset = dir * lengthPx * t / res;

    vec4 s1 = texture(sTD2DInputs[0], uv + offset);
    vec4 s2 = texture(sTD2DInputs[0], uv - offset);

    float m1 = uThreshold > 0.0 ? smoothstep(uThreshold, uThreshold + 0.08, luminance(s1.rgb)) : 1.0;
    float m2 = uThreshold > 0.0 ? smoothstep(uThreshold, uThreshold + 0.08, luminance(s2.rgb)) : 1.0;

    acc += s1 * falloff * m1;
    acc += s2 * falloff * m2;
    wsum += 2.0 * falloff * max(m1, m2);
  }

  return wsum > 0.0 ? acc / wsum * weight : vec4(0.0);
}

void main() {
  vec2 uv = vUV.st;
  vec2 res = uTD2DInfos[0].res.zw;

  vec4 original = texture(sTD2DInputs[0], uv);

  vec4 vertBlur = sampleRay(uv, vec2(0.0, 1.0), uVertLength, res, uVertWeight);
  vec4 horizBlur = sampleRay(uv, vec2(1.0, 0.0), uHorizLength, res, uHorizWeight);

  float wCenter = 1.0;
  vec4 crossed = original * wCenter + vertBlur + horizBlur;
  crossed /= wCenter + max(uVertWeight, 0.0) + max(uHorizWeight, 0.0);

  vec3 result = mix(original.rgb, crossed.rgb, clamp(uStrength, 0.0, 1.0));
  fragColor = TDOutputSwizzle(vec4(result, original.a));
}
