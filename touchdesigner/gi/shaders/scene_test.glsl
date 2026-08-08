// GLSL TOP — Escena de prueba (opcional)
// Genera emisores simples para probar el pipeline sin otra fuente.
// Sustituye este TOP por tu Render TOP, imagen, composite, etc.

uniform float uTime;

out vec4 fragColor;

float sdCircle(vec2 p, vec2 center, float r) {
  return length(p - center) - r;
}

float sdBox(vec2 p, vec2 center, vec2 halfSize) {
  vec2 d = abs(p - center) - halfSize;
  return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
}

void main() {
  vec2 uv = vUV.st;
  vec2 p = uv - 0.5;

  float t = uTime * 0.4;
  vec2 c1 = vec2(cos(t) * 0.22, sin(t) * 0.18);
  vec2 c2 = vec2(cos(t * 1.3 + 2.0) * 0.28, sin(t * 0.9 + 1.0) * 0.25);

  float d1 = sdCircle(p, c1, 0.07);
  float d2 = sdCircle(p, c2, 0.05);
  float d3 = sdBox(p, vec2(-0.15, 0.1), vec2(0.12, 0.04));

  float d = min(d1, min(d2, d3));

  if (d < 0.0) {
    vec3 warm = vec3(1.0, 0.82, 0.25);
    vec3 cool = vec3(0.3, 0.7, 1.0);
    vec3 col = mix(warm, cool, smoothstep(-0.07, 0.0, d1));
    fragColor = vec4(col, 1.0);
  } else {
    fragColor = vec4(0.0);
  }
}
