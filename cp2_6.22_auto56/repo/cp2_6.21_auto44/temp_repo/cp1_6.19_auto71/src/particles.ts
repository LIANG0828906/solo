import * as THREE from 'three';
import { ChannelData, CHANNEL_INNER_RADIUS } from './channel';

const MAX_TOTAL_POINTS = 5000;
const TRAIL_COUNT = 4;
const LOGICAL_PARTICLES = Math.floor(MAX_TOTAL_POINTS / (1 + TRAIL_COUNT));
const PARTICLE_SIZE = 0.05;
const TRAIL_LENGTH = 0.3;

interface ParticleState {
  segment: number;
  t: number;
  lateralOffset: number;
  inletType: number;
  speed: number;
  alive: boolean;
}

const particleStates: ParticleState[] = [];
let positions: Float32Array;
let colors: Float32Array;
let sizes: Float32Array;
let alphas: Float32Array;
let geometry: THREE.BufferGeometry;
let points: THREE.Points;
let currentData: ChannelData;
let currentFlowA = 1;
let currentFlowB = 1;
let mixEfficiency = 0;

const COLOR_A_R = 1.0, COLOR_A_G = 0.42, COLOR_A_B = 0.42;
const COLOR_B_R = 0.306, COLOR_B_G = 0.804, COLOR_B_B = 0.769;

function hsvToRgb(h: number, s: number, v: number): [number, number, number] {
  const i = Math.floor(h * 6);
  const f = h * 6 - i;
  const p = v * (1 - s);
  const q = v * (1 - f * s);
  const t = v * (1 - (1 - f) * s);
  const mod = i % 6;
  switch (mod) {
    case 0: return [v, t, p];
    case 1: return [q, v, p];
    case 2: return [p, v, t];
    case 3: return [p, q, v];
    case 4: return [t, p, v];
    case 5: return [v, p, q];
    default: return [v, v, v];
  }
}

function rgbToHsv(r: number, g: number, b: number): [number, number, number] {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  const s = max === 0 ? 0 : d / max;
  const v = max;
  if (d !== 0) {
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
  }
  return [h, s, v];
}

const hsvA = rgbToHsv(COLOR_A_R, COLOR_A_G, COLOR_A_B);
const hsvB = rgbToHsv(COLOR_B_R, COLOR_B_G, COLOR_B_B);

function lerpColor(concentrationA: number): [number, number, number] {
  const cA = Math.max(0, Math.min(1, concentrationA));
  const cB = 1 - cA;
  let h = hsvA[0] * cA + hsvB[0] * cB;
  const s = hsvA[1] * cA + hsvB[1] * cB;
  const v = hsvA[2] * cA + hsvB[2] * cB;
  if (Math.abs(hsvA[0] - hsvB[0]) > 0.5) {
    if (hsvA[0] < hsvB[0]) {
      h = ((hsvA[0] + 1) * cA + hsvB[0] * cB) % 1;
    } else {
      h = (hsvA[0] * cA + (hsvB[0] + 1) * cB) % 1;
    }
  }
  return hsvToRgb(h, s, v);
}

function getMixingRate(type: string): number {
  switch (type) {
    case 'Y': return 0.25;
    case 'T': return 0.35;
    case 'serpentine': return 0.7;
    default: return 0.25;
  }
}

function calcConcentration(lateralOffset: number, downstreamDist: number, flowA: number, flowB: number, channelType: string): number {
  const total = flowA + flowB;
  const interfacePos = (flowA - flowB) / total;
  const steepness = 12 / (1 + getMixingRate(channelType) * downstreamDist * 2);
  const concA = 1 / (1 + Math.exp(steepness * (lateralOffset - interfacePos)));
  return concA;
}

function getPositionOnPath(data: ChannelData, segment: number, t: number, lateralOffset: number): THREE.Vector3 {
  let curve: THREE.CatmullRomCurve3;
  switch (segment) {
    case 0: curve = data.inletACurve; break;
    case 1: curve = data.inletBCurve; break;
    default: curve = data.mainCurve; break;
  }
  const clampedT = Math.max(0, Math.min(1, t));
  const point = curve.getPoint(clampedT);
  const tangent = curve.getTangent(clampedT);
  const up = new THREE.Vector3(0, 0, 1);
  const normal = new THREE.Vector3().crossVectors(tangent, up).normalize();
  if (normal.length() < 0.001) {
    normal.set(1, 0, 0);
  }
  return point.add(normal.multiplyScalar(lateralOffset * CHANNEL_INNER_RADIUS * 0.85));
}

function spawnParticle(index: number, data: ChannelData): void {
  const isInletA = Math.random() < currentFlowA / (currentFlowA + currentFlowB);
  const state = particleStates[index];
  state.segment = isInletA ? 0 : 1;
  state.t = Math.random() * 0.15;
  state.inletType = isInletA ? 0 : 1;
  state.alive = true;

  const offsetRange = 0.7;
  state.lateralOffset = (Math.random() * 2 - 1) * offsetRange;
  if (isInletA) {
    state.lateralOffset = -Math.abs(state.lateralOffset);
  } else {
    state.lateralOffset = Math.abs(state.lateralOffset);
  }

  state.speed = (0.15 + Math.random() * 0.1) * (isInletA ? currentFlowA : currentFlowB);
}

export function initParticles(scene: THREE.Scene, data: ChannelData): THREE.Points {
  currentData = data;

  const totalPoints = LOGICAL_PARTICLES * (1 + TRAIL_COUNT);
  positions = new Float32Array(totalPoints * 3);
  colors = new Float32Array(totalPoints * 3);
  sizes = new Float32Array(totalPoints);
  alphas = new Float32Array(totalPoints);

  for (let i = 0; i < LOGICAL_PARTICLES; i++) {
    const state: ParticleState = {
      segment: 0,
      t: 0,
      lateralOffset: 0,
      inletType: 0,
      speed: 0.2,
      alive: false,
    };
    particleStates.push(state);
    spawnParticle(i, data);
    state.t = Math.random();
    if (state.t > 0.3) {
      state.segment = 2;
      state.t = (state.t - 0.3) / 0.7;
    }
  }

  geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('aColor', new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
  geometry.setAttribute('aAlpha', new THREE.BufferAttribute(alphas, 1));

  const vertexShader = `
    attribute float aSize;
    attribute float aAlpha;
    attribute vec3 aColor;
    varying float vAlpha;
    varying vec3 vColor;
    void main() {
      vAlpha = aAlpha;
      vColor = aColor;
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      gl_PointSize = aSize * (250.0 / -mvPosition.z);
      gl_PointSize = clamp(gl_PointSize, 1.0, 32.0);
      gl_Position = projectionMatrix * mvPosition;
    }
  `;

  const fragmentShader = `
    varying float vAlpha;
    varying vec3 vColor;
    void main() {
      float dist = length(gl_PointCoord - vec2(0.5));
      if (dist > 0.5) discard;
      float softEdge = 1.0 - smoothstep(0.3, 0.5, dist);
      gl_FragColor = vec4(vColor, vAlpha * softEdge);
    }
  `;

  const material = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  points = new THREE.Points(geometry, material);
  points.name = 'particleSystem';
  points.frustumCulled = false;
  scene.add(points);

  return points;
}

export function updateParticles(data: ChannelData, flowA: number, flowB: number, delta: number): void {
  currentData = data;
  currentFlowA = flowA;
  currentFlowB = flowB;

  const clampedDelta = Math.min(delta, 0.05);
  const totalPoints = LOGICAL_PARTICLES * (1 + TRAIL_COUNT);

  for (let i = 0; i < LOGICAL_PARTICLES; i++) {
    const state = particleStates[i];
    if (!state.alive) {
      spawnParticle(i, data);
    }

    let segLength: number;
    switch (state.segment) {
      case 0: segLength = data.inletALength; break;
      case 1: segLength = data.inletBLength; break;
      default: segLength = data.mainLength; break;
    }

    const dt = (state.speed * clampedDelta) / segLength;
    state.t += dt;

    if (state.t >= 1.0) {
      if (state.segment < 2) {
        state.segment = 2;
        state.t = 0;
        state.speed = 0.15 + Math.random() * 0.1;
      } else {
        spawnParticle(i, data);
        continue;
      }
    }

    const pos = getPositionOnPath(data, state.segment, state.t, state.lateralOffset);
    const baseIdx = i * (1 + TRAIL_COUNT);

    let concentration = 1.0;
    let downstreamDist = 0;
    if (state.segment === 2) {
      downstreamDist = state.t * data.mainLength;
      concentration = calcConcentration(state.lateralOffset, downstreamDist, flowA, flowB, data.type);
    } else {
      concentration = state.inletType === 0 ? 1.0 : 0.0;
    }

    const [cr, cg, cb] = lerpColor(concentration);

    positions[baseIdx * 3] = pos.x;
    positions[baseIdx * 3 + 1] = pos.y;
    positions[baseIdx * 3 + 2] = pos.z;
    colors[baseIdx * 3] = cr;
    colors[baseIdx * 3 + 1] = cg;
    colors[baseIdx * 3 + 2] = cb;
    sizes[baseIdx] = PARTICLE_SIZE;
    alphas[baseIdx] = 0.85;

    for (let trail = 0; trail < TRAIL_COUNT; trail++) {
      const trailIdx = baseIdx + 1 + trail;
      const trailDelta = (TRAIL_LENGTH / segLength) * ((trail + 1) / TRAIL_COUNT);
      let trailT = state.t - trailDelta;
      let trailSegment = state.segment;

      if (trailT < 0) {
        if (state.segment === 2) {
          const mainTrailT = trailT;
          const inletTrailDelta = Math.abs(mainTrailT) * data.mainLength;
          const inletLength = state.inletType === 0 ? data.inletALength : data.inletBLength;
          trailSegment = state.inletType;
          trailT = 1.0 - inletTrailDelta / inletLength;
          if (trailT < 0) trailT = 0;
        } else {
          trailT = 0;
        }
      }

      const trailPos = getPositionOnPath(data, trailSegment, Math.max(0, trailT), state.lateralOffset);
      positions[trailIdx * 3] = trailPos.x;
      positions[trailIdx * 3 + 1] = trailPos.y;
      positions[trailIdx * 3 + 2] = trailPos.z;
      colors[trailIdx * 3] = cr;
      colors[trailIdx * 3 + 1] = cg;
      colors[trailIdx * 3 + 2] = cb;
      sizes[trailIdx] = PARTICLE_SIZE * (1 - (trail + 1) * 0.15);
      alphas[trailIdx] = 0.6 * (1 - (trail + 1) / (TRAIL_COUNT + 1));
    }
  }

  geometry.attributes.position.needsUpdate = true;
  geometry.attributes.aColor.needsUpdate = true;
  geometry.attributes.aSize.needsUpdate = true;
  geometry.attributes.aAlpha.needsUpdate = true;

  mixEfficiency = computeMixEfficiency(data, flowA, flowB);
}

function computeMixEfficiency(data: ChannelData, flowA: number, flowB: number): number {
  const samples = 20;
  let sumDeviation = 0;
  const outletDist = data.mainLength;
  for (let i = 0; i < samples; i++) {
    const lateralOffset = (i / (samples - 1)) * 2 - 1;
    const conc = calcConcentration(lateralOffset, outletDist, flowA, flowB, data.type);
    sumDeviation += Math.abs(conc - 0.5);
  }
  const avgDeviation = sumDeviation / samples;
  return Math.max(0, Math.min(100, (1 - 2 * avgDeviation) * 100));
}

export function getMixEfficiency(): number {
  return mixEfficiency;
}

export function getConcentrationAt(
  worldPos: THREE.Vector3,
  data: ChannelData,
  flowA: number,
  flowB: number
): { a: number; b: number } {
  let minDist = Infinity;
  let bestT = 0;
  const mainCurve = data.mainCurve;

  for (let t = 0; t <= 1; t += 0.01) {
    const pt = mainCurve.getPoint(t);
    const d = worldPos.distanceTo(pt);
    if (d < minDist) {
      minDist = d;
      bestT = t;
    }
  }

  const tangent = mainCurve.getTangent(bestT);
  const up = new THREE.Vector3(0, 0, 1);
  const normal = new THREE.Vector3().crossVectors(tangent, up).normalize();
  if (normal.length() < 0.001) normal.set(1, 0, 0);

  const pointOnCurve = mainCurve.getPoint(bestT);
  const offset = worldPos.clone().sub(pointOnCurve).dot(normal) / (CHANNEL_INNER_RADIUS * 0.85);
  const downstreamDist = bestT * data.mainLength;
  const concA = calcConcentration(offset, downstreamDist, flowA, flowB, data.type);
  const concB = 1 - concA;
  return { a: Math.round(concA * 100), b: Math.round(concB * 100) };
}

export function setChannelData(data: ChannelData): void {
  currentData = data;
  for (let i = 0; i < LOGICAL_PARTICLES; i++) {
    spawnParticle(i, data);
  }
}
