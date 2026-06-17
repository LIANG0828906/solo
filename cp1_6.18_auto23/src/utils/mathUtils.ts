import * as THREE from 'three';

export const lerp = (from: number, to: number, t: number): number => {
  return from + (to - from) * t;
};

export const smoothStep = (edge0: number, edge1: number, x: number): number => {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
};

export const clamp = (value: number, min: number, max: number): number => {
  return Math.max(min, Math.min(max, value));
};

export const fibonacciSphere = (
  samples: number,
  index: number,
  radius: number
): THREE.Vector3 => {
  const phi = Math.acos(1 - (2 * (index + 0.5)) / samples);
  const theta = Math.PI * (1 + Math.sqrt(5)) * index;
  return new THREE.Vector3(
    radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.sin(phi) * Math.sin(theta),
    radius * Math.cos(phi)
  );
};

export const generateSpiralPosition = (
  nodeIndex: number,
  totalNodes: number,
  spiralRadius: number,
  branchDensity: number,
  stemHeight: number = 4
): THREE.Vector3 => {
  const progress = nodeIndex / totalNodes;
  const stemY = (progress - 0.5) * stemHeight;
  const phi = nodeIndex * 0.618 * Math.PI * 2 * branchDensity;
  const radialFactor = Math.sin(progress * Math.PI) * spiralRadius;
  const branchOffset = (nodeIndex % Math.ceil(branchDensity)) * (2 * Math.PI / branchDensity);
  
  const x = Math.cos(phi + branchOffset) * radialFactor * (0.5 + Math.random() * 0.5);
  const z = Math.sin(phi + branchOffset) * radialFactor * (0.5 + Math.random() * 0.5);
  const y = stemY + (Math.random() - 0.5) * 0.3;
  
  return new THREE.Vector3(x, y, z);
};

export const easeInOutCubic = (t: number): number => {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
};

export const easeOutQuart = (t: number): number => {
  return 1 - Math.pow(1 - t, 4);
};

export const randomRange = (min: number, max: number): number => {
  return min + Math.random() * (max - min);
};
