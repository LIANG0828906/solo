import * as THREE from 'three'

const vertexShader = `
uniform float uTime;
uniform float uMode;
uniform float uDissolveProgress;
uniform float uPointSize;
uniform float uCorrosionLevel;
uniform float uTemperature;
uniform float uLightAngle;
uniform vec3 uHighlightCenter;
uniform float uHighlightRadius;

attribute vec3 aColor;
attribute float aCurvature;
attribute float aIsArtifact;
attribute float aNoiseSeed;
attribute float aResidual;

varying vec3 vColor;
varying float vCurvature;
varying float vIsArtifact;
varying float vResidual;
varying float vDissolveNoise;
varying vec3 vWorldPos;
varying float vHighlight;

vec3 mod289v3(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289v4(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289v4(((x * 34.0) + 1.0) * x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v) {
  const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = mod289v3(i);
  vec4 p = permute(permute(permute(
    i.z + vec4(0.0, i1.z, i2.z, 1.0))
    + i.y + vec4(0.0, i1.y, i2.y, 1.0))
    + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.xxyy;
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m * m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
}

void main() {
  vec3 pos = position;

  float corrosionStrength = uCorrosionLevel / 100.0;
  float corrosionNoise = snoise(pos * (0.8 + corrosionStrength * 2.0) + uTime * 0.05);
  pos += vec3(0.0, 1.0, 0.0) * corrosionNoise * corrosionStrength * 0.15;

  float tempShift = uTemperature / 100.0;
  vec3 tempColor = aColor;
  tempColor.r += tempShift * 0.15;
  tempColor.g += tempShift * 0.02;
  tempColor.b -= tempShift * 0.1;

  float dissolveNoise = snoise(pos * 1.5 + aNoiseSeed);
  vDissolveNoise = dissolveNoise;

  vec3 lightDir = normalize(vec3(
    sin(uLightAngle / 100.0 * 1.5708),
    1.0,
    cos(uLightAngle / 100.0 * 1.5708) * 0.5
  ));

  float highlightDist = distance(pos, uHighlightCenter);
  vHighlight = (uHighlightRadius > 0.0 && highlightDist < uHighlightRadius)
    ? 1.0 - highlightDist / uHighlightRadius : 0.0;

  vColor = tempColor;
  vCurvature = aCurvature;
  vIsArtifact = aIsArtifact;
  vResidual = aResidual;
  vWorldPos = pos;

  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
  float sizeAtten = 250.0 / -mvPosition.z;
  gl_PointSize = uPointSize * sizeAtten * (1.0 + vHighlight * 0.5);
  gl_Position = projectionMatrix * mvPosition;
}
`

const fragmentShader = `
uniform float uTime;
uniform float uMode;
uniform float uDissolveProgress;
uniform float uCorrosionLevel;
uniform float uTemperature;
uniform float uLightAngle;

varying vec3 vColor;
varying float vCurvature;
varying float vIsArtifact;
varying float vResidual;
varying float vDissolveNoise;
varying vec3 vWorldPos;
varying float vHighlight;

vec3 mod289v3(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289v4(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289v4(((x * 34.0) + 1.0) * x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v) {
  const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = mod289v3(i);
  vec4 p = permute(permute(permute(
    i.z + vec4(0.0, i1.z, i2.z, 1.0))
    + i.y + vec4(0.0, i1.y, i2.y, 1.0))
    + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.xxyy;
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m * m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
}

float causticPattern(vec2 uv, float time) {
  float c = 0.0;
  for (int i = 0; i < 3; i++) {
    float fi = float(i);
    vec2 offset = vec2(
      sin(time * 0.3 + fi * 2.1) * 0.5,
      cos(time * 0.4 + fi * 1.7) * 0.5
    );
    c += sin((uv.x + offset.x) * 5.0) * sin((uv.y + offset.y) * 5.0);
    c += sin((uv.x * 1.3 - offset.y) * 4.0 + time * 0.2) * cos((uv.y * 1.3 + offset.x) * 4.0);
  }
  return c / 6.0;
}

void main() {
  float dist = length(gl_PointCoord - vec2(0.5));
  if (dist > 0.5) discard;

  float dissolveThreshold = uDissolveProgress * 1.5 - 0.25;
  if (vDissolveNoise < dissolveThreshold && uDissolveProgress > 0.0) discard;

  vec3 finalColor = vColor;

  if (uMode < 0.5) {
    finalColor = vColor;
    if (vIsArtifact > 1.5) {
      finalColor = mix(vColor, vec3(1.0, 0.85, 0.2), 0.4);
    }
  } else if (uMode < 1.5) {
    if (vIsArtifact > 0.5) {
      vec3 artifactColor = mix(
        vec3(1.0, 0.7, 0.0),
        vec3(1.0, 0.3, 0.0),
        vCurvature * 3.0
      );
      finalColor = mix(vColor, artifactColor, 0.75);
      finalColor += vec3(0.15, 0.1, 0.0) * sin(uTime * 3.0 + vWorldPos.x * 5.0) * 0.3;
    } else {
      finalColor = vColor * 0.4;
    }
    if (vHighlight > 0.0) {
      finalColor = mix(finalColor, vec3(0.0, 1.0, 0.8), vHighlight * 0.6);
    }
  } else {
    float corrosionStrength = uCorrosionLevel / 100.0;
    float corrosionNoise = snoise(vWorldPos * (2.0 + corrosionStrength * 3.0) + uTime * 0.02);
    float corrosionPattern = pow(abs(corrosionNoise), 0.5 + (1.0 - corrosionStrength) * 2.0);
    vec3 corrosionColor = mix(
      vec3(0.545, 0.271, 0.075),
      vec3(0.35, 0.25, 0.15),
      corrosionPattern
    );
    finalColor = mix(vColor, corrosionColor, corrosionStrength * 0.7 * (0.5 + corrosionPattern * 0.5));
    float erosionDetail = snoise(vWorldPos * 8.0) * 0.5 + 0.5;
    finalColor += vec3(0.05, 0.02, 0.0) * erosionDetail * corrosionStrength;
  }

  vec2 causticUv = vWorldPos.xz * 0.3;
  float caustic = causticPattern(causticUv, uTime);
  caustic = max(caustic, 0.0);
  caustic = pow(caustic, 1.5);
  float lightAngleFactor = uLightAngle / 100.0;
  finalColor += vec3(0.08, 0.18, 0.22) * caustic * (0.5 + lightAngleFactor * 0.5);

  vec3 lightDir = normalize(vec3(
    sin(lightAngleFactor * 1.5708),
    1.0,
    cos(lightAngleFactor * 1.5708) * 0.5
  ));
  float NdotL = max(dot(normalize(vWorldPos + vec3(0.0, 1.0, 0.0)), lightDir), 0.0);
  float shadowSharpness = 1.0 + lightAngleFactor * 8.0;
  float shadow = pow(NdotL, shadowSharpness);
  finalColor *= 0.4 + 0.6 * shadow;

  float alpha = 1.0 - smoothstep(0.3, 0.5, dist);
  if (vHighlight > 0.0) {
    alpha = max(alpha, vHighlight * 0.8);
  }

  float dissolveEdge = smoothstep(dissolveThreshold - 0.05, dissolveThreshold, vDissolveNoise);
  if (uDissolveProgress > 0.0 && uDissolveProgress < 1.0) {
    finalColor += vec3(0.2, 0.5, 0.6) * (1.0 - dissolveEdge) * 0.5;
  }

  gl_FragColor = vec4(finalColor, alpha * 0.95);
}
`

class EffectsManager {
  material: THREE.ShaderMaterial | null = null
  dissolveProgress = 0
  isDissolving = false
  dissolveStartTime = 0
  dissolveDuration = 0.8
  onDissolveComplete: (() => void) | null = null

  createMaterial(): THREE.ShaderMaterial {
    this.material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uMode: { value: 0 },
        uDissolveProgress: { value: 0 },
        uPointSize: { value: 3.0 },
        uCorrosionLevel: { value: 30 },
        uTemperature: { value: 25 },
        uLightAngle: { value: 50 },
        uHighlightCenter: { value: new THREE.Vector3(999, 999, 999) },
        uHighlightRadius: { value: 0 },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
    return this.material
  }

  startDissolve(onComplete: () => void): void {
    this.isDissolving = true
    this.dissolveStartTime = performance.now() / 1000
    this.dissolveProgress = 0
    this.onDissolveComplete = onComplete
  }

  update(time: number, params: {
    mode: number
    corrosion: number
    temperature: number
    lightAngle: number
    highlightCenter?: THREE.Vector3
    highlightRadius?: number
  }): void {
    if (this.isDissolving) {
      const elapsed = time - this.dissolveStartTime
      const t = Math.min(elapsed / this.dissolveDuration, 1.0)
      this.dissolveProgress = t < 0.5 ? t * 2 : 2 - t * 2
      if (t >= 1.0) {
        this.isDissolving = false
        this.dissolveProgress = 0
        if (this.onDissolveComplete) {
          this.onDissolveComplete()
          this.onDissolveComplete = null
        }
      }
    }

    if (this.material) {
      const u = this.material.uniforms
      u.uTime.value = time
      u.uMode.value = params.mode
      u.uCorrosionLevel.value = params.corrosion
      u.uTemperature.value = params.temperature
      u.uLightAngle.value = params.lightAngle
      u.uDissolveProgress.value = this.dissolveProgress
      if (params.highlightCenter) u.uHighlightCenter.value.copy(params.highlightCenter)
      if (params.highlightRadius !== undefined) u.uHighlightRadius.value = params.highlightRadius
    }
  }

  getVertexShader(): string { return vertexShader }
  getFragmentShader(): string { return fragmentShader }
}

export const effectsManager = new EffectsManager()
export default EffectsManager
