// GLSL TOP — Estrella 3D raymarch + lluvia de estrellas de fondo
//
// Uniforms principales:
//   u_resolution, u_time
//   u_translation, u_rotation, u_scale
//   starOuter, starInner, thickness
//   halftoneScale, halftoneIntensity, halftoneDepthInfluence
//
// Lluvia de estrellas (fondo transparente):
//   starRainAmount   — intensidad / densidad (0 = off, 1 = denso)
//   starRainSpeed    — velocidad de caída
//   starRainSize     — tamaño relativo de cada estrella
//   starRainLayers   — capas superpuestas (1–4, más profundidad)
//   starRainBrightness — brillo base de la lluvia (0–1)

uniform vec2 u_resolution;
uniform float u_time;

// --- TRANSFORMACIONES ---
uniform vec3 u_translation;
uniform vec3 u_rotation;
uniform vec3 u_scale;

// --- CONTROLES ESTRELLA ---
uniform float starOuter;
uniform float starInner;
uniform float thickness;

// --- CONTROLES HALFTONE ---
uniform float halftoneScale;
uniform float halftoneIntensity;
uniform float halftoneDepthInfluence;

// --- CONTROLES LLUVIA DE ESTRELLAS ---
uniform float starRainAmount;
uniform float starRainSpeed;
uniform float starRainSize;
uniform float starRainLayers;
uniform float starRainBrightness;

out vec4 fragColor;

// ---------------- UTIL ----------------
float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

// ---------------- ROTACIÓN ----------------
vec3 rotate(vec3 p, vec3 r) {
    float cx = cos(r.x), sx = sin(r.x);
    p.yz *= mat2(cx, -sx, sx, cx);
    float cy = cos(r.y), sy = sin(r.y);
    p.xz *= mat2(cy, -sy, sy, cy);
    float cz = cos(r.z), sz = sin(r.z);
    p.xy *= mat2(cz, -sz, sz, cz);
    return p;
}

// ---------------- HALFTONE MEJORADO ----------------
float halftone(vec2 uv, float scale, float brightness) {
    vec2 st = uv * scale;
    vec2 gv = fract(st) - 0.5;
    float d = length(gv);
    float radius = mix(0.5, 0.05, clamp(brightness, 0.0, 1.0));
    return smoothstep(radius, radius - 0.05, d);
}

// ---------------- STAR CUSTOM ----------------
float sdStar5_custom(vec2 p, float rOuter, float rInner) {
    const vec2 k1 = vec2(0.809016994375, -0.587785252292);
    const vec2 k2 = vec2(-k1.x, k1.y);
    p.x = abs(p.x);
    p -= 2.0 * max(dot(k1, p), 0.0) * k1;
    p -= 2.0 * max(dot(k2, p), 0.0) * k2;
    p.x = abs(p.x);
    p.y -= rOuter;
    vec2 ba = rInner * vec2(-k1.y, k1.x) - vec2(0.0, 1.0);
    float h = clamp(dot(p, ba) / dot(ba, ba), 0.0, rOuter);
    return length(p - ba * h) * sign(p.y * ba.x - p.x * ba.y);
}

// ---------------- LLUVIA DE ESTRELLAS ----------------
// Estrellas procedurales en pantalla que caen en capas.
float starRain(vec2 uv, float time) {
    if (starRainAmount <= 0.001) return 0.0;

    float rain = 0.0;
    int layers = int(clamp(starRainLayers, 1.0, 4.0));

    for (int layer = 0; layer < 4; layer++) {
        if (layer >= layers) break;

        float lf = float(layer);
        float density = mix(18.0, 42.0, starRainAmount) * (1.0 + lf * 0.35);
        float speed = starRainSpeed * (0.65 + lf * 0.2);
        float layerPhase = hash(vec2(lf, 17.3)) * 6.283185;

        vec2 st = uv * density;
        st.y += time * speed + layerPhase;

        vec2 id = floor(st);
        vec2 f = fract(st) - 0.5;

        float rnd = hash(id);
        float spawn = hash(id + vec2(7.1, 3.9));

        // Densidad: menos estrellas cuando starRainAmount es bajo
        if (spawn > starRainAmount) continue;

        float size = starRainSize * mix(0.35, 1.0, rnd) * (1.0 - lf * 0.12);
        float inner = size * mix(0.38, 0.48, rnd);

        // Pequeña rotación por estrella
        float ang = (rnd - 0.5) * 1.2 + time * (rnd - 0.5) * 0.4;
        float ca = cos(ang), sa = sin(ang);
        vec2 p = mat2(ca, -sa, sa, ca) * f;

        float d = sdStar5_custom(p, size, inner);
        float star = smoothstep(0.015, 0.0, d);

        // Parpadeo suave
        float twinkle = 0.75 + 0.25 * sin(time * (2.0 + rnd * 3.0) + rnd * 6.283185);
        float depth = 1.0 - lf * 0.22;

        rain = max(rain, star * twinkle * depth);
    }

    return clamp(rain * starRainBrightness, 0.0, 1.0);
}

// ---------------- MAP ----------------
float map(vec3 p) {
    p -= u_translation;
    p = rotate(p, u_rotation);
    vec3 s = max(u_scale, vec3(0.0001));
    p /= s;
    float d2 = sdStar5_custom(p.xy, starOuter, starInner);
    float dz = abs(p.z) - thickness;
    return max(d2, dz) * min(s.x, min(s.y, s.z));
}

// ---------------- NORMAL ----------------
vec3 getNormal(vec3 p) {
    float e = 0.001;
    vec2 h = vec2(e, 0.0);
    return normalize(vec3(
        map(p + h.xyy) - map(p - h.xyy),
        map(p + h.yxy) - map(p - h.yxy),
        map(p + h.yyx) - map(p - h.yyx)
    ));
}

// ---------------- RAYMARCH ----------------
float raymarch(vec3 ro, vec3 rd, out vec3 p) {
    float t = 0.0;
    for (int i = 0; i < 100; i++) {
        p = ro + rd * t;
        float d = map(p);
        if (d < 0.001) return t;
        if (t > 15.0) break;
        t += d;
    }
    return -1.0;
}

// ---------------- MAIN ----------------
void main() {
    vec2 uv = (gl_FragCoord.xy / u_resolution.xy) * 2.0 - 1.0;
    uv.x *= u_resolution.x / u_resolution.y;

    vec2 rainUv = gl_FragCoord.xy / u_resolution.xy;

    vec3 ro = vec3(0.0, 0.0, 4.0);
    vec3 rd = normalize(vec3(uv, -2.0));

    vec3 p;
    float t = raymarch(ro, rd, p);

    // Fondo: lluvia de estrellas con alfa proporcional
    if (t < 0.0) {
        float rain = starRain(rainUv, u_time);
        fragColor = vec4(vec3(rain), rain);
        return;
    }

    // --- ILUMINACIÓN PARA VOLUMEN ---
    vec3 n = getNormal(p);
    vec3 lightDir = normalize(vec3(1.0, 1.0, 1.0));

    float diff = max(dot(n, lightDir), 0.0);

    vec3 viewDir = normalize(ro - p);
    vec3 reflectDir = reflect(-lightDir, n);
    float spec = pow(max(dot(viewDir, reflectDir), 0.0), 32.0);

    float ambient = 0.15;
    float lighting = ambient + diff + spec * 0.5;

    // --- HALFTONE MEJORADO ---
    float depthFactor = smoothstep(0.0, 6.0, t);
    float scale = halftoneScale * (1.0 + depthFactor * halftoneDepthInfluence);
    float ht = halftone(rainUv, scale, diff + ambient);

    vec3 finalCol = vec3(lighting) * mix(1.0, ht, halftoneIntensity);

    fragColor = vec4(finalCol, 1.0);
}
