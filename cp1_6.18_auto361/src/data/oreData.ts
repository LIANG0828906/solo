import * as THREE from 'three';
import { MineralType, Crystal, SeedPoint } from '../types';

export const MINERAL_TYPES: Record<string, MineralType> = {
  calcite: {
    id: 'calcite',
    name: '方解石',
    color: '#FFF8DC',
    density: 2.71,
    growthRate: 0.015,
  },
  azurite: {
    id: 'azurite',
    name: '蓝铜矿',
    color: '#4169E1',
    density: 3.77,
    growthRate: 0.010,
  },
  fluorite: {
    id: 'fluorite',
    name: '萤石',
    color: '#9370DB',
    density: 3.18,
    growthRate: 0.020,
  },
  pyrite: {
    id: 'pyrite',
    name: '黄铁矿',
    color: '#FFD700',
    density: 5.01,
    growthRate: 0.008,
  },
};

export const MINERAL_ID_LIST = Object.keys(MINERAL_TYPES);

export const getRandomMineralType = (): string => {
  return MINERAL_ID_LIST[Math.floor(Math.random() * MINERAL_ID_LIST.length)];
};

export const getRandomPositionInSphere = (radius: number): THREE.Vector3 => {
  const u = Math.random();
  const v = Math.random();
  const theta = 2 * Math.PI * u;
  const phi = Math.acos(2 * v - 1);
  const r = radius * Math.cbrt(Math.random());
  return new THREE.Vector3(
    r * Math.sin(phi) * Math.cos(theta),
    r * Math.sin(phi) * Math.sin(theta),
    r * Math.cos(phi)
  );
};

export const generateInitialSeedPoints = (): SeedPoint[] => {
  const seedCount = 30 + Math.floor(Math.random() * 21);
  const seeds: SeedPoint[] = [];
  for (let i = 0; i < seedCount; i++) {
    const mineralType = getRandomMineralType();
    seeds.push({
      id: `seed-${Date.now()}-${i}`,
      position: getRandomPositionInSphere(3),
      mineralType,
      createdAt: performance.now(),
    });
  }
  return seeds;
};

export const generateInitialCrystals = (seeds: SeedPoint[]): Crystal[] => {
  return seeds.map((seed) => ({
    id: `crystal-${seed.id}`,
    mineralType: seed.mineralType,
    position: seed.position.clone(),
    size: 0.1,
    maxSize: 0.4 + Math.random() * 0.2,
    growthProgress: 0,
    colorTransitionProgress: 0,
    rotation: new THREE.Euler(
      Math.random() * Math.PI * 2,
      Math.random() * Math.PI * 2,
      Math.random() * Math.PI * 2
    ),
    createdAt: seed.createdAt,
  }));
};

export const getMineralById = (id: string): MineralType | undefined => {
  return MINERAL_TYPES[id];
};

export const createNewCrystal = (position: THREE.Vector3, mineralType: string): Crystal => {
  const now = performance.now();
  return {
    id: `crystal-${now}-${Math.random().toString(36).substr(2, 9)}`,
    mineralType,
    position: position.clone(),
    size: 0.1,
    maxSize: 0.4 + Math.random() * 0.2,
    growthProgress: 0,
    colorTransitionProgress: 0,
    rotation: new THREE.Euler(
      Math.random() * Math.PI * 2,
      Math.random() * Math.PI * 2,
      Math.random() * Math.PI * 2
    ),
    createdAt: now,
  };
};
