uniform vec3 uResolution;
uniform float uTime;
uniform vec2 uMouse;
uniform int uFractalType;
uniform int uIterations;
uniform float uEscapeRadius;
uniform float uPower;
uniform vec3 uJuliaConstant;
uniform float uAmbientOcclusion;
uniform bool uInternalColoring;
uniform vec3 uCamPos;
uniform vec3 uCamTarget;
uniform mat4 uCamRotation;
uniform vec3 uColor0;
uniform vec3 uColor1;
uniform vec3 uColor2;
uniform vec3 uColor3;

#define MAX_STEPS 128
#define MAX_DIST 20.0
#define SURF_DIST 0.001
#define PI 3.14159265359

mat3 rotateX(float a) {
    float c = cos(a), s = sin(a);
    return mat3(1, 0, 0, 0, c, -s, 0, s, c);
}

mat3 rotateY(float a) {
    float c = cos(a), s = sin(a);
    return mat3(c, 0, s, 0, 1, 0, -s, 0, c);
}

float mandelbulbDE(vec3 pos, int iterations, float escapeRadius, float power) {
    vec3 z = pos;
    float dr = 1.0;
    float r = 0.0;
    for (int i = 0; i < MAX_STEPS; i++) {
        if (i >= iterations) break;
        r = length(z);
        if (r > escapeRadius) break;
        float theta = acos(clamp(z.z / r, -1.0, 1.0));
        float phi = atan(z.y, z.x);
        dr = pow(r, power - 1.0) * power * dr + 1.0;
        float zr = pow(r, power);
        theta = theta * power;
        phi = phi * power;
        z = zr * vec3(sin(theta) * cos(phi), sin(phi) * sin(theta), cos(theta));
        z += pos;
    }
    return 0.5 * log(r) * r / dr;
}

float juliaDE(vec3 pos, int iterations, float escapeRadius, float power, vec3 c) {
    vec3 z = pos;
    float dr = 1.0;
    float r = 0.0;
    for (int i = 0; i < MAX_STEPS; i++) {
        if (i >= iterations) break;
        r = length(z);
        if (r > escapeRadius) break;
        float theta = acos(clamp(z.z / r, -1.0, 1.0));
        float phi = atan(z.y, z.x);
        dr = pow(r, power - 1.0) * power * dr + 1.0;
        float zr = pow(r, power);
        theta = theta * power;
        phi = phi * power;
        z = zr * vec3(sin(theta) * cos(phi), sin(phi) * sin(theta), cos(theta));
        z += c;
    }
    return 0.5 * log(r) * r / dr;
}

float quaternionDE(vec3 pos, int iterations, float escapeRadius, float power) {
    vec4 z = vec4(pos, 0.0);
    vec4 c = vec4(0.3, 0.5, 0.4, 0.2);
    float dr = 1.0;
    float r = 0.0;
    for (int i = 0; i < MAX_STEPS; i++) {
        if (i >= iterations) break;
        r = length(z);
        if (r > escapeRadius) break;
        vec4 z2 = vec4(
            z.x * z.x - z.y * z.y - z.z * z.z - z.w * z.w,
            2.0 * z.x * z.y,
            2.0 * z.x * z.z,
            2.0 * z.x * z.w
        );
        z = z2 + c;
        dr = pow(r, power - 1.0) * power * dr + 1.0;
    }
    return 0.5 * log(r) * r / dr;
}

float getDE(vec3 p) {
    if (uFractalType == 0) {
        return mandelbulbDE(p, uIterations, uEscapeRadius, uPower);
    } else if (uFractalType == 1) {
        return juliaDE(p, uIterations, uEscapeRadius, uPower, uJuliaConstant);
    } else {
        return quaternionDE(p, uIterations, uEscapeRadius, uPower);
    }
}

vec3 getNormal(vec3 p) {
    vec2 e = vec2(SURF_DIST, 0.0);
    return normalize(vec3(
        getDE(p + e.xyy) - getDE(p - e.xyy),
        getDE(p + e.yxy) - getDE(p - e.yxy),
        getDE(p + e.yyx) - getDE(p - e.yyx)
    ));
}

float softShadow(vec3 ro, vec3 rd, float mint, float maxt, float k) {
    float res = 1.0;
    for (float t = mint; t < maxt;) {
        vec3 p = ro + rd * t;
        float h = getDE(p);
        if (h < 0.001) return 0.0;
        res = min(res, k * h / t);
        t += h;
    }
    return clamp(res, 0.0, 1.0);
}

float ambientOcclusion(vec3 p, vec3 n, float strength) {
    float occ = 0.0;
    float sca = 1.0;
    for (int i = 0; i < 5; i++) {
        float h = 0.01 + 0.1 * float(i) * float(i);
        float d = getDE(p + n * h);
        occ += (h - d) * sca;
        sca *= 0.85;
    }
    return clamp(1.0 - strength * occ, 0.0, 1.0);
}

vec3 getColor(float t) {
    if (t < 0.33) {
        float f = t / 0.33;
        return mix(uColor0, uColor1, f);
    } else if (t < 0.66) {
        float f = (t - 0.33) / 0.33;
        return mix(uColor1, uColor2, f);
    } else {
        float f = (t - 0.66) / 0.34;
        return mix(uColor2, uColor3, f);
    }
}

void main() {
    vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution.xy) / uResolution.y;

    vec3 ro = uCamPos;
    vec3 target = uCamTarget;

    vec3 forward = normalize(target - ro);
    vec3 right = normalize(cross(vec3(0.0, 1.0, 0.0), forward));
    vec3 up = cross(forward, right);

    vec3 rd = normalize(forward + uv.x * right + uv.y * up);
    rd = (uCamRotation * vec4(rd, 0.0)).xyz;

    float t = 0.0;
    float d = 0.0;
    vec3 col = vec3(0.01, 0.005, 0.02);
    float glow = 0.0;
    int stepsTaken = 0;

    for (int i = 0; i < MAX_STEPS; i++) {
        stepsTaken = i;
        vec3 p = ro + rd * t;
        d = getDE(p);
        if (d < SURF_DIST * t) break;
        if (t > MAX_DIST) break;
        glow += exp(-d * 3.0) * 0.02;
        t += d * 0.9;
    }

    if (t < MAX_DIST) {
        vec3 p = ro + rd * t;
        vec3 n = getNormal(p);
        vec3 lightDir = normalize(vec3(0.5, 0.8, 0.3));
        vec3 lightCol = vec3(1.0, 0.95, 0.9);

        float diff = max(dot(n, lightDir), 0.0);
        float shadow = softShadow(p + n * 0.02, lightDir, 0.01, 3.0, 16.0);
        float ao = ambientOcclusion(p, n, uAmbientOcclusion);

        float colorT = float(stepsTaken) / float(uIterations);
        if (uInternalColoring) {
            colorT = clamp(abs(sin(t * 0.5 + colorT * 5.0)), 0.0, 1.0);
        }
        vec3 baseCol = getColor(colorT);

        vec3 h = normalize(lightDir - rd);
        float spec = pow(max(dot(n, h), 0.0), 32.0);

        col = baseCol * (0.3 + 0.7 * diff * shadow) * ao;
        col += spec * shadow * 0.5 * lightCol;
        col += glow * vec3(0.3, 0.5, 1.0) * 0.5;

        float rim = pow(1.0 - abs(dot(n, rd)), 3.0);
        col += rim * baseCol * 0.3;
    } else {
        col += glow * vec3(0.2, 0.3, 0.6);
        float star = pow(max(0.0, sin(uv.x * 100.0 + uTime * 0.1) * sin(uv.y * 100.0 + uTime * 0.05)), 20.0);
        col += star * 0.3;
    }

    col = pow(col, vec3(0.4545));

    gl_FragColor = vec4(col, 1.0);
}
