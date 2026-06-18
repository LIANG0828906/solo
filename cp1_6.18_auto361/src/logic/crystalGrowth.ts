import * as THREE from 'three';
import { Crystal, MineralType } from '../types';
import { getMineralById } from '../data/oreData';

export interface GrowthUpdateResult {
  crystals: Crystal[];
  updatedCount: number;
}

const DISTANCE_THRESHOLD = 0.02;
const COLOR_TRANSITION_DURATION = 3000;

const calculateDistance = (a: THREE.Vector3, b: THREE.Vector3): number => {
  return a.distanceTo(b);
};

const checkProximityPenalty = (
  crystal: Crystal,
  allCrystals: Crystal[],
  currentIndex: number
): boolean => {
  for (let i = 0; i < allCrystals.length; i++) {
    if (i === currentIndex) continue;
    const other = allCrystals[i];
    const distance = calculateDistance(crystal.position, other.position);
    const minDistance = (crystal.size + other.size) / 2 + DISTANCE_THRESHOLD;
    if (distance < minDistance) {
      return true;
    }
  }
  return false;
};

export const updateCrystalGrowth = (
  crystals: Crystal[],
  deltaTime: number,
  timeSpeed: number
): GrowthUpdateResult => {
  const updatedCrystals = crystals.map((crystal, index) => {
    const mineral = getMineralById(crystal.mineralType);
    if (!mineral) return crystal;

    let growthRate = mineral.growthRate;
    const hasProximityPenalty = checkProximityPenalty(crystal, crystals, index);
    if (hasProximityPenalty) {
      growthRate *= 0.5;
    }

    const effectiveGrowth = growthRate * deltaTime * timeSpeed;
    const newSize = Math.min(crystal.size + effectiveGrowth, crystal.maxSize);
    const newGrowthProgress = (newSize - 0.1) / (crystal.maxSize - 0.1);

    const age = performance.now() - crystal.createdAt;
    const newColorTransitionProgress = Math.min(
      age / COLOR_TRANSITION_DURATION,
      1.0
    );

    if (
      newSize === crystal.size &&
      newColorTransitionProgress === crystal.colorTransitionProgress
    ) {
      return crystal;
    }

    return {
      ...crystal,
      size: newSize,
      growthProgress: Math.min(Math.max(newGrowthProgress, 0), 1),
      colorTransitionProgress: newColorTransitionProgress,
    };
  });

  return {
    crystals: updatedCrystals,
    updatedCount: updatedCrystals.filter((c, i) => c !== crystals[i]).length,
  };
};

export const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16) / 255,
        g: parseInt(result[2], 16) / 255,
        b: parseInt(result[3], 16) / 255,
      }
    : { r: 1, g: 1, b: 1 };
};

export const interpolateColor = (
  progress: number,
  mineralColor: string
): { color: THREE.Color; opacity: number } => {
  const target = hexToRgb(mineralColor);
  const r = 1 + (target.r - 1) * progress;
  const g = 1 + (target.g - 1) * progress;
  const b = 1 + (target.b - 1) * progress;
  const opacity = 0.2 + 0.8 * progress;
  return {
    color: new THREE.Color(r, g, b),
    opacity,
  };
};

export const getCrystalDisplayColor = (crystal: Crystal): { color: THREE.Color; opacity: number } => {
  const mineral = getMineralById(crystal.mineralType);
  if (!mineral) {
    return { color: new THREE.Color(1, 1, 1), opacity: 0.2 };
  }
  return interpolateColor(crystal.colorTransitionProgress, mineral.color);
};
