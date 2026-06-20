/// <reference lib="webworker" />
import type { NebulaParams, ParticleData, NebulaShape } from '../store/useNebulaStore';

const self = globalThis as unknown as DedicatedWorkerGlobalScope;

interface InitMessage {
  type: 'init';
  params: NebulaParams;
}

interface UpdateMessage {
  type: 'update';
  params: NebulaParams;
  delta: number;
  time: number;
}

interface AnimateMessage {
  type: 'animate';
  delta: number;
  time: number;
  params: NebulaParams;
}

interface RegenerateMessage {
  type: 'regenerate';
  params: NebulaParams;
}

type WorkerMessage = InitMessage | UpdateMessage | AnimateMessage | RegenerateMessage;

interface ParticleState {
  positions: Float32Array;
  velocities: Float32Array;
  initialPositions: Float32Array;
  colors: Float32Array;
  sizes: Float32Array;
  count: number;
}

let state: ParticleState | null = null;
let currentParams: NebulaParams | null = null;

function generateSphere(count: number): { positions: Float32Array; velocities: Float32Array } {
  const positions = new Float32Array(count * 3);
  const velocities = new Float32Array(count * 3);
  const radius = 50;

  for (let i = 0; i < count; i++) {
    const phi = Math.acos(2 * Math.random() - 1);
    const theta = 2 * Math.PI * Math.random();
    const r = radius * Math.pow(Math.random(), 0.5);

    const idx = i * 3;
    positions[idx] = r * Math.sin(phi) * Math.cos(theta);
    positions[idx + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[idx + 2] = r * Math.cos(phi);

    const speed = 0.02 + Math.random() * 0.03;
    const tangentX = -positions[idx + 1] / (r || 1);
    const tangentY = positions[idx] / (r || 1);
    velocities[idx] = tangentX * speed;
    velocities[idx + 1] = tangentY * speed;
    velocities[idx + 2] = (Math.random() - 0.5) * 0.02;
  }

  return { positions, velocities };
}

function generateSpiral(count: number): { positions: Float32Array; velocities: Float32Array } {
  const positions = new Float32Array(count * 3);
  const velocities = new Float32Array(count * 3);
  const maxRadius = 50;
  const arms = 4;
  const particlesPerArm = Math.floor(count / arms);

  for (let arm = 0; arm < arms; arm++) {
    const armOffset = (arm / arms) * 2 * Math.PI;

    for (let i = 0; i < particlesPerArm; i++) {
      const globalIdx = arm * particlesPerArm + i;
      const t = i / particlesPerArm;
      const radius = t * maxRadius + (Math.random() - 0.5) * 8;
      const angle = armOffset + t * 4 * Math.PI + (Math.random() - 0.5) * 0.3;

      const idx = globalIdx * 3;
      positions[idx] = radius * Math.cos(angle);
      positions[idx + 1] = (Math.random() - 0.5) * 15;
      positions[idx + 2] = radius * Math.sin(angle);

      const speed = 0.03 + (1 - t) * 0.04;
      velocities[idx] = -Math.sin(angle) * speed;
      velocities[idx + 1] = (Math.random() - 0.5) * 0.01;
      velocities[idx + 2] = Math.cos(angle) * speed;
    }
  }

  const remaining = count - arms * particlesPerArm;
  for (let i = 0; i < remaining; i++) {
    const globalIdx = arms * particlesPerArm + i;
    const idx = globalIdx * 3;
    positions[idx] = (Math.random() - 0.5) * 10;
    positions[idx + 1] = (Math.random() - 0.5) * 5;
    positions[idx + 2] = (Math.random() - 0.5) * 10;
    velocities[idx] = (Math.random() - 0.5) * 0.02;
    velocities[idx + 1] = (Math.random() - 0.5) * 0.01;
    velocities[idx + 2] = (Math.random() - 0.5) * 0.02;
  }

  return { positions, velocities };
}

function hueToRgb(hue: number, saturation: number, lightness: number): [number, number, number] {
  const c = (1 - Math.abs(2 * lightness - 1)) * saturation;
  const x = c * (1 - Math.abs(((hue * 6) % 2) - 1));
  const m = lightness - c / 2;

  let r = 0, g = 0, b = 0;
  if (hue < 1 / 6) { r = c; g = x; b = 0; }
  else if (hue < 2 / 6) { r = x; g = c; b = 0; }
  else if (hue < 3 / 6) { r = 0; g = c; b = x; }
  else if (hue < 4 / 6) { r = 0; g = x; b = c; }
  else if (hue < 5 / 6) { r = x; g = 0; b = c; }
  else { r = c; g = 0; b = x; }

  return [r + m, g + m, b + m];
}

function generateColors(count: number, positions: Float32Array, hue: number): Float32Array {
  const colors = new Float32Array(count * 3);
  const baseHue = hue % 1;

  for (let i = 0; i < count; i++) {
    const idx = i * 3;
    const x = positions[idx];
    const y = positions[idx + 1];
    const z = positions[idx + 2];
    const dist = Math.sqrt(x * x + y * y + z * z);
    const normalizedDist = Math.min(dist / 50, 1);

    const hueOffset = normalizedDist * 0.15;
    const particleHue = (baseHue + hueOffset) % 1;
    const saturation = 0.85;
    const lightness = 0.4 + (1 - normalizedDist) * 0.3;

    const [r, g, b] = hueToRgb(particleHue, saturation, lightness);
    colors[idx] = r;
    colors[idx + 1] = g;
    colors[idx + 2] = b;
  }

  return colors;
}

function generateSizes(count: number, positions: Float32Array, baseSize: number): Float32Array {
  const sizes = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    const idx = i * 3;
    const x = positions[idx];
    const y = positions[idx + 1];
    const z = positions[idx + 2];
    const dist = Math.sqrt(x * x + y * y + z * z);
    const normalizedDist = Math.min(dist / 50, 1);
    const sizeFactor = (1 - normalizedDist) * 0.7 + 0.3;
    sizes[i] = baseSize * sizeFactor;
  }

  return sizes;
}

function initParticles(params: NebulaParams) {
  currentParams = params;
  const { particleCount, shape, hue, particleSize } = params;

  let genResult;
  if (shape === 'sphere') {
    genResult = generateSphere(particleCount);
  } else {
    genResult = generateSpiral(particleCount);
  }

  const positions = genResult.positions;
  const velocities = genResult.velocities;
  const initialPositions = new Float32Array(positions);
  const colors = generateColors(particleCount, positions, hue);
  const sizes = generateSizes(particleCount, positions, particleSize);

  state = {
    positions,
    velocities,
    initialPositions,
    colors,
    sizes,
    count: particleCount
  };

  sendParticleData();
}

function sendParticleData() {
  if (!state) return;

  const data: ParticleData = {
    positions: state.positions,
    colors: state.colors,
    sizes: state.sizes
  };

  self.postMessage(
    {
      type: 'particles',
      data,
      positions: state.positions.buffer,
      colors: state.colors.buffer,
      sizes: state.sizes.buffer
    },
    [state.positions.buffer, state.colors.buffer, state.sizes.buffer]
  );
}

function simpleNoise(x: number, y: number, z: number, time: number): number {
  const a = Math.sin(x * 0.1 + time * 0.5) * 0.5;
  const b = Math.sin(y * 0.12 + time * 0.7) * 0.5;
  const c = Math.sin(z * 0.08 + time * 0.3) * 0.5;
  return a + b + c;
}

function animateParticles(delta: number, time: number, params: NebulaParams) {
  if (!state || !currentParams) return;

  const { rotationSpeed, turbulence, hue, particleSize, shape } = params;
  const needRegenerate =
    shape !== currentParams.shape ||
    params.particleCount !== currentParams.particleCount;

  if (needRegenerate) {
    initParticles(params);
    return;
  }

  const colorsChanged = hue !== currentParams.hue;
  const sizeChanged = particleSize !== currentParams.particleSize;

  const { positions, velocities, initialPositions, colors, sizes, count } = state;

  for (let i = 0; i < count; i++) {
    const idx = i * 3;

    const ox = initialPositions[idx];
    const oy = initialPositions[idx + 1];
    const oz = initialPositions[idx + 2];
    const baseDist = Math.sqrt(ox * ox + oy * oy + oz * oz);
    const normalizedDist = Math.min(baseDist / 50, 1);

    positions[idx] += velocities[idx] * delta * 60 * rotationSpeed;
    positions[idx + 1] += velocities[idx + 1] * delta * 60 * rotationSpeed;
    positions[idx + 2] += velocities[idx + 2] * delta * 60 * rotationSpeed;

    if (turbulence > 0) {
      const noiseX = simpleNoise(ox, oy, oz, time);
      const noiseY = simpleNoise(oy, oz, ox, time + 100);
      const noiseZ = simpleNoise(oz, ox, oy, time + 200);
      const turbFactor = turbulence * (1 - normalizedDist * 0.5) * 0.3;

      positions[idx] += noiseX * turbFactor;
      positions[idx + 1] += noiseY * turbFactor;
      positions[idx + 2] += noiseZ * turbFactor;
    }

    const anchorStrength = 0.002 * (1 - normalizedDist * 0.7);
    positions[idx] += (ox - positions[idx]) * anchorStrength;
    positions[idx + 1] += (oy - positions[idx + 1]) * anchorStrength;
    positions[idx + 2] += (oz - positions[idx + 2]) * anchorStrength;

    if (sizeChanged) {
      const sizeFactor = (1 - normalizedDist) * 0.7 + 0.3;
      sizes[i] = particleSize * sizeFactor;
    }
  }

  if (colorsChanged) {
    const newColors = generateColors(count, positions, hue);
    for (let i = 0; i < count * 3; i++) {
      const lerp = 0.1;
      colors[i] = colors[i] + (newColors[i] - colors[i]) * lerp;
    }
  }

  currentParams = params;
  sendParticleData();
}

self.onmessage = (e: MessageEvent<WorkerMessage>) => {
  const msg = e.data;

  switch (msg.type) {
    case 'init':
      initParticles(msg.params);
      break;
    case 'animate':
      animateParticles(msg.delta, msg.time, msg.params);
      break;
    case 'regenerate':
      initParticles(msg.params);
      break;
  }
};

export {};
