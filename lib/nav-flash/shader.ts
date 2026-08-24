/** Nav transition flash (WebGL). Parked — re-enable with ENABLE_NAV_FLASH in NavFlashProvider. */
export const NAV_FLASH_PEAK_S = 0.15;
export const NAV_FLASH_FADE_START_S = 0.14;
export const NAV_FLASH_END_S = 0.9;
export const NAV_FLASH_STROBE_RATE = 16;
export const NAV_FLASH_CIRCLE_COUNT = 7;

export const navFlashVertexShader = `#version 300 es
in vec2 aPosition;
void main() {
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`;

export const navFlashFragmentShader = `#version 300 es
precision highp float;

uniform vec2 uResolution;
uniform float uTime;
uniform float uStrobeRate;
uniform float uOpacity;

out vec4 fragColor;

#define COL vec3(235.0, 241.0, 245.0) / 255.0
#define FLASH_COUNT ${NAV_FLASH_CIRCLE_COUNT}
#define BLAST_SCALE 0.12

// RGB particle split (rainbow edges)
#define RGB_OFFSET 0.005
#define SIZE_R 0.5
#define SIZE_G 1.0
#define SIZE_B 1.5

// Home-like god rays — cheap radial march (single halo tap, few samples)
#define GODRAYS_POWER 3.0
#define GODRAYS_EXPOSURE 1.1
#define GODRAYS_DECAY 0.199
#define GODRAYS_FALLOFF 0.98
#define GODRAYS_SAMPLES 24
#define GODRAYS_RGB_GAIN vec3(1.19, 1.1, 1.18)

float hash11(float p) {
  return fract(sin(p * 127.1) * 43758.5453123);
}

vec2 hash22(float p) {
  return vec2(hash11(p), hash11(p + 19.19));
}

vec2 flashTarget(int i, float pulseIndex) {
  float n = float(i) * 19.17 + pulseIndex * 97.31 + 3.7;
  float angle = hash11(n) * 6.2831853;
  // Spread fills the screen — near-edge targets
  float radius = 0.22 + hash11(n * 1.618 + 41.2) * 0.95;
  return vec2(cos(angle), sin(angle)) * radius * vec2(1.2, 0.88);
}

// Birth at screen center, expand outward to target (phase 1→0)
vec2 flashCenter(int i, float pulseIndex, float phase) {
  vec2 target = flashTarget(i, pulseIndex);
  float expand = clamp(1.0 - phase, 0.0, 1.0);
  // Stagger so they don't all leave the center together
  float delay = float(i) / float(FLASH_COUNT) * 0.28;
  float t = smoothstep(delay, min(delay + 0.72, 1.0), expand);
  t = 1.0 - (1.0 - t) * (1.0 - t); // ease-out
  return mix(vec2(0.0), target, t);
}

float circ(vec2 p, float phase) {
  float r = sqrt(length(p));
  return abs(2.6 * r * phase);
}

float circleScalar(vec2 delta, float phase, float size) {
  float rz = max(abs(circ(delta * BLAST_SCALE / max(size, 0.05), phase)), 0.012);
  float pulse = 0.28 / rz;
  return clamp(pulse / 5.5, 0.0, 1.0);
}

vec2 channelOffset(float seed, float channel) {
  vec2 h = hash22(seed + channel * 7.13);
  return (h * 2.0 - 1.0) * RGB_OFFSET;
}

// One particle = 3 RGB discs, subtly offset, small→large → rainbow rim
vec3 particleRGB(vec2 uv, int i, float pulseIndex, float phase) {
  vec2 center = flashCenter(i, pulseIndex, phase);
  float seed = float(i) * 3.7 + pulseIndex * 11.3;

  vec2 cR = center + channelOffset(seed, 0.0);
  vec2 cG = center + channelOffset(seed, 1.0);
  vec2 cB = center + channelOffset(seed, 2.0);

  float r = circleScalar(uv - cR, phase, SIZE_R);
  float g = circleScalar(uv - cG, phase, SIZE_G);
  float b = circleScalar(uv - cB, phase, SIZE_B);

  return vec3(r, g, b);
}

vec3 allParticles(vec2 uv, float pulseIndex, float phase) {
  vec3 col = vec3(0.0);
  for (int i = 0; i < FLASH_COUNT; i++) {
    col = max(col, particleRGB(uv, i, pulseIndex, phase));
  }
  return col;
}

float luma(vec3 c) {
  return max(c.r, max(c.g, c.b));
}

// Cheap mono halo for ray marching (no RGB triple)
float particleHalo(vec2 uv, int i, float pulseIndex, float phase) {
  return circleScalar(uv - flashCenter(i, pulseIndex, phase), phase, SIZE_G);
}

// Home-style volumetric rays — O(FLASH_COUNT * SAMPLES) cheap taps
vec3 godRaysHome(
  vec2 uv,
  float pulseIndex,
  float phase,
  float mixAmt
) {
  if (mixAmt < 0.01) return vec3(0.0);

  float illumination = 0.0;

  for (int f = 0; f < FLASH_COUNT; f++) {
    vec2 lightPos = flashCenter(f, pulseIndex, phase);
    float sum = 0.0;
    float weightSum = 0.0;

    for (int s = 0; s < GODRAYS_SAMPLES; s++) {
      float t = float(s) / float(GODRAYS_SAMPLES - 1);
      float decay = pow(GODRAYS_DECAY, float(s));
      vec2 coord = mix(uv, lightPos, t);
      sum += particleHalo(coord, f, pulseIndex, phase) * decay;
      weightSum += decay;
    }

    float ray = (sum / max(weightSum, 1e-4)) * GODRAYS_EXPOSURE;
    ray = pow(clamp(ray, 0.0, 1.0), GODRAYS_FALLOFF);
    illumination = max(illumination, ray);
  }

  return vec3(illumination) * GODRAYS_RGB_GAIN * mixAmt * GODRAYS_POWER;
}

void main() {
  vec2 uv = (gl_FragCoord.xy - uResolution * 0.5) / uResolution.y;

  float pulseClock = uTime * uStrobeRate;
  float pulseIndex = floor(pulseClock);
  float phase = 1.0 - fract(pulseClock);

  vec3 particles = allParticles(uv, pulseIndex, phase);

  float rayMix =
    smoothstep(0.06, 0.22, uTime) *
    (1.0 - smoothstep(0.5, 0.68, uTime) * 0.2);
  vec3 rays = godRaysHome(uv, pulseIndex, phase, rayMix);

  float wash = smoothstep(0.1, 0.42, uTime);
  vec3 col = particles;
  col = max(col, rays);
  col += rays * 0.45;
  col = mix(col, COL, wash * 0.18);

  float intensity = clamp(
    max(luma(particles), max(wash * 0.92, luma(rays) * 0.9)),
    0.0,
    1.0
  );
  fragColor = vec4(clamp(col, 0.0, 1.0), intensity * uOpacity);
}
`;

function compileShader(
  gl: WebGL2RenderingContext,
  type: number,
  source: string,
) {
  const shader = gl.createShader(type);
  if (!shader) throw new Error("Could not create shader");

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader) ?? "Unknown shader error";
    gl.deleteShader(shader);
    throw new Error(log);
  }

  return shader;
}

function createProgram(gl: WebGL2RenderingContext) {
  const program = gl.createProgram();
  if (!program) throw new Error("Could not create program");

  const vertex = compileShader(gl, gl.VERTEX_SHADER, navFlashVertexShader);
  const fragment = compileShader(
    gl,
    gl.FRAGMENT_SHADER,
    navFlashFragmentShader,
  );

  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const log = gl.getProgramInfoLog(program) ?? "Unknown link error";
    gl.deleteProgram(program);
    throw new Error(log);
  }

  return program;
}

export type NavFlashRenderer = {
  render: (time: number, opacity: number) => void;
  resize: () => void;
  dispose: () => void;
};

export function createNavFlashRenderer(canvas: HTMLCanvasElement): NavFlashRenderer {
  const gl = canvas.getContext("webgl2", {
    alpha: true,
    antialias: false,
    depth: false,
    stencil: false,
    premultipliedAlpha: false,
  });

  if (!gl) {
    throw new Error("WebGL2 unavailable");
  }

  const program = createProgram(gl);
  gl.useProgram(program);

  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 3, -1, -1, 3]),
    gl.STATIC_DRAW,
  );

  const positionLoc = gl.getAttribLocation(program, "aPosition");
  gl.enableVertexAttribArray(positionLoc);
  gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);

  const uResolution = gl.getUniformLocation(program, "uResolution");
  const uTime = gl.getUniformLocation(program, "uTime");
  const uStrobeRate = gl.getUniformLocation(program, "uStrobeRate");
  const uOpacity = gl.getUniformLocation(program, "uOpacity");

  gl.uniform1f(uStrobeRate, NAV_FLASH_STROBE_RATE);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

  const resize = () => {
    // Half-res overlay — CSS scales up; big win for fill-rate
    const dpr = Math.min(window.devicePixelRatio || 1, 1.25);
    const scale = 0.5;
    const width = Math.max(1, Math.floor(window.innerWidth * dpr * scale));
    const height = Math.max(1, Math.floor(window.innerHeight * dpr * scale));
    canvas.width = width;
    canvas.height = height;
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;
    gl.viewport(0, 0, width, height);
    gl.uniform2f(uResolution, width, height);
  };

  resize();

  const render = (time: number, opacity: number) => {
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform1f(uTime, time);
    gl.uniform1f(uOpacity, opacity);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };

  const dispose = () => {
    gl.deleteBuffer(buffer);
    gl.deleteProgram(program);
  };

  return { render, resize, dispose };
}
