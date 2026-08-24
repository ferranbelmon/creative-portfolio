export const NAV_FLASH_PEAK_S = 0.32;
export const NAV_FLASH_FADE_START_S = 0.48;
export const NAV_FLASH_END_S = 0.68;
export const NAV_FLASH_STROBE_RATE = 11;
export const NAV_FLASH_CIRCLE_COUNT = 6;

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

float hash11(float p) {
  return fract(sin(p * 127.1) * 43758.5453123);
}

vec2 flashCenter(int i, float pulseIndex) {
  float fi = float(i);
  float a = hash11(fi + pulseIndex * 13.7);
  float b = hash11(fi + pulseIndex * 29.3 + 4.1);
  return vec2(a * 2.0 - 1.0, b * 2.0 - 1.0) * vec2(0.72, 0.52);
}

float circ(vec2 p, float phase) {
  float r = sqrt(length(p));
  return abs(4.0 * r * phase);
}

float circleScalar(vec2 delta, float phase) {
  float rz = max(abs(circ(delta, phase)), 0.015);
  vec3 pulse = vec3(0.2 / rz);
  return clamp(max(pulse.r, max(pulse.g, pulse.b)) / 7.0, 0.0, 1.0);
}

vec3 circleChromatic(vec2 uv, vec2 center, float phase) {
  vec2 delta = uv - center;
  float dist = length(delta);
  vec2 dir = delta / max(dist, 1e-4);

  float scalar = circleScalar(delta, phase);
  float edgeMask =
    smoothstep(0.1, 0.38, scalar) * (1.0 - smoothstep(0.58, 0.98, scalar));
  float aber = (0.008 + edgeMask * 0.024) * smoothstep(0.04, 0.55, dist);

  vec2 deltaR = delta - dir * aber * 1.35;
  vec2 deltaG = delta;
  vec2 deltaB = delta + dir * aber * 1.35;

  float rzR = max(abs(circ(deltaR, phase)), 0.015);
  float rzG = max(abs(circ(deltaG, phase)), 0.025);
  float rzB = max(abs(circ(deltaB, phase)), 0.035);

  vec3 pulse = vec3(0.2 / rzR, 0.2 / rzG, 0.2 / rzB);
  vec3 chroma = clamp(pulse / 7.0, 0.0, 1.0);

  vec3 fringe = vec3(1.0, 0.72, 0.45) * edgeMask * 0.22;
  chroma.r += fringe.r;
  chroma.b += fringe.b * 0.85;

  return chroma;
}

float godRays(vec2 uv, vec2 center, float phase, float mixAmt) {
  vec2 delta = uv - center;
  float dist = length(delta);
  vec2 dir = delta / max(dist, 1e-4);

  float march = 0.0;
  for (int i = 0; i < 10; i++) {
    float t = float(i) / 9.0;
    vec2 sampleDelta = (uv - dir * t * 0.62) - center;
    float sampleHit = circleScalar(sampleDelta, phase);
    march += sampleHit * (1.0 - t * 0.75);
  }
  march = clamp(march / 9.5, 0.0, 1.0);

  float angle = atan(delta.y, delta.x);
  float spokes = pow(abs(sin(angle * 11.0 + phase * 12.566)), 3.2);
  float radial = exp(-dist * 1.65) * (0.28 + 0.72 * spokes);

  return march * radial * mixAmt;
}

void main() {
  vec2 uv = (gl_FragCoord.xy - uResolution * 0.5) / uResolution.y;

  float pulseIndex = floor(uTime * uStrobeRate);
  float phase = fract(1.0 - uTime * uStrobeRate);

  vec3 strobeCol = vec3(0.0);
  float strobe = 0.0;
  float rays = 0.0;
  float rayMix = smoothstep(0.24, 0.52, uTime);

  for (int i = 0; i < FLASH_COUNT; i++) {
    vec2 center = flashCenter(i, pulseIndex);
    vec3 hitCol = circleChromatic(uv, center, phase);
    float hit = max(hitCol.r, max(hitCol.g, hitCol.b));
    strobeCol = max(strobeCol, hitCol);
    strobe = max(strobe, hit);
    rays = max(rays, godRays(uv, center, phase, rayMix));
  }

  float wash = smoothstep(0.1, 0.42, uTime);
  vec3 col = mix(strobeCol, COL, wash * 0.28);
  col = max(col, COL * rays * 0.62);

  float intensity = clamp(max(strobe, max(wash * 0.92, rays * 0.5)), 0.0, 1.0);
  fragColor = vec4(col, intensity * uOpacity);
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
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.max(1, Math.floor(window.innerWidth * dpr));
    const height = Math.max(1, Math.floor(window.innerHeight * dpr));
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
