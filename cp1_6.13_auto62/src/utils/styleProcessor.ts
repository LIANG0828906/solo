import * as THREE from 'three';
import type { StyleType } from '@/store/useAppStore';

export interface StyleConfig {
  vertexShader: string;
  fragmentShader: string;
  uniforms: Record<string, { value: unknown }>;
}

const VERTEX_HEADER = `
uniform float uDetailIntensity;
uniform float uTransitionProgress;
uniform float uTime;

attribute vec3 aBarycentric;

varying vec3 vNormal;
varying vec3 vPosition;
varying vec3 vWorldPosition;
varying vec3 vBarycentric;
varying vec2 vUv;
varying float vDisplacement;

vec3 computeSmoothNormal(vec3 pos) {
  return normalize(normalMatrix * normal);
}

float hash(vec3 p) {
  p = fract(p * 0.3183099 + vec3(0.71, 0.113, 0.419));
  p *= 17.0;
  return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}

float noise3(vec3 x) {
  vec3 p = floor(x);
  vec3 f = fract(x);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(hash(p + vec3(0,0,0)), hash(p + vec3(1,0,0)), f.x),
                 mix(hash(p + vec3(0,1,0)), hash(p + vec3(1,1,0)), f.x), f.y),
             mix(mix(hash(p + vec3(0,0,1)), hash(p + vec3(1,0,1)), f.x),
                 mix(hash(p + vec3(0,1,1)), hash(p + vec3(1,1,1)), f.x), f.y), f.z);
}
`;

const VERTEX_DISPLACEMENT = `
  vec3 transformedNormal = normalize(normalMatrix * normal);
  
  float intensityNorm = uDetailIntensity / 100.0;
  
  float edgeFactor = 0.0;
  float bcMin = min(min(aBarycentric.x, aBarycentric.y), aBarycentric.z);
  if (bcMin < 0.1) {
    edgeFactor = 1.0 - bcMin / 0.1;
  }
  
  float displacement = 0.0;
  
  if (intensityNorm < 0.5) {
    float smoothAmount = (0.5 - intensityNorm) * 2.0;
    float n = noise3(position * 4.0 + uTime * 0.1);
    displacement = -smoothAmount * 0.06 * (0.5 + n * 0.5);
  } else {
    float edgeAmount = (intensityNorm - 0.5) * 2.0;
    float n = noise3(position * 12.0);
    displacement = edgeAmount * 0.08 * (edgeFactor * 0.7 + n * 0.3);
  }
  
  vec3 displaced = position + transformedNormal * displacement;
  vDisplacement = displacement;
  
  gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
`;

const VERTEX_MAIN = `
  vNormal = normalize(normalMatrix * normal);
  vPosition = position;
  vec4 worldPos = modelMatrix * vec4(position, 1.0);
  vWorldPosition = worldPos.xyz;
  vBarycentric = aBarycentric;
  vUv = uv;
  ${VERTEX_DISPLACEMENT}
`;

const LOWPOLY_FRAG = `
uniform vec3 uBaseColor;
uniform vec3 uAccentColor;
uniform float uDetailIntensity;
uniform float uTransitionProgress;

varying vec3 vNormal;
varying vec3 vPosition;
varying vec3 vWorldPosition;
varying vec3 vBarycentric;
varying float vDisplacement;

void main() {
  vec3 lightDir = normalize(vec3(1.0, 1.0, 0.5));
  float NdotL = dot(vNormal, lightDir);
  
  float intensityNorm = uDetailIntensity / 100.0;
  float steps = mix(2.0, 7.0, intensityNorm);
  float quantized = floor(NdotL * steps) / steps;
  quantized = max(quantized, 0.15);
  
  vec3 color = mix(uBaseColor, uAccentColor, quantized * 0.5 + intensityNorm * 0.2);
  color *= (0.4 + quantized * 0.6);
  
  vec3 viewDir = normalize(cameraPosition - vWorldPosition);
  float edge = dot(vNormal, viewDir);
  if (edge < 0.2 + intensityNorm * 0.1) {
    color = uAccentColor * 0.4;
  }
  
  float dispHighlight = abs(vDisplacement) * 8.0;
  color += uAccentColor * dispHighlight * intensityNorm;
  
  gl_FragColor = vec4(color, 1.0);
}
`;

const TOON_FRAG = `
uniform vec3 uBaseColor;
uniform float uDetailIntensity;
uniform float uTransitionProgress;

varying vec3 vNormal;
varying vec3 vWorldPosition;
varying vec3 vBarycentric;
varying float vDisplacement;

void main() {
  vec3 lightDir = normalize(vec3(1.0, 1.0, 0.5));
  float NdotL = max(dot(vNormal, lightDir), 0.0);
  
  float intensityNorm = uDetailIntensity / 100.0;
  float levels = mix(3.0, 6.0, intensityNorm);
  float toon = floor(NdotL * levels) / levels;
  toon = max(toon, 0.2);
  
  vec3 color = uBaseColor * (0.3 + toon * 0.7);
  
  vec3 viewDir = normalize(cameraPosition - vWorldPosition);
  float edge = dot(vNormal, viewDir);
  if (edge < 0.18 + intensityNorm * 0.15) {
    color = vec3(0.03, 0.02, 0.08);
  }
  
  vec3 halfDir = normalize(lightDir + viewDir);
  float spec = pow(max(dot(vNormal, halfDir), 0.0), 48.0);
  color += vec3(1.0, 0.95, 0.85) * spec * 0.5 * intensityNorm;
  
  float dispHighlight = abs(vDisplacement) * 10.0;
  color += uBaseColor * dispHighlight * intensityNorm * 0.5;
  
  gl_FragColor = vec4(color, 1.0);
}
`;

const WIREFRAME_FRAG = `
uniform vec3 uBaseColor;
uniform float uDetailIntensity;
uniform float uTransitionProgress;

varying vec3 vNormal;
varying vec3 vWorldPosition;
varying vec3 vBarycentric;
varying float vDisplacement;

float edgeFactorTri() {
  vec3 d = fwidth(vBarycentric);
  vec3 a3 = smoothstep(vec3(0.0), d * 1.5, vBarycentric);
  return min(min(a3.x, a3.y), a3.z);
}

void main() {
  float intensityNorm = uDetailIntensity / 100.0;
  float edgeThickness = mix(0.8, 3.0, intensityNorm);
  float edge = 1.0 - edgeFactorTri();
  edge = smoothstep(0.0, edgeThickness / 3.0, edge);
  
  vec3 viewDir = normalize(cameraPosition - vWorldPosition);
  float fresnel = pow(1.0 - max(dot(vNormal, viewDir), 0.0), 2.0);
  
  vec3 color = uBaseColor * fresnel * (0.4 + intensityNorm * 0.4);
  color += uBaseColor * edge * (0.6 + intensityNorm * 0.6);
  
  float alpha = 0.15 + edge * 0.75 + fresnel * 0.15;
  alpha = min(alpha, 1.0);
  
  float dispGlow = abs(vDisplacement) * 12.0;
  color += uBaseColor * dispGlow * intensityNorm;
  
  gl_FragColor = vec4(color, alpha);
}
`;

const WATERCOLOR_FRAG = `
uniform vec3 uBaseColor;
uniform vec3 uAccentColor;
uniform float uTime;

varying vec3 vNormal;
varying vec3 vPosition;
varying vec3 vWorldPosition;
varying vec3 vBarycentric;
varying vec2 vUv;
varying float vDisplacement;
varying float uDetailIntensity;
varying float uTransitionProgress;

float hash2(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float noise2(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash2(i);
  float b = hash2(i + vec2(1.0, 0.0));
  float c = hash2(i + vec2(0.0, 1.0));
  float d = hash2(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

void main() {
  float intensityNorm = uDetailIntensity / 100.0;
  
  vec3 lightDir = normalize(vec3(1.0, 1.0, 0.5));
  float NdotL = max(dot(vNormal, lightDir), 0.0);
  
  vec2 coord1 = vWorldPosition.xz * (1.5 + intensityNorm * 3.0) + uTime * 0.08;
  vec2 coord2 = vWorldPosition.xy * (2.0 + intensityNorm * 4.0) + uTime * 0.12;
  float n1 = noise2(coord1);
  float n2 = noise2(coord2);
  float combinedNoise = n1 * 0.6 + n2 * 0.4;
  
  vec3 color = mix(uAccentColor, uBaseColor, NdotL * 0.55 + combinedNoise * 0.45);
  
  float bleedingThreshold = 0.55 - intensityNorm * 0.15;
  if (combinedNoise > bleedingThreshold) {
    float bleedAmount = (combinedNoise - bleedingThreshold) / (1.0 - bleedingThreshold);
    color = mix(color, uAccentColor, bleedAmount * 0.5);
  }
  
  float edgeNoise = noise2(vWorldPosition.yz * 20.0);
  vec3 viewDir = normalize(cameraPosition - vWorldPosition);
  float fresnel = pow(1.0 - max(dot(vNormal, viewDir), 0.0), 2.5);
  color += uAccentColor * fresnel * 0.35;
  
  float paperGrain = noise2(vWorldPosition.xz * 80.0) * 0.08 - 0.04;
  color += paperGrain;
  
  float alpha = 0.65 + NdotL * 0.15 + combinedNoise * 0.2;
  alpha = min(alpha, 0.95);
  
  float dispTint = abs(vDisplacement) * 6.0;
  color += mix(uBaseColor, uAccentColor, 0.5) * dispTint * intensityNorm;
  
  gl_FragColor = vec4(color, alpha);
}
`;

const STYLE_CONFIGS: Record<StyleType, {
  baseColor: THREE.Color;
  accentColor: THREE.Color;
  frag: string;
}> = {
  lowpoly: {
    baseColor: new THREE.Color('#ff6f00'),
    accentColor: new THREE.Color('#ffab00'),
    frag: LOWPOLY_FRAG,
  },
  toon: {
    baseColor: new THREE.Color('#7c4dff'),
    accentColor: new THREE.Color('#b388ff'),
    frag: TOON_FRAG,
  },
  wireframe: {
    baseColor: new THREE.Color('#ffffff'),
    accentColor: new THREE.Color('#b0bec5'),
    frag: WIREFRAME_FRAG,
  },
  watercolor: {
    baseColor: new THREE.Color('#00bcd4'),
    accentColor: new THREE.Color('#448aff'),
    frag: WATERCOLOR_FRAG,
  },
};

const VERTEX_SHADER = `
${VERTEX_HEADER}

void main() {
  ${VERTEX_MAIN}
}
`;

export function processStyle(
  style: StyleType,
  detailIntensity: number,
  transitionProgress: number
): StyleConfig {
  const config = STYLE_CONFIGS[style];

  const uniforms: Record<string, { value: unknown }> = {
    uBaseColor: { value: config.baseColor.clone() },
    uAccentColor: { value: config.accentColor.clone() },
    uDetailIntensity: { value: detailIntensity },
    uTransitionProgress: { value: transitionProgress },
    uTime: { value: 0 },
  };

  return {
    vertexShader: VERTEX_SHADER,
    fragmentShader: config.frag,
    uniforms,
  };
}

export function addBarycentricCoordinates(geometry: THREE.BufferGeometry): THREE.BufferGeometry {
  if (geometry.index) {
    const indexAttr = geometry.index;
    const indexCount = indexAttr.count;
    const faceCountFromIndex = Math.floor(indexCount / 3);
    const barycentricArray = new Float32Array(indexCount * 3);

    for (let i = 0; i < faceCountFromIndex; i++) {
      for (let j = 0; j < 3; j++) {
        const vertexIndex = i * 3 + j;
        barycentricArray[vertexIndex * 3 + 0] = j === 0 ? 1.0 : 0.0;
        barycentricArray[vertexIndex * 3 + 1] = j === 1 ? 1.0 : 0.0;
        barycentricArray[vertexIndex * 3 + 2] = j === 2 ? 1.0 : 0.0;
      }
    }

    geometry.setAttribute('aBarycentric', new THREE.BufferAttribute(barycentricArray, 3));
  } else {
    const positionAttr = geometry.getAttribute('position');
    const count = positionAttr.count;
    const faceCount = Math.floor(count / 3);
    const barycentricArray = new Float32Array(count * 3);

    for (let i = 0; i < faceCount; i++) {
      barycentricArray[i * 9 + 0] = 1.0;
      barycentricArray[i * 9 + 1] = 0.0;
      barycentricArray[i * 9 + 2] = 0.0;
      barycentricArray[i * 9 + 3] = 0.0;
      barycentricArray[i * 9 + 4] = 1.0;
      barycentricArray[i * 9 + 5] = 0.0;
      barycentricArray[i * 9 + 6] = 0.0;
      barycentricArray[i * 9 + 7] = 0.0;
      barycentricArray[i * 9 + 8] = 1.0;
    }

    geometry.setAttribute('aBarycentric', new THREE.BufferAttribute(barycentricArray, 3));
  }

  return geometry;
}

export function getStyleColor(style: StyleType): string {
  const colors: Record<StyleType, string> = {
    lowpoly: '#ff8f00',
    toon: '#7c4dff',
    wireframe: '#ffffff',
    watercolor: '#00bcd4',
  };
  return colors[style];
}

export function getStyleHex(style: StyleType): number {
  const colors: Record<StyleType, number> = {
    lowpoly: 0xff8f00,
    toon: 0x7c4dff,
    wireframe: 0xffffff,
    watercolor: 0x00bcd4,
  };
  return colors[style];
}
