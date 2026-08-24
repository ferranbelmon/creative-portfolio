export const NAV_FLASH_PEAK_S = 0.32;
export const NAV_FLASH_FADE_START_S = 0.48;
export const NAV_FLASH_END_S = 0.68;
export const NAV_FLASH_STROBE_RATE = 11;
export const NAV_FLASH_CIRCLE_COUNT = 3;

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
#define BLAST_SCALE 0.42
// Master strength for god rays (try 0.4 … 2.0)
#define GODRAYS_POWER 1.0

float hash11(float p) {
  return fract(sin(p * 127.1) * 43758.5453123);
}

vec2 flashCenter(int i, float pulseIndex) {
  float fi = float(i);
  float a = hash11(fi + pulseIndex * 13.7);
  float b = hash11(fi + pulseIndex * 29.3 + 4.1);
  return vec2(a * 2.0 - 1.0, b * 2.0 - 1.0) * vec2(0.55, 0.4);
}

float circ(vec2 p, float phase) {
  float r = sqrt(length(p));
  return abs(2.6 * r * phase);
}

float circleScalar(vec2 delta, float phase) {
  float rz = max(abs(circ(delta * BLAST_SCALE, phase)), 0.012);
  vec3 pulse = vec3(0.28 / rz);
  return clamp(max(pulse.r, max(pulse.g, pulse.b)) / 5.5, 0.0, 1.0);
}

vec3 circleChromatic(vec2 uv, vec2 center, float phase) {
  vec2 delta = uv - center;
  float dist = length(delta);
  vec2 dir = delta / max(dist, 1e-4);

  float scalar = circleScalar(delta, phase);
  float edgeMask =
    smoothstep(0.08, 0.36, scalar) * (1.0 - smoothstep(0.55, 0.98, scalar));

  // Pure RGB offset — magenta/cyan fringe, no red tint overlay
  float aber = (0.028 + edgeMask * 0.1) * smoothstep(0.02, 0.85, dist);

  float hitR = circleScalar(delta - dir * aber * 2.0, phase);
  float hitG = circleScalar(delta, phase);
  float hitB = circleScalar(delta + dir * aber * 2.0, phase);

  vec3 chroma = vec3(hitR, hitG, hitB);
  // Soften toward white so the core stays cool, not tinted
  float luma = (hitR + hitG + hitB) / 3.0;
  chroma = mix(chroma, vec3(luma), 0.28);

  return clamp(chroma, 0.0, 1.0);
}

float godRays(vec2 uv, vec2 center, float phase, float mixAmt) {
  vec2 delta = uv - center;
  float dist = length(delta);
  vec2 dir = delta / max(dist, 1e-4);

  // Radial light march toward the blast core
  float march = 0.0;
  for (int i = 0; i < 16; i++) {
    float t = float(i) / 15.0;
    vec2 sampleUv = uv - dir * t * 1.45;
    float sampleHit = circleScalar(sampleUv - center, phase);
    march += sampleHit * (1.0 - t * 0.55);
  }
  march = clamp(march / 12.0, 0.0, 1.0);

  float angle = atan(delta.y, delta.x);
  float spokesA = pow(abs(sin(angle * 7.0 + phase * 18.849)), 2.1);
  float spokesB = pow(abs(sin(angle * 13.0 - phase * 9.425)), 3.4);
  float spokes = max(spokesA, spokesB * 0.75);

  float falloff = exp(-dist * 0.55) * (0.18 + 0.82 * spokes);
  float shaft = falloff * (0.35 + 0.65 * march);

  // Soft bloom halo so rays read even without a hard spoke
  float halo = exp(-dist * 1.1) * circleScalar(delta, phase) * 0.45;

  return clamp((shaft * 1.55 + halo) * mixAmt * GODRAYS_POWER, 0.0, 1.0);
}

void main() {
  vec2 uv = (gl_FragCoord.xy - uResolution * 0.5) / uResolution.y;

  float pulseIndex = floor(uTime * uStrobeRate);
  float phase = fract(1.0 - uTime * uStrobeRate);

  vec3 strobeCol = vec3(0.0);
  float strobe = 0.0;
  float rays = 0.0;
  // God rays build through the flash and peak near the end
  float rayMix = smoothstep(0.08, 0.28, uTime) * (1.0 - smoothstep(0.55, 0.68, uTime) * 0.25);

  for (int i = 0; i < FLASH_COUNT; i++) {
    vec2 center = flashCenter(i, pulseIndex);
    vec3 hitCol = circleChromatic(uv, center, phase);
    float hit = max(hitCol.r, max(hitCol.g, hitCol.b));
    strobeCol = max(strobeCol, hitCol);
    strobe = max(strobe, hit);
    rays = max(rays, godRays(uv, center, phase, rayMix));
  }

  float wash = smoothstep(0.1, 0.42, uTime);
  vec3 col = mix(strobeCol, COL, wash * 0.16);
  col = max(col, COL * rays);
  col += COL * rays * 0.55;

  float intensity = clamp(max(strobe, max(wash * 0.92, rays * 0.85)), 0.0, 1.0);
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
