import * as THREE from 'three';
import type { StyleType } from '@/store/useAppStore';

export interface StyleConfig {
  vertexShader: string;
  fragmentShader: string;
  uniforms: Record<string, { value: unknown }>;
}

const LOWPOLY_VERT = `
varying vec3 vNormal;
varying vec3 vPosition;
varying vec3 vWorldPosition;

void main() {
  vNormal = normalize(normalMatrix * normal);
  vPosition = position;
  vec4 worldPos = modelMatrix * vec4(position, 1.0);
  vWorldPosition = worldPos.xyz;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const LOWPOLY_FRAG = `
uniform vec3 uBaseColor;
uniform vec3 uAccentColor;
uniform float uDetailIntensity;
uniform float uTransitionProgress;

varying vec3 vNormal;
varying vec3 vPosition;
varying vec3 vWorldPosition;

void main() {
  vec3 lightDir = normalize(vec3(1.0, 1.0, 0.5));
  float NdotL = dot(vNormal, lightDir);
  
  float steps = mix(2.0, 8.0, uDetailIntensity / 100.0);
  float quantized = floor(NdotL * steps) / steps;
  quantized = max(quantized, 0.1);
  
  vec3 color = mix(uBaseColor, uAccentColor, quantized * 0.6);
  color *= quantized;
  
  vec3 viewDir = normalize(cameraPosition - vWorldPosition);
  float edge = dot(vNormal, viewDir);
  if (edge < 0.15) {
    color = uAccentColor * 0.3;
  }
  
  gl_FragColor = vec4(color, 1.0);
}
`;

const TOON_VERT = `
varying vec3 vNormal;
varying vec3 vWorldPosition;

void main() {
  vNormal = normalize(normalMatrix * normal);
  vec4 worldPos = modelMatrix * vec4(position, 1.0);
  vWorldPosition = worldPos.xyz;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const TOON_FRAG = `
uniform vec3 uBaseColor;
uniform float uDetailIntensity;
uniform float uTransitionProgress;

varying vec3 vNormal;
varying vec3 vWorldPosition;

void main() {
  vec3 lightDir = normalize(vec3(1.0, 1.0, 0.5));
  float NdotL = max(dot(vNormal, lightDir), 0.0);
  
  float levels = mix(3.0, 6.0, uDetailIntensity / 100.0);
  float toon = floor(NdotL * levels) / levels;
  
  vec3 color = uBaseColor * toon;
  
  vec3 viewDir = normalize(cameraPosition - vWorldPosition);
  float edge = dot(vNormal, viewDir);
  if (edge < 0.2) {
    color = vec3(0.05);
  }
  
  float highlight = pow(max(dot(reflect(-lightDir, vNormal), viewDir), 0.0), 32.0);
  color += uBaseColor * highlight * 0.4;
  
  gl_FragColor = vec4(color, 1.0);
}
`;

const WIREFRAME_VERT = `
varying vec3 vNormal;
varying vec3 vWorldPosition;
varying vec3 vBarycentric;

attribute vec3 aBarycentric;

void main() {
  vNormal = normalize(normalMatrix * normal);
  vec4 worldPos = modelMatrix * vec4(position, 1.0);
  vWorldPosition = worldPos.xyz;
  vBarycentric = aBarycentric;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const WIREFRAME_FRAG = `
uniform vec3 uBaseColor;
uniform float uDetailIntensity;
uniform float uTransitionProgress;

varying vec3 vNormal;
varying vec3 vWorldPosition;
varying vec3 vBarycentric;

float edgeFactor() {
  vec3 d = fwidth(vBarycentric);
  vec3 a3 = smoothstep(vec3(0.0), d * 1.5, vBarycentric);
  return min(min(a3.x, a3.y), a3.z);
}

void main() {
  float edge = 1.0 - edgeFactor();
  float wireWidth = mix(0.5, 2.0, uDetailIntensity / 100.0);
  
  vec3 viewDir = normalize(cameraPosition - vWorldPosition);
  float fresnel = pow(1.0 - max(dot(vNormal, viewDir), 0.0), 2.0);
  
  vec3 color = uBaseColor * fresnel * 0.6;
  color += uBaseColor * edge * wireWidth;
  
  if (edge < 0.01 && fresnel < 0.1) {
    color = uBaseColor * 0.05;
  }
  
  gl_FragColor = vec4(color, 0.3 + edge * 0.7 + fresnel * 0.3);
}
`;

const WATERCOLOR_VERT = `
varying vec3 vNormal;
varying vec3 vPosition;
varying vec3 vWorldPosition;
varying vec2 vUv;

void main() {
  vNormal = normalize(normalMatrix * normal);
  vPosition = position;
  vec4 worldPos = modelMatrix * vec4(position, 1.0);
  vWorldPosition = worldPos.xyz;
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const WATERCOLOR_FRAG = `
uniform vec3 uBaseColor;
uniform vec3 uAccentColor;
uniform float uDetailIntensity;
uniform float uTransitionProgress;
uniform float uTime;

varying vec3 vNormal;
varying vec3 vPosition;
varying vec3 vWorldPosition;
varying vec2 vUv;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

void main() {
  vec3 lightDir = normalize(vec3(1.0, 1.0, 0.5));
  float NdotL = max(dot(vNormal, lightDir), 0.0);
  
  vec2 noiseCoord = vWorldPosition.xz * 2.0 + uTime * 0.1;
  float n = noise(noiseCoord) * noise(noiseCoord * 2.3);
  
  float detailScale = mix(1.0, 4.0, uDetailIntensity / 100.0);
  n *= detailScale;
  
  vec3 color = mix(uAccentColor, uBaseColor, NdotL * 0.7 + n * 0.3);
  
  float bleeding = noise(vWorldPosition.xz * 8.0 + uTime * 0.05);
  if (bleeding > 0.6) {
    color = mix(color, uAccentColor, (bleeding - 0.6) * 2.0);
  }
  
  float alpha = 0.7 + NdotL * 0.2 + n * 0.1;
  
  vec3 viewDir = normalize(cameraPosition - vWorldPosition);
  float fresnel = pow(1.0 - max(dot(vNormal, viewDir), 0.0), 3.0);
  color += uAccentColor * fresnel * 0.3;
  
  gl_FragColor = vec4(color, alpha);
}
`;

const STYLE_CONFIGS: Record<StyleType, { baseColor: THREE.Color; accentColor: THREE.Color; vert: string; frag: string }> = {
  lowpoly: {
    baseColor: new THREE.Color('#ff6f00'),
    accentColor: new THREE.Color('#ffab00'),
    vert: LOWPOLY_VERT,
    frag: LOWPOLY_FRAG,
  },
  toon: {
    baseColor: new THREE.Color('#7c4dff'),
    accentColor: new THREE.Color('#b388ff'),
    vert: TOON_VERT,
    frag: TOON_FRAG,
  },
  wireframe: {
    baseColor: new THREE.Color('#ffffff'),
    accentColor: new THREE.Color('#b0bec5'),
    vert: WIREFRAME_VERT,
    frag: WIREFRAME_FRAG,
  },
  watercolor: {
    baseColor: new THREE.Color('#00bcd4'),
    accentColor: new THREE.Color('#448aff'),
    vert: WATERCOLOR_VERT,
    frag: WATERCOLOR_FRAG,
  },
};

export function processStyle(
  style: StyleType,
  detailIntensity: number,
  transitionProgress: number
): StyleConfig {
  const config = STYLE_CONFIGS[style];

  const uniforms: Record<string, { value: unknown }> = {
    uBaseColor: { value: config.baseColor },
    uAccentColor: { value: config.accentColor },
    uDetailIntensity: { value: detailIntensity },
    uTransitionProgress: { value: transitionProgress },
    uTime: { value: 0 },
  };

  return {
    vertexShader: config.vert,
    fragmentShader: config.frag,
    uniforms,
  };
}

export function addBarycentricCoordinates(geometry: THREE.BufferGeometry): THREE.BufferGeometry {
  const positionAttr = geometry.getAttribute('position');
  const count = positionAttr.count;
  const faceCount = count / 3;

  if (geometry.index) {
    const indexAttr = geometry.index;
    const indexCount = indexAttr.count;
    const faceCountFromIndex = indexCount / 3;
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

export function applyDetailToGeometry(
  originalGeometry: THREE.BufferGeometry,
  detailIntensity: number
): THREE.BufferGeometry {
  const geometry = originalGeometry.clone();

  if (detailIntensity < 50) {
    geometry.computeVertexNormals();
    const normalAttr = geometry.getAttribute('normal');
    const smoothFactor = 1.0 - (detailIntensity / 50.0);

    for (let i = 0; i < normalAttr.count; i++) {
      const nx = normalAttr.getX(i);
      const ny = normalAttr.getY(i);
      const nz = normalAttr.getZ(i);
      const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
      const safeLen = Math.max(len, 0.001);
      const blend = smoothFactor * 0.5;
      normalAttr.setXYZ(
        i,
        nx / safeLen * (1.0 - blend) + nx / safeLen * blend,
        ny / safeLen * (1.0 - blend) + ny / safeLen * blend,
        nz / safeLen * (1.0 - blend) + nz / safeLen * blend
      );
    }
    normalAttr.needsUpdate = true;
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
