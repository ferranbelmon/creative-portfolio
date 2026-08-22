export const fullscreenVertexShader = /* glsl */ `

varying vec2 vUv;



void main() {

  vUv = uv;

  gl_Position = vec4(position.xy, 0.0, 1.0);

}

`;



export const occlusionBlurFragmentShader = /* glsl */ `

precision highp float;



uniform sampler2D tOcclusion;

uniform vec2 uResolution;

uniform float uBlurRadius;



varying vec2 vUv;



float sampleOcc(vec2 uv) {

  return texture2D(tOcclusion, clamp(uv, vec2(0.001), vec2(0.999))).r;

}



void main() {

  vec2 texel = uBlurRadius / uResolution;

  float sum = sampleOcc(vUv) * 0.22;

  float weight = 0.22;



  vec2 ring1[8];

  ring1[0] = vec2(1.0, 0.0);

  ring1[1] = vec2(-1.0, 0.0);

  ring1[2] = vec2(0.0, 1.0);

  ring1[3] = vec2(0.0, -1.0);

  ring1[4] = vec2(0.707, 0.707);

  ring1[5] = vec2(-0.707, 0.707);

  ring1[6] = vec2(0.707, -0.707);

  ring1[7] = vec2(-0.707, -0.707);



  for (int i = 0; i < 8; i++) {

    sum += sampleOcc(vUv + ring1[i] * texel) * 0.085;

    weight += 0.085;

  }



  vec2 ring2[8];

  ring2[0] = vec2(1.6, 0.0);

  ring2[1] = vec2(-1.6, 0.0);

  ring2[2] = vec2(0.0, 1.6);

  ring2[3] = vec2(0.0, -1.6);

  ring2[4] = vec2(1.13, 1.13);

  ring2[5] = vec2(-1.13, 1.13);

  ring2[6] = vec2(1.13, -1.13);

  ring2[7] = vec2(-1.13, -1.13);



  for (int i = 0; i < 8; i++) {

    sum += sampleOcc(vUv + ring2[i] * texel) * 0.045;

    weight += 0.045;

  }



  gl_FragColor = vec4(vec3(sum / weight), 1.0);

}

`;



export const emissiveHaloFragmentShader = /* glsl */ `

precision highp float;



uniform sampler2D tOcclusion;

uniform sampler2D tBlurred;

uniform float uHaloGain;
uniform float uOccCutoff;
uniform float uHaloPow;



varying vec2 vUv;



void main() {

  float occ = texture2D(tOcclusion, vUv).r;

  float blurred = texture2D(tBlurred, vUv).r;

  float ring = max(0.0, blurred - occ * uOccCutoff);
  float halo = pow(ring, uHaloPow) * uHaloGain;

  gl_FragColor = vec4(vec3(halo), halo);

}

`;



export const bloomExtractFragmentShader = /* glsl */ `
precision highp float;

uniform sampler2D tComposite;
uniform float uThreshold;
uniform float uSoftness;

varying vec2 vUv;

void main() {
  vec3 color = texture2D(tComposite, vUv).rgb;
  float lum = max(max(color.r, color.g), color.b);
  float mask = smoothstep(uThreshold, uThreshold + uSoftness, lum);
  gl_FragColor = vec4(color * mask, mask);
}
`;

export const bloomBlurFragmentShader = /* glsl */ `
precision highp float;

uniform sampler2D tInput;
uniform vec2 uResolution;
uniform vec2 uDirection;
uniform float uBlurRadius;

varying vec2 vUv;

void main() {
  vec2 texel = uBlurRadius * uDirection / uResolution;
  vec3 sum = texture2D(tInput, vUv).rgb * 0.227;
  sum += texture2D(tInput, vUv + texel * 1.0).rgb * 0.194;
  sum += texture2D(tInput, vUv - texel * 1.0).rgb * 0.194;
  sum += texture2D(tInput, vUv + texel * 2.0).rgb * 0.122;
  sum += texture2D(tInput, vUv - texel * 2.0).rgb * 0.122;
  sum += texture2D(tInput, vUv + texel * 3.0).rgb * 0.054;
  sum += texture2D(tInput, vUv - texel * 3.0).rgb * 0.054;
  gl_FragColor = vec4(sum, 1.0);
}
`;

export const bloomCompositeFragmentShader = /* glsl */ `
precision highp float;

uniform sampler2D tComposite;
uniform sampler2D tBloom;
uniform float uBloomStrength;

varying vec2 vUv;

void main() {
  vec4 source = texture2D(tComposite, vUv);
  vec3 bloom = texture2D(tBloom, vUv).rgb;
  vec3 color = source.rgb + bloom * uBloomStrength;
  float alpha = clamp(source.a + max(max(bloom.r, bloom.g), bloom.b) * uBloomStrength * 0.35, 0.0, 1.0);
  gl_FragColor = vec4(color, alpha);
}
`;

export const rgbGodraysFragmentShader = /* glsl */ `
precision highp float;

uniform sampler2D tHalo;
uniform vec2 uLightPos;
uniform vec2 uResolution;
uniform float uChromaticOrigin;
uniform float uChromaticShift;
uniform float uExposure;
uniform float uDecay;
uniform float uFalloffPow;
uniform vec3 uRgbGain;

varying vec2 vUv;

const int SAMPLES = 72;

float hash21(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

vec2 tangentAt(vec2 uv) {
  vec2 aspect = vec2(uResolution.x / uResolution.y, 1.0);
  vec2 radial = (uv - uLightPos) * aspect;
  vec2 tangent = vec2(-radial.y, radial.x);
  float len = length(tangent);
  if (len < 0.0001) {
    tangent = vec2(0.0, 1.0);
  } else {
    tangent /= len;
  }
  return vec2(tangent.x / aspect.x, tangent.y);
}

float marchChannel(float channelSign) {
  vec2 tangent = tangentAt(vUv);
  vec2 originOffset = tangent * uChromaticOrigin * channelSign;
  vec2 lightPos = uLightPos + originOffset;

  float jitter = hash21(vUv * uResolution);
  float illumination = 0.0;
  float weightSum = 0.0;

  for (int i = 0; i < SAMPLES; i++) {
    float t = min((float(i) + jitter) / float(SAMPLES), 0.999);
    vec2 coord = mix(vUv, lightPos, t);
    vec2 chromaticShift = tangent * uChromaticShift * t * channelSign;
    float decay = pow(uDecay, float(i));
    float haloTap = texture2D(tHalo, coord + chromaticShift).r;

    illumination += haloTap * decay;
    weightSum += decay;
  }

  return illumination / max(weightSum, 0.0001);
}

void main() {
  float r = marchChannel(-1.0);
  float g = marchChannel(0.0);
  float b = marchChannel(1.0);

  vec3 illumination = vec3(r, g, b) * uExposure;
  illumination = pow(clamp(illumination, 0.0, 1.0), vec3(uFalloffPow));
  illumination *= uRgbGain;

  float alpha = max(illumination.r, max(illumination.g, illumination.b));
  gl_FragColor = vec4(illumination, alpha);
}
`;


