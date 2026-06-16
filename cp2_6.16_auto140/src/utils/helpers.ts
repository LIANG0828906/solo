import * as THREE from 'three';
import { v4 as uuidv4 } from 'uuid';
import type { AABB } from '../types';

export const generateId = (): string => uuidv4();

export const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, value));

export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

export const getRoadWidth = (screenWidth: number): number => {
  if (screenWidth > 1200) return screenWidth * 0.6;
  if (screenWidth >= 768) return screenWidth * 0.8;
  return screenWidth;
};

export const getRoadWorldWidth = (): number => 20;

export const aabbIntersect = (a: AABB, b: AABB): boolean => {
  return (
    a.minX < b.maxX &&
    a.maxX > b.minX &&
    a.minZ < b.maxZ &&
    a.maxZ > b.minZ
  );
};

export const computeAABB = (
  position: THREE.Vector3,
  width: number,
  depth: number
): AABB => ({
  minX: position.x - width / 2,
  maxX: position.x + width / 2,
  minZ: position.z - depth / 2,
  maxZ: position.z + depth / 2,
});

export const randomRange = (min: number, max: number): number =>
  Math.random() * (max - min) + min;

export const randomChoice = <T>(arr: T[]): T =>
  arr[Math.floor(Math.random() * arr.length)];

export const getUiScale = (screenWidth: number): number => {
  if (screenWidth < 768) return 1.4;
  if (screenWidth < 1200) return 1.1;
  return 1;
};
