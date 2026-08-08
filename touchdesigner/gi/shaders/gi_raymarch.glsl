// GLSL TOP — GI raymarch (optimizado)
// Inputs: scene · distance · feedback (opcional)
//
// Perf: uFastMode=1 · uSoftRays=1 · uRayCount=8–16 · uMaxSteps=24–32
//       Render GI a 256–512px · uCullDist activo

uniform int uRayCount;
uniform int uMaxSteps;
uniform int uSoftRays;
uniform float uSunAngle;
uniform float uEnableSun;
uniform float uEnableNoise;
uniform float uTemporalBlend;
uniform float uGIGain;
uniform float uEmissionMix;
uniform float uFastMode;
uniform float uCullDist;
uniform float uSkipEmissive;
uniform float uTime;

const float TAU = 6.28318530718;
const float EPS = 0.001;
const float GOLDEN_ANGLE = 2.399963229728653;
const int MAX_RAYS = 32;
const int MAX_STEPS = 48;
const int MAX_SOFT = 3;

out vec4 fragColor;

bool outOfBounds(vec2 uv) {
  return uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0;
}

float rand(vec2 co) {
  return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
}

vec3 sunAndSky(float rayAngle) {
  const vec3 skyColor = vec3(0.02, 0.08, 0.2);
  const vec3 sunColor = vec3(0.95, 0.95, 0.9);
  float angleToSun = mod(rayAngle - uSunAngle, TAU);
  float sunIntensity = smoothstep(1.0, 0.0, angleToSun);
  return sunColor * sunIntensity + skyColor;
}

vec4 castRay(vec2 uv, vec2 res, float angle, int stepLimit) {
  vec2 rayDirection = vec2(cos(angle), sin(angle));
  vec2 sampleUv = uv + rayDirection / res;

  for (int step = 1; step < MAX_STEPS; step++) {
    if (step >= stepLimit) break;
    if (outOfBounds(sampleUv)) break;

    float dist = texture(sTD2DInputs[1], sampleUv).r;
    sampleUv += rayDirection * dist;

    if (outOfBounds(sampleUv)) break;

    if (dist < EPS) {
      vec4 hit = texture(sTD2DInputs[0], sampleUv);
      if (hit.a > 0.1) return vec4(hit.rgb, 1.0);
      return vec4(0.0);
    }
  }

  if (uEnableSun > 0.5) {
    return vec4(sunAndSky(angle), 1.0);
  }
  return vec4(0.0);
}

vec4 raymarch(vec2 uv, vec2 res, float angleOffset, int stepLimit) {
  int rayCount = uFastMode > 0.5 ? min(uRayCount, 8) : min(uRayCount, MAX_RAYS);
  int softRays = uFastMode > 0.5 ? 1 : clamp(uSoftRays, 1, MAX_SOFT);
  rayCount = max(rayCount, 1);

  float oneOverRayCount = 1.0 / float(rayCount);
  float oneOverSoft = 1.0 / float(softRays);
  float jitter = uEnableNoise > 0.5 ? rand(uv) * GOLDEN_ANGLE : 0.0;
  float angularSpread = GOLDEN_ANGLE / float(rayCount) * 0.6;

  vec4 radiance = vec4(0.0);

  for (int i = 0; i < MAX_RAYS; i++) {
    if (i >= rayCount) break;

    float baseAngle = angleOffset + GOLDEN_ANGLE * float(i) + jitter;

    for (int s = 0; s < MAX_SOFT; s++) {
      if (s >= softRays) break;

      float t = float(s) - float(softRays - 1) * 0.5;
      float angle = baseAngle + t * angularSpread;
      radiance += castRay(uv, res, angle, stepLimit) * oneOverSoft;
    }
  }

  return radiance * oneOverRayCount;
}

void main() {
  vec2 uv = vUV.st;
  vec2 res = uTD2DInfos[0].res.zw;

  vec4 scene = texture(sTD2DInputs[0], uv);
  float localDist = texture(sTD2DInputs[1], uv).r;

  if (uSkipEmissive > 0.5 && scene.a > 0.1) {
    vec3 emit = scene.rgb * max(uEmissionMix, 0.0) * uGIGain;
    float alpha = clamp(max(max(emit.r, emit.g), emit.b), 0.0, 1.0);
    fragColor = vec4(emit, alpha);
    return;
  }

  float cull = uFastMode > 0.5 ? min(uCullDist, 0.85) : uCullDist;
  if (localDist >= cull && uEnableSun < 0.5) {
    fragColor = vec4(0.0);
    return;
  }

  int stepLimit = uFastMode > 0.5 ? min(uMaxSteps, 24) : min(uMaxSteps, MAX_STEPS);
  stepLimit = max(stepLimit, 4);

  float angleOffset = 0.0;
  if (uTemporalBlend > 0.0 && uTD2DInfos[2].res.z > 0.0) {
    angleOffset = mod(uTime * 0.4, TAU);
  }

  vec4 finalRadiance = raymarch(uv, res, angleOffset, stepLimit);

  if (uTemporalBlend > 0.0 && uTD2DInfos[2].res.z > 0.0) {
    vec4 prev = texture(sTD2DInputs[2], uv);
    finalRadiance = mix(finalRadiance, prev, uTemporalBlend);
  }

  if (uEmissionMix > 0.0 && scene.a > 0.1) {
    finalRadiance.rgb += scene.rgb * uEmissionMix;
  }

  finalRadiance.rgb *= uGIGain;

  float alpha = clamp(max(max(finalRadiance.r, finalRadiance.g), finalRadiance.b), 0.0, 1.0);
  fragColor = vec4(finalRadiance.rgb, alpha);
}
