import { Star } from '@/types';
import * as THREE from 'three';

export function calculateDistance3D(
  x1: number,
  y1: number,
  z1: number,
  x2: number,
  y2: number,
  z2: number
): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const dz = z2 - z1;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

export function calculateStarDistance(star1: Star, star2: Star): number {
  return calculateDistance3D(star1.x, star1.y, star1.z, star2.x, star2.y, star2.z);
}

export function getMidpoint(
  x1: number,
  y1: number,
  z1: number,
  x2: number,
  y2: number,
  z2: number
): [number, number, number] {
  return [(x1 + x2) / 2, (y1 + y2) / 2, (z1 + z2) / 2];
}

export function worldToScreen(
  position: [number, number, number],
  camera: THREE.Camera,
  width: number,
  height: number
): { x: number; y: number; visible: boolean } {
  const vector = new THREE.Vector3(position[0], position[1], position[2]);
  vector.project(camera);

  const x = (vector.x * 0.5 + 0.5) * width;
  const y = (-vector.y * 0.5 + 0.5) * height;
  const visible = vector.z >= -1 && vector.z <= 1;

  return { x, y, visible };
}

export function formatDistance(lightYears: number): string {
  if (lightYears >= 1000) {
    return `${(lightYears / 1000).toFixed(1)}k ly`;
  }
  return `${lightYears.toFixed(1)} ly`;
}

export function getLineKey(startId: string, endId: string): string {
  return [startId, endId].sort().join('-');
}

export function snapToStarCenter(
  x: number,
  y: number,
  z: number,
  star: Star
): [number, number, number] {
  return [star.x, star.y, star.z];
}
