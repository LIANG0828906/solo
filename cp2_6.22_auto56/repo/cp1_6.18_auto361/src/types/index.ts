import * as THREE from 'three';

export interface MineralType {
  id: string;
  name: string;
  color: string;
  density: number;
  growthRate: number;
}

export interface Crystal {
  id: string;
  mineralType: string;
  position: THREE.Vector3;
  size: number;
  maxSize: number;
  growthProgress: number;
  colorTransitionProgress: number;
  rotation: THREE.Euler;
  createdAt: number;
}

export interface SeedPoint {
  id: string;
  position: THREE.Vector3;
  mineralType: string;
  createdAt: number;
}

export interface Particle {
  id: string;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  color: string;
  size: number;
  life: number;
  maxLife: number;
  createdAt: number;
}

export interface MineralState {
  minerals: Record<string, MineralType>;
  crystals: Crystal[];
  seedPoints: SeedPoint[];
  particles: Particle[];
  timeSpeed: number;
  visibleMinerals: Record<string, boolean>;
  selectedCrystalId: string | null;
  fps: number;
}

export interface MineralActions {
  loadMineralData: () => void;
  generateInitialSeeds: () => void;
  addCrystal: (position: THREE.Vector3, mineralType: string) => void;
  addSeedPoint: (position: THREE.Vector3, mineralType: string) => void;
  updateCrystal: (id: string, updates: Partial<Crystal>) => void;
  removeCrystals: () => void;
  addParticles: (position: THREE.Vector3, color: string, count: number) => void;
  updateParticle: (id: string, updates: Partial<Particle>) => void;
  removeParticles: (ids: string[]) => void;
  setTimeSpeed: (speed: number) => void;
  setMineralVisible: (mineralType: string, visible: boolean) => void;
  selectCrystal: (id: string | null) => void;
  setFps: (fps: number) => void;
  resetAll: () => void;
}

export type MineralStore = MineralState & MineralActions;
