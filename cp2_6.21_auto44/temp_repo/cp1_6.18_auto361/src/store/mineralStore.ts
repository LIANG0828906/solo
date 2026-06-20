import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import * as THREE from 'three';
import { MineralStore, MineralType, Crystal, SeedPoint, Particle } from '../types';

const DEFAULT_MINERALS: Record<string, MineralType> = {
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

const MINERAL_IDS = Object.keys(DEFAULT_MINERALS);

const getRandomMineralType = (): string => {
  return MINERAL_IDS[Math.floor(Math.random() * MINERAL_IDS.length)];
};

const getRandomPositionInSphere = (radius: number): THREE.Vector3 => {
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

const MAX_PARTICLES = 500;

export const useMineralStore = create<MineralStore>((set, get) => ({
  minerals: DEFAULT_MINERALS,
  crystals: [],
  seedPoints: [],
  particles: [],
  timeSpeed: 1,
  visibleMinerals: {
    calcite: true,
    azurite: true,
    fluorite: true,
    pyrite: true,
  },
  selectedCrystalId: null,
  fps: 0,

  loadMineralData: () => {
    const visible: Record<string, boolean> = {};
    MINERAL_IDS.forEach((id) => {
      visible[id] = true;
    });
    set({ minerals: DEFAULT_MINERALS, visibleMinerals: visible });
  },

  generateInitialSeeds: () => {
    const seedCount = 30 + Math.floor(Math.random() * 21);
    const seeds: SeedPoint[] = [];
    const initialCrystals: Crystal[] = [];
    const now = performance.now();

    for (let i = 0; i < seedCount; i++) {
      const position = getRandomPositionInSphere(3);
      const mineralType = getRandomMineralType();
      const mineral = DEFAULT_MINERALS[mineralType];

      seeds.push({
        id: uuidv4(),
        position,
        mineralType,
        createdAt: now,
      });

      if (mineral) {
        const maxSize = 0.4 + Math.random() * 0.2;
        initialCrystals.push({
          id: uuidv4(),
          mineralType,
          position: position.clone(),
          size: 0.12 + Math.random() * 0.08,
          maxSize,
          growthProgress: 0,
          colorTransitionProgress: Math.min(0.3 + Math.random() * 0.3, 1),
          rotation: new THREE.Euler(
            Math.random() * Math.PI * 2,
            Math.random() * Math.PI * 2,
            Math.random() * Math.PI * 2
          ),
          createdAt: now - Math.random() * 2000,
        });
      }
    }
    set({ seedPoints: seeds, crystals: initialCrystals, particles: [] });
  },

  addCrystal: (position: THREE.Vector3, mineralType: string) => {
    const state = get();
    const mineral = state.minerals[mineralType];
    if (!mineral) return;

    const maxSize = 0.6 - Math.random() * 0.2;
    const newCrystal: Crystal = {
      id: uuidv4(),
      mineralType,
      position: position.clone(),
      size: 0.1,
      maxSize,
      growthProgress: 0,
      colorTransitionProgress: 0,
      rotation: new THREE.Euler(
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2
      ),
      createdAt: performance.now(),
    };
    set({ crystals: [...state.crystals, newCrystal] });
  },

  addSeedPoint: (position: THREE.Vector3, mineralType: string) => {
    const state = get();
    const newSeed: SeedPoint = {
      id: uuidv4(),
      position: position.clone(),
      mineralType,
      createdAt: performance.now(),
    };
    set({ seedPoints: [...state.seedPoints, newSeed] });
    state.addParticles(position, state.minerals[mineralType]?.color || '#FFFFFF', 10 + Math.floor(Math.random() * 6));
    state.addCrystal(position, mineralType);
  },

  updateCrystal: (id: string, updates: Partial<Crystal>) => {
    set((state) => ({
      crystals: state.crystals.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    }));
  },

  removeCrystals: () => {
    set({ crystals: [], seedPoints: [] });
  },

  addParticles: (position: THREE.Vector3, color: string, count: number) => {
    const state = get();
    const newParticles: Particle[] = [];
    const now = performance.now();

    for (let i = 0; i < count; i++) {
      const direction = new THREE.Vector3(
        Math.random() - 0.5,
        Math.random() - 0.5,
        Math.random() - 0.5
      ).normalize();
      newParticles.push({
        id: uuidv4(),
        position: position.clone(),
        velocity: direction.multiplyScalar(0.2),
        color,
        size: 0.01,
        life: 1.5,
        maxLife: 1.5,
        createdAt: now,
      });
    }

    let allParticles = [...state.particles, ...newParticles];
    if (allParticles.length > MAX_PARTICLES) {
      allParticles = allParticles.slice(-MAX_PARTICLES);
    }
    set({ particles: allParticles });
  },

  updateParticle: (id: string, updates: Partial<Particle>) => {
    set((state) => ({
      particles: state.particles.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    }));
  },

  removeParticles: (ids: string[]) => {
    set((state) => ({
      particles: state.particles.filter((p) => !ids.includes(p.id)),
    }));
  },

  setTimeSpeed: (speed: number) => {
    set({ timeSpeed: speed });
  },

  setMineralVisible: (mineralType: string, visible: boolean) => {
    set((state) => ({
      visibleMinerals: { ...state.visibleMinerals, [mineralType]: visible },
    }));
  },

  selectCrystal: (id: string | null) => {
    set({ selectedCrystalId: id });
  },

  setFps: (fps: number) => {
    set({ fps });
  },

  resetAll: () => {
    const state = get();
    state.removeCrystals();
    state.generateInitialSeeds();
  },
}));
