import * as THREE from 'three';

export interface ParticleData {
  points: THREE.Points;
  count: number;
}

const BASE_COUNT = 3000;
const MIN_COUNT = 800;
const MID_COUNT = 1500;

const particleVertexShader = `
  attribute float aSize;
  attribute vec3 aColor;
  varying vec3 vColor;
  
  void main() {
    vColor = aColor;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = aSize * (300.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const particleFragmentShader = `
  varying vec3 vColor;
  uniform float uOpacity;
  
  void main() {
    vec2 center = gl_PointCoord - vec2(0.5);
    float dist = length(center);
    if (dist > 0.5) discard;
    
    float glow = smoothstep(0.5, 0.0, dist);
    float alpha = glow * uOpacity;
    vec3 finalColor = vColor * (0.5 + glow * 0.5);
    
    gl_FragColor = vec4(finalColor, alpha);
  }
`;

let currentCount = BASE_COUNT;
let isPaused = false;
let geometry: THREE.BufferGeometry | null = null;
let material: THREE.ShaderMaterial | null = null;
let points: THREE.Points | null = null;

const positions = new Float32Array(BASE_COUNT * 3);
const basePositions = new Float32Array(BASE_COUNT * 3);
const colors = new Float32Array(BASE_COUNT * 3);
const sizes = new Float32Array(BASE_COUNT);
const velocities = new Float32Array(BASE_COUNT * 3);
const phaseOffsets = new Float32Array(BASE_COUNT);

let rotationSpeed = 0.5;
let zWaveAmplitude = 0.5;
let saturation = 0.7;
let time = 0;

function hsvToRgb(h: number, s: number, v: number): THREE.Color {
  const color = new THREE.Color();
  color.setHSL(h, s, v);
  return color;
}

function generateParticlePositions(count: number): void {
  for (let i = 0; i < count; i++) {
    const r = 5 * Math.sqrt(Math.random());
    const theta = 2 * Math.PI * Math.random();
    const phi = Math.acos(2 * Math.random() - 1);

    const x = r * Math.sin(phi) * Math.cos(theta);
    const y = r * Math.sin(phi) * Math.sin(theta);
    const z = r * Math.cos(phi);

    basePositions[i * 3] = x;
    basePositions[i * 3 + 1] = y;
    basePositions[i * 3 + 2] = z;

    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;

    velocities[i * 3] = (Math.random() - 0.5) * 0.02;
    velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.02;
    velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.02;

    phaseOffsets[i] = Math.random() * Math.PI * 2;

    const hue = (i / count) * 0.78;
    const color = hsvToRgb(hue, 0.7, 0.8);
    colors[i * 3] = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;

    sizes[i] = 1 + Math.random() * 2;
  }
}

export function createParticles(scene: THREE.Scene): ParticleData {
  generateParticlePositions(BASE_COUNT);

  geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('aColor', new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));

  geometry.setDrawRange(0, currentCount);

  material = new THREE.ShaderMaterial({
    uniforms: {
      uOpacity: { value: 1.0 }
    },
    vertexShader: particleVertexShader,
    fragmentShader: particleFragmentShader,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });

  points = new THREE.Points(geometry, material);
  scene.add(points);

  return { points, count: currentCount };
}

export function updateParticles(
  frequencyData: Uint8Array,
  lowFrequency: number,
  midFrequency: number,
  highFrequency: number,
  deltaTime: number
): number {
  if (!points || !geometry || isPaused) {
    return currentCount;
  }

  time += deltaTime;

  rotationSpeed = 0.5 + lowFrequency * 1.5;
  zWaveAmplitude = 0.3 + midFrequency * 2.0;
  saturation = 0.5 + highFrequency * 0.5;

  points.rotation.y += rotationSpeed * deltaTime;

  const positionAttr = geometry.getAttribute('position') as THREE.BufferAttribute;
  const colorAttr = geometry.getAttribute('aColor') as THREE.BufferAttribute;
  const sizeAttr = geometry.getAttribute('aSize') as THREE.BufferAttribute;

  const posArray = positionAttr.array as Float32Array;
  const colorArray = colorAttr.array as Float32Array;
  const sizeArray = sizeAttr.array as Float32Array;

  const binCount = frequencyData.length;

  for (let i = 0; i < currentCount; i++) {
    const idx = i * 3;

    const freqIndex = Math.floor((i / currentCount) * binCount);
    const freqValue = frequencyData[freqIndex] / 255;

    const bx = basePositions[idx];
    const by = basePositions[idx + 1];
    const bz = basePositions[idx + 2];

    const distance = Math.sqrt(bx * bx + by * by + bz * bz);
    const normalizedDist = distance / 5;

    const waveOffset = Math.sin(time * 2 + phaseOffsets[i] + normalizedDist * 5) * zWaveAmplitude * freqValue;

    posArray[idx] = bx + velocities[idx] * freqValue * 10;
    posArray[idx + 1] = by + velocities[idx + 1] * freqValue * 10;
    posArray[idx + 2] = bz + waveOffset + velocities[idx + 2] * freqValue * 10;

    const hue = (i / currentCount) * 0.78;
    const value = 0.3 + freqValue * 0.7;
    const sat = Math.min(1, saturation + freqValue * 0.3);

    const color = hsvToRgb(hue, sat, value);
    colorArray[idx] = color.r;
    colorArray[idx + 1] = color.g;
    colorArray[idx + 2] = color.b;

    sizeArray[i] = 1 + freqValue * 7;
  }

  positionAttr.needsUpdate = true;
  colorAttr.needsUpdate = true;
  sizeAttr.needsUpdate = true;

  return currentCount;
}

export function setParticleCount(count: number): void {
  const newCount = Math.max(MIN_COUNT, Math.min(BASE_COUNT, count));
  if (newCount === currentCount || !geometry) return;

  currentCount = newCount;
  geometry.setDrawRange(0, currentCount);

  const positionAttr = geometry.getAttribute('position') as THREE.BufferAttribute;
  const colorAttr = geometry.getAttribute('aColor') as THREE.BufferAttribute;
  const sizeAttr = geometry.getAttribute('aSize') as THREE.BufferAttribute;

  positionAttr.needsUpdate = true;
  colorAttr.needsUpdate = true;
  sizeAttr.needsUpdate = true;
}

export function getParticleCount(): number {
  return currentCount;
}

export function togglePause(): boolean {
  isPaused = !isPaused;
  return isPaused;
}

export function setPaused(paused: boolean): void {
  isPaused = paused;
}

export function isPausedState(): boolean {
  return isPaused;
}

export function setParticleOpacity(opacity: number): void {
  if (material && material.uniforms) {
    material.uniforms.uOpacity.value = opacity;
  }
}

export function setParticlesVisible(visible: boolean): void {
  if (points) {
    points.visible = visible;
  }
}

export function getParticleBaseCount(): number {
  return BASE_COUNT;
}

export function getParticleMidCount(): number {
  return MID_COUNT;
}

export function getParticleMinCount(): number {
  return MIN_COUNT;
}
