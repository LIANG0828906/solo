import * as THREE from 'three';
import { Vector3 } from 'three';

export function calculateFragmentCount(poundingCount: number): number {
  const baseCount = 8;
  const maxCount = 64;
  const increment = 8;
  return Math.min(baseCount + Math.floor(poundingCount / 2) * increment, maxCount);
}

export function calculatePowderParticles(poundingCount: number, speed: number): number {
  const baseParticles = poundingCount * 2;
  const speedMultiplier = speed < 0.15 ? 1.5 : speed < 0.25 ? 1 : 0.7;
  return Math.min(Math.floor(baseParticles * speedMultiplier), 50);
}

export function updateFragmentColor(poundingCount: number, baseColor: string): string {
  const color = new THREE.Color(baseColor);
  const lightenFactor = Math.min(poundingCount * 0.03, 0.4);
  const r = Math.min(color.r + lightenFactor, 1);
  const g = Math.min(color.g + lightenFactor, 1);
  const b = Math.min(color.b + lightenFactor, 1);
  return `#${new THREE.Color(r, g, b).getHexString()}`;
}

export function detectPoundingSpeed(duration: number): 'fast' | 'normal' | 'slow' {
  if (duration < 0.15) return 'fast';
  if (duration < 0.25) return 'normal';
  return 'slow';
}

export function calculateScaleAngle(weight: number, maxWeight: number): number {
  const ratio = Math.min(Math.max(weight / maxWeight, -1), 1);
  return ratio * 45 * (Math.PI / 180);
}

export function checkDosageComplete(
  currentWeight: number,
  requiredDosage: number,
  tolerance: number = 0.05
): boolean {
  const lower = requiredDosage * (1 - tolerance);
  const upper = requiredDosage * (1 + tolerance);
  return currentWeight >= lower && currentWeight <= upper;
}

export function gramToQian(grams: number): number {
  return grams / 5;
}

export function qianToGram(qian: number): number {
  return qian * 5;
}

export function checkDropCollision(
  draggedPos: Vector3,
  targetPos: Vector3,
  threshold: number = 0.3
): boolean {
  const distance = draggedPos.distanceTo(targetPos);
  return distance < threshold;
}

export function calculateSnapPosition(
  draggedPos: Vector3,
  targetPos: Vector3
): Vector3 {
  return targetPos.clone();
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16) / 255,
        g: parseInt(result[2], 16) / 255,
        b: parseInt(result[3], 16) / 255,
      }
    : { r: 0.5, g: 0.5, b: 0.5 };
}

export function generateHerbParticles(
  count: number,
  color: string,
  center: Vector3,
  spread: number = 0.2
): { positions: Float32Array; colors: Float32Array } {
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const rgb = hexToRgb(color);

  for (let i = 0; i < count; i++) {
    positions[i * 3] = center.x + (Math.random() - 0.5) * spread;
    positions[i * 3 + 1] = center.y + Math.random() * 0.1;
    positions[i * 3 + 2] = center.z + (Math.random() - 0.5) * spread;

    const colorVariation = 0.9 + Math.random() * 0.2;
    colors[i * 3] = rgb.r * colorVariation;
    colors[i * 3 + 1] = rgb.g * colorVariation;
    colors[i * 3 + 2] = rgb.b * colorVariation;
  }

  return { positions, colors };
}

export function generatePowderParticles(
  count: number,
  center: Vector3
): { positions: Float32Array; colors: Float32Array; velocities: Float32Array } {
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const velocities = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    positions[i * 3] = center.x + (Math.random() - 0.5) * 0.1;
    positions[i * 3 + 1] = center.y + Math.random() * 0.05;
    positions[i * 3 + 2] = center.z + (Math.random() - 0.5) * 0.1;

    const alpha = 0.3 + Math.random() * 0.4;
    colors[i * 3] = 1;
    colors[i * 3 + 1] = 1;
    colors[i * 3 + 2] = alpha;

    velocities[i * 3] = (Math.random() - 0.5) * 0.02;
    velocities[i * 3 + 1] = 0.01 + Math.random() * 0.03;
    velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.02;
  }

  return { positions, colors, velocities };
}
