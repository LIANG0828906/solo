import * as THREE from 'three';
import type { NebulaParams, ColorPalette, NebulaAPI } from './types';

const vertexShader = /* glsl */ `
  attribute float aSize;
  attribute float aOpacity;
  varying float vOpacity;
  varying vec3 vColor;
  void main() {
    vOpacity = aOpacity;
    vColor = color;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = aSize * (300.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const fragmentShader = /* glsl */ `
  varying float vOpacity;
  varying vec3 vColor;
  void main() {
    vec2 center = gl_PointCoord - vec2(0.5);
    float dist = length(center);
    if (dist > 0.5) discard;
    float alpha = smoothstep(0.5, 0.0, dist) * vOpacity;
    vec3 glow = vec3(1.0) * (1.0 - dist) * 0.3;
    gl_FragColor = vec4(vColor + glow, alpha);
  }
`;

const PALETTES: Record<ColorPalette, [number, number, number][]> = {
  rainbow: [
    [1.0, 0.0, 0.0],
    [1.0, 0.0, 1.0],
    [0.0, 0.0, 1.0],
  ],
  aurora: [
    [0.0, 1.0, 0.533],
    [0.0, 0.533, 1.0],
  ],
  lava: [
    [1.0, 0.267, 0.0],
    [1.0, 0.667, 0.0],
  ],
};

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function lerpColor(
  a: [number, number, number],
  b: [number, number, number],
  t: number
): [number, number, number] {
  return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
}

function samplePalette(palette: ColorPalette, t: number): [number, number, number] {
  const colors = PALETTES[palette];
  const scaled = t * (colors.length - 1);
  const idx = Math.floor(scaled);
  const frac = scaled - idx;
  if (idx >= colors.length - 1) return colors[colors.length - 1];
  return lerpColor(colors[idx], colors[idx + 1], frac);
}

function rand(): number {
  return Math.random();
}

function randRange(min: number, max: number): number {
  return min + rand() * (max - min);
}

function gaussianRandom(): number {
  let u = 0;
  let v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

function generatePosition(density: number, turbulence: number): [number, number, number] {
  const densityFactor = density / 100;
  const gauss = Math.abs(gaussianRandom());
  const radiusFactor = Math.min(1, gauss * (0.3 + densityFactor * 0.4));

  const theta = rand() * Math.PI * 2;
  const phi = Math.acos(2 * rand() - 1);

  const baseRadius = 20 * radiusFactor;

  const irregular = 0.15 + densityFactor * 0.1;
  const noiseX = gaussianRandom() * irregular;
  const noiseY = gaussianRandom() * irregular;
  const noiseZ = gaussianRandom() * irregular;

  let x = baseRadius * Math.sin(phi) * Math.cos(theta) + noiseX * baseRadius;
  let y = baseRadius * Math.sin(phi) * Math.sin(theta) + noiseY * baseRadius;
  let z = baseRadius * Math.cos(phi) + noiseZ * baseRadius;

  const turbAmp = (turbulence / 5) * 3;
  x += gaussianRandom() * turbAmp;
  y += gaussianRandom() * turbAmp;
  z += gaussianRandom() * turbAmp;

  const dist = Math.sqrt(x * x + y * y + z * z);
  if (dist > 25) {
    const scale = 25 / dist;
    x *= scale;
    y *= scale;
    z *= scale;
  }

  return [x, y, z];
}

export function createNebula(initialParams: NebulaParams): NebulaAPI {
  let params = { ...initialParams };
  let currentCount = params.particleCount;

  let positions = new Float32Array(currentCount * 3);
  let colors = new Float32Array(currentCount * 3);
  let sizes = new Float32Array(currentCount);
  let opacities = new Float32Array(currentCount);

  let targetPositions = new Float32Array(currentCount * 3);
  let targetColors = new Float32Array(currentCount * 3);
  let initialPositions = new Float32Array(currentCount * 3);
  let initialColors = new Float32Array(currentCount * 3);

  let driftOffsets = new Float32Array(currentCount * 3);
  let driftFrequencies = new Float32Array(currentCount * 3);
  let breathPhases = new Float32Array(currentCount);
  let breathPeriods = new Float32Array(currentCount);
  let baseOpacities = new Float32Array(currentCount);

  for (let i = 0; i < currentCount; i++) {
    const pos = generatePosition(params.density, params.turbulence);
    const dist = Math.sqrt(pos[0] * pos[0] + pos[1] * pos[1] + pos[2] * pos[2]);
    const colorT = Math.min(1, dist / 20);
    const color = samplePalette(params.colorPalette, colorT);
    const size = randRange(0.05, 0.3);

    positions[i * 3] = pos[0];
    positions[i * 3 + 1] = pos[1];
    positions[i * 3 + 2] = pos[2];

    targetPositions[i * 3] = pos[0];
    targetPositions[i * 3 + 1] = pos[1];
    targetPositions[i * 3 + 2] = pos[2];

    initialPositions[i * 3] = pos[0];
    initialPositions[i * 3 + 1] = pos[1];
    initialPositions[i * 3 + 2] = pos[2];

    colors[i * 3] = color[0];
    colors[i * 3 + 1] = color[1];
    colors[i * 3 + 2] = color[2];

    targetColors[i * 3] = color[0];
    targetColors[i * 3 + 1] = color[1];
    targetColors[i * 3 + 2] = color[2];

    initialColors[i * 3] = color[0];
    initialColors[i * 3 + 1] = color[1];
    initialColors[i * 3 + 2] = color[2];

    sizes[i] = size;
    opacities[i] = randRange(0.3, 0.8);

    driftOffsets[i * 3] = rand() * Math.PI * 2;
    driftOffsets[i * 3 + 1] = rand() * Math.PI * 2;
    driftOffsets[i * 3 + 2] = rand() * Math.PI * 2;

    driftFrequencies[i * 3] = randRange(0.2, 0.8);
    driftFrequencies[i * 3 + 1] = randRange(0.2, 0.8);
    driftFrequencies[i * 3 + 2] = randRange(0.2, 0.8);

    breathPhases[i] = rand() * Math.PI * 2;
    breathPeriods[i] = randRange(2, 4);
    baseOpacities[i] = opacities[i];
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
  geometry.setAttribute('aOpacity', new THREE.BufferAttribute(opacities, 1));

  const material = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    vertexColors: true,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  const points = new THREE.Points(geometry, material);

  let transitionProgress = 1;
  const transitionDuration = 2;
  let transitionActive = false;
  let nebulaRotation = 0;

  function updateParams(newParams: Partial<NebulaParams>) {
    params = { ...params, ...newParams };

    for (let i = 0; i < currentCount; i++) {
      initialPositions[i * 3] = positions[i * 3];
      initialPositions[i * 3 + 1] = positions[i * 3 + 1];
      initialPositions[i * 3 + 2] = positions[i * 3 + 2];

      initialColors[i * 3] = colors[i * 3];
      initialColors[i * 3 + 1] = colors[i * 3 + 1];
      initialColors[i * 3 + 2] = colors[i * 3 + 2];

      const newPos = generatePosition(params.density, params.turbulence);
      targetPositions[i * 3] = newPos[0];
      targetPositions[i * 3 + 1] = newPos[1];
      targetPositions[i * 3 + 2] = newPos[2];

      const dist = Math.sqrt(newPos[0] * newPos[0] + newPos[1] * newPos[1] + newPos[2] * newPos[2]);
      const colorT = Math.min(1, dist / 20);
      const newColor = samplePalette(params.colorPalette, colorT);
      targetColors[i * 3] = newColor[0];
      targetColors[i * 3 + 1] = newColor[1];
      targetColors[i * 3 + 2] = newColor[2];
    }

    transitionProgress = 0;
    transitionActive = true;
  }

  function reduceParticles(factor: number) {
    const newCount = Math.max(20000, Math.floor(currentCount * (1 - factor)));
    if (newCount >= currentCount) return;

    const step = currentCount / newCount;
    const newPositions = new Float32Array(newCount * 3);
    const newColors = new Float32Array(newCount * 3);
    const newSizes = new Float32Array(newCount);
    const newOpacities = new Float32Array(newCount);
    const newTargetPositions = new Float32Array(newCount * 3);
    const newTargetColors = new Float32Array(newCount * 3);
    const newInitialPositions = new Float32Array(newCount * 3);
    const newInitialColors = new Float32Array(newCount * 3);
    const newDriftOffsets = new Float32Array(newCount * 3);
    const newDriftFrequencies = new Float32Array(newCount * 3);
    const newBreathPhases = new Float32Array(newCount);
    const newBreathPeriods = new Float32Array(newCount);
    const newBaseOpacities = new Float32Array(newCount);

    for (let i = 0; i < newCount; i++) {
      const srcIdx = Math.floor(i * step);
      newPositions[i * 3] = positions[srcIdx * 3];
      newPositions[i * 3 + 1] = positions[srcIdx * 3 + 1];
      newPositions[i * 3 + 2] = positions[srcIdx * 3 + 2];

      newColors[i * 3] = colors[srcIdx * 3];
      newColors[i * 3 + 1] = colors[srcIdx * 3 + 1];
      newColors[i * 3 + 2] = colors[srcIdx * 3 + 2];

      newSizes[i] = sizes[srcIdx];
      newOpacities[i] = opacities[srcIdx];

      newTargetPositions[i * 3] = targetPositions[srcIdx * 3];
      newTargetPositions[i * 3 + 1] = targetPositions[srcIdx * 3 + 1];
      newTargetPositions[i * 3 + 2] = targetPositions[srcIdx * 3 + 2];

      newTargetColors[i * 3] = targetColors[srcIdx * 3];
      newTargetColors[i * 3 + 1] = targetColors[srcIdx * 3 + 1];
      newTargetColors[i * 3 + 2] = targetColors[srcIdx * 3 + 2];

      newInitialPositions[i * 3] = initialPositions[srcIdx * 3];
      newInitialPositions[i * 3 + 1] = initialPositions[srcIdx * 3 + 1];
      newInitialPositions[i * 3 + 2] = initialPositions[srcIdx * 3 + 2];

      newInitialColors[i * 3] = initialColors[srcIdx * 3];
      newInitialColors[i * 3 + 1] = initialColors[srcIdx * 3 + 1];
      newInitialColors[i * 3 + 2] = initialColors[srcIdx * 3 + 2];

      newDriftOffsets[i * 3] = driftOffsets[srcIdx * 3];
      newDriftOffsets[i * 3 + 1] = driftOffsets[srcIdx * 3 + 1];
      newDriftOffsets[i * 3 + 2] = driftOffsets[srcIdx * 3 + 2];

      newDriftFrequencies[i * 3] = driftFrequencies[srcIdx * 3];
      newDriftFrequencies[i * 3 + 1] = driftFrequencies[srcIdx * 3 + 1];
      newDriftFrequencies[i * 3 + 2] = driftFrequencies[srcIdx * 3 + 2];

      newBreathPhases[i] = breathPhases[srcIdx];
      newBreathPeriods[i] = breathPeriods[srcIdx];
      newBaseOpacities[i] = baseOpacities[srcIdx];
    }

    const oldGeometry = points.geometry;
    oldGeometry.dispose();

    const newGeometry = new THREE.BufferGeometry();
    newGeometry.setAttribute('position', new THREE.BufferAttribute(newPositions, 3));
    newGeometry.setAttribute('color', new THREE.BufferAttribute(newColors, 3));
    newGeometry.setAttribute('aSize', new THREE.BufferAttribute(newSizes, 1));
    newGeometry.setAttribute('aOpacity', new THREE.BufferAttribute(newOpacities, 1));

    points.geometry = newGeometry;

    currentCount = newCount;
    params.particleCount = newCount;

    positions = newPositions;
    colors = newColors;
    sizes = newSizes;
    opacities = newOpacities;
    targetPositions = newTargetPositions;
    targetColors = newTargetColors;
    initialPositions = newInitialPositions;
    initialColors = newInitialColors;
    driftOffsets = newDriftOffsets;
    driftFrequencies = newDriftFrequencies;
    breathPhases = newBreathPhases;
    breathPeriods = newBreathPeriods;
    baseOpacities = newBaseOpacities;
  }

  function animate(delta: number, elapsed: number) {
    nebulaRotation += delta * 0.01;
    points.rotation.y = nebulaRotation;

    if (transitionActive) {
      transitionProgress = Math.min(1, transitionProgress + delta / transitionDuration);
      if (transitionProgress >= 1) {
        transitionActive = false;
      }
    }

    const currentGeometry = points.geometry;
    const posAttr = currentGeometry.getAttribute('position') as THREE.BufferAttribute;
    const colorAttr = currentGeometry.getAttribute('color') as THREE.BufferAttribute;
    const opacityAttr = currentGeometry.getAttribute('aOpacity') as THREE.BufferAttribute;

    const posArr = posAttr.array as Float32Array;
    const colorArr = colorAttr.array as Float32Array;
    const opacityArr = opacityAttr.array as Float32Array;

    const t = transitionProgress;

    for (let i = 0; i < currentCount; i++) {
      const ix = i * 3;

      const driftAmp = 0.3;
      const driftX = Math.sin(elapsed * driftFrequencies[ix] + driftOffsets[ix]) * driftAmp;
      const driftY = Math.sin(elapsed * driftFrequencies[ix + 1] + driftOffsets[ix + 1]) * driftAmp;
      const driftZ = Math.sin(elapsed * driftFrequencies[ix + 2] + driftOffsets[ix + 2]) * driftAmp;

      if (transitionActive) {
        posArr[ix] = lerp(initialPositions[ix], targetPositions[ix], t) + driftX;
        posArr[ix + 1] = lerp(initialPositions[ix + 1], targetPositions[ix + 1], t) + driftY;
        posArr[ix + 2] = lerp(initialPositions[ix + 2], targetPositions[ix + 2], t) + driftZ;

        colorArr[ix] = lerp(initialColors[ix], targetColors[ix], t);
        colorArr[ix + 1] = lerp(initialColors[ix + 1], targetColors[ix + 1], t);
        colorArr[ix + 2] = lerp(initialColors[ix + 2], targetColors[ix + 2], t);
      } else {
        posArr[ix] = targetPositions[ix] + driftX;
        posArr[ix + 1] = targetPositions[ix + 1] + driftY;
        posArr[ix + 2] = targetPositions[ix + 2] + driftZ;
      }

      const breathOmega = (Math.PI * 2) / breathPeriods[i];
      const breathValue = 0.5 + 0.5 * Math.sin(elapsed * breathOmega + breathPhases[i]);
      opacityArr[i] = 0.3 + 0.5 * breathValue;
    }

    posAttr.needsUpdate = true;
    colorAttr.needsUpdate = true;
    opacityAttr.needsUpdate = true;
  }

  return {
    points,
    updateParams,
    animate,
    getCurrentParticleCount: () => currentCount,
    reduceParticles,
  };
}
