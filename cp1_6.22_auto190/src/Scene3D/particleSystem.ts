import * as THREE from 'three';
import { EffectConfig } from '../AudioEngine/effectsManager';

const PARTICLE_COUNT = 2500;

interface ParticleState {
  basePositions: Float32Array;
  velocities: Float32Array;
  sizes: Float32Array;
  colorMixes: Float32Array;
  phases: Float32Array;
}

export function createParticleState(): ParticleState {
  const basePositions = new Float32Array(PARTICLE_COUNT * 3);
  const velocities = new Float32Array(PARTICLE_COUNT * 3);
  const sizes = new Float32Array(PARTICLE_COUNT);
  const colorMixes = new Float32Array(PARTICLE_COUNT);
  const phases = new Float32Array(PARTICLE_COUNT);

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const r = Math.random() * 4 + 1;

    basePositions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    basePositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    basePositions[i * 3 + 2] = r * Math.cos(phi);

    velocities[i * 3] = (Math.random() - 0.5) * 0.02;
    velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.02;
    velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.02;

    sizes[i] = 1.0 + Math.random() * 2.0;
    colorMixes[i] = Math.random();
    phases[i] = Math.random() * Math.PI * 2;
  }

  return { basePositions, velocities, sizes, colorMixes, phases };
}

export function updateParticles(
  geometry: THREE.BufferGeometry,
  state: ParticleState,
  effect: EffectConfig,
  time: number,
  visibility: number
): void {
  const positions = geometry.attributes.position.array as Float32Array;
  const colors = geometry.attributes.color.array as Float32Array;
  const sizes = geometry.attributes.size.array as Float32Array;

  const { basePositions, phases, sizes: baseSizes, colorMixes } = state;

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const i3 = i * 3;
    const phase = phases[i];
    const mix = colorMixes[i];

    const dx = Math.sin(time * 0.5 + phase) * effect.displacementX;
    const dy = Math.cos(time * 0.7 + phase * 1.3) * effect.displacementY;
    const dz = Math.sin(time * 0.3 + phase * 0.7) * effect.displacementZ;

    positions[i3] = basePositions[i3] + dx;
    positions[i3 + 1] = basePositions[i3 + 1] + dy;
    positions[i3 + 2] = basePositions[i3 + 2] + dz;

    let r: number, g: number, b: number;
    if (mix < 0.33) {
      const t = mix / 0.33;
      r = effect.particleColorLow[0] * (1 - t) + effect.particleColorMid[0] * t;
      g = effect.particleColorLow[1] * (1 - t) + effect.particleColorMid[1] * t;
      b = effect.particleColorLow[2] * (1 - t) + effect.particleColorMid[2] * t;
    } else if (mix < 0.66) {
      const t = (mix - 0.33) / 0.33;
      r = effect.particleColorMid[0] * (1 - t) + effect.particleColorHigh[0] * t;
      g = effect.particleColorMid[1] * (1 - t) + effect.particleColorHigh[1] * t;
      b = effect.particleColorMid[2] * (1 - t) + effect.particleColorHigh[2] * t;
    } else {
      r = effect.particleColorHigh[0];
      g = effect.particleColorHigh[1];
      b = effect.particleColorHigh[2];
    }

    const alpha = visibility;
    colors[i3] = r * alpha;
    colors[i3 + 1] = g * alpha;
    colors[i3 + 2] = b * alpha;

    const pulseFactor = 1.0 + effect.intensity * 0.5 * Math.sin(time * 2.0 + phase);
    sizes[i] = baseSizes[i] * pulseFactor * visibility;
  }

  geometry.attributes.position.needsUpdate = true;
  geometry.attributes.color.needsUpdate = true;
  geometry.attributes.size.needsUpdate = true;
}

export function createParticleGeometry(state: ParticleState): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(PARTICLE_COUNT * 3);
  const colors = new Float32Array(PARTICLE_COUNT * 3);
  const sizes = new Float32Array(PARTICLE_COUNT);

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    positions[i * 3] = state.basePositions[i * 3];
    positions[i * 3 + 1] = state.basePositions[i * 3 + 1];
    positions[i * 3 + 2] = state.basePositions[i * 3 + 2];
    colors[i * 3] = 1.0;
    colors[i * 3 + 1] = 1.0;
    colors[i * 3 + 2] = 1.0;
    sizes[i] = state.sizes[i];
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

  return geometry;
}

export { PARTICLE_COUNT };
