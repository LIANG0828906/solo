import * as THREE from 'three';

export interface GalaxyParams {
  arms: number;
  count: number;
  speed: number;
  spread: number;
  color1: string;
  color2: string;
}

export const DEFAULT_PARAMS: GalaxyParams = {
  arms: 4,
  count: 50000,
  speed: 0.02,
  spread: 1.0,
  color1: '#FFFFFF',
  color2: '#00CED1',
};

const vertexShader = `
  attribute float aSize;
  attribute vec3 aColor;
  attribute float aRandom;
  varying vec3 vColor;
  varying float vRandom;
  uniform float uTime;
  uniform float uSpeed;
  uniform float uHoverBrightness;
  uniform vec3 uHoverPoint;
  uniform float uHoverActive;

  void main() {
    vColor = aColor;
    vRandom = aRandom;

    vec3 pos = position;
    float dist = length(pos.xz);
    float angle = atan(pos.z, pos.x);
    angle += uTime * uSpeed / (dist + 0.5);
    pos.x = cos(angle) * dist;
    pos.z = sin(angle) * dist;

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_PointSize = aSize * (300.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;

    if (uHoverActive > 0.5) {
      float hoverDist = length(pos - uHoverPoint);
      float hoverRadius = 1.5;
      if (hoverDist < hoverRadius) {
        float factor = 1.0 - hoverDist / hoverRadius;
        vColor = aColor * (1.0 + uHoverBrightness * factor * 0.2);
      }
    }
  }
`;

const fragmentShader = `
  varying vec3 vColor;
  varying float vRandom;

  void main() {
    float d = length(gl_PointCoord - vec2(0.5));
    if (d > 0.5) discard;

    float alpha = 1.0 - smoothstep(0.0, 0.5, d);
    alpha *= 0.7 + 0.3 * vRandom;

    gl_FragColor = vec4(vColor, alpha);
  }
`;

export function createGalaxy(params: GalaxyParams): {
  points: THREE.Points;
  material: THREE.ShaderMaterial;
} {
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(params.count * 3);
  const colors = new Float32Array(params.count * 3);
  const sizes = new Float32Array(params.count);
  const randoms = new Float32Array(params.count);

  const color1 = new THREE.Color(params.color1);
  const color2 = new THREE.Color(params.color2);
  const tempColor = new THREE.Color();

  for (let i = 0; i < params.count; i++) {
    const i3 = i * 3;

    const armIndex = i % params.arms;
    const armAngle = (armIndex / params.arms) * Math.PI * 2;

    const radius = Math.random() * 5;
    const spinAngle = radius * 2.5;
    const randomX = Math.pow(Math.random(), 3) * (Math.random() < 0.5 ? 1 : -1) * params.spread * 0.3;
    const randomY = Math.pow(Math.random(), 3) * (Math.random() < 0.5 ? 1 : -1) * params.spread * 0.15;
    const randomZ = Math.pow(Math.random(), 3) * (Math.random() < 0.5 ? 1 : -1) * params.spread * 0.3;

    positions[i3] = Math.cos(armAngle + spinAngle) * radius + randomX;
    positions[i3 + 1] = randomY;
    positions[i3 + 2] = Math.sin(armAngle + spinAngle) * radius + randomZ;

    const mixedRatio = Math.min(radius / 5, 1.0);
    tempColor.copy(color1).lerp(color2, mixedRatio);
    colors[i3] = tempColor.r;
    colors[i3 + 1] = tempColor.g;
    colors[i3 + 2] = tempColor.b;

    const sizeFactor = Math.min(radius / 5, 1.0);
    sizes[i] = 0.02 + sizeFactor * (0.1 - 0.02);

    randoms[i] = Math.random();
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('aColor', new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
  geometry.setAttribute('aRandom', new THREE.BufferAttribute(randoms, 1));

  const material = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: {
      uTime: { value: 0 },
      uSpeed: { value: params.speed },
      uHoverBrightness: { value: 1.0 },
      uHoverPoint: { value: new THREE.Vector3() },
      uHoverActive: { value: 0.0 },
    },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  const points = new THREE.Points(geometry, material);
  return { points, material };
}

export function disposeGalaxy(points: THREE.Points): void {
  points.geometry.dispose();
  (points.material as THREE.ShaderMaterial).dispose();
}
