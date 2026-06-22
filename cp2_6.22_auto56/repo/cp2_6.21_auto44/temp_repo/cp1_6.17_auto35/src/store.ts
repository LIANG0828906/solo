import { create } from 'zustand';
import { Season, TownState, House, Tree } from './types';

const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;

const initialHouses: House[] = [
  { x: 120, y: 380, width: 100, height: 80, roofHeight: 40, smoking: false, smokeTimer: 0 },
  { x: 350, y: 400, width: 120, height: 90, roofHeight: 45, smoking: false, smokeTimer: 0 },
  { x: 580, y: 370, width: 90, height: 75, roofHeight: 38, smoking: false, smokeTimer: 0 },
];

const initialTrees: Tree[] = [
  { x: 70, y: 300, crownDiameter: 60, trunkWidth: 12, trunkHeight: 50 },
  { x: 260, y: 280, crownDiameter: 70, trunkWidth: 14, trunkHeight: 55 },
  { x: 500, y: 290, crownDiameter: 55, trunkWidth: 10, trunkHeight: 48 },
  { x: 700, y: 310, crownDiameter: 65, trunkWidth: 13, trunkHeight: 52 },
  { x: 180, y: 470, crownDiameter: 50, trunkWidth: 10, trunkHeight: 40 },
  { x: 450, y: 490, crownDiameter: 55, trunkWidth: 11, trunkHeight: 42 },
  { x: 650, y: 480, crownDiameter: 48, trunkWidth: 9, trunkHeight: 38 },
];

interface TownStore extends TownState {
  setSeason: (season: Season) => void;
  setParticleCount: (count: number) => void;
  setParticles: (particles: TownState['particles']) => void;
  setSmokeParticles: (smokeParticles: TownState['smokeParticles']) => void;
  addSmokeParticle: (smoke: TownState['smokeParticles'][number]) => void;
  incrementFrame: () => void;
  setHouseSmoking: (houseIndex: number, smoking: boolean) => void;
  updateHouseSmokeTimer: (houseIndex: number, delta: number) => void;
  getCanvasSize: () => { width: number; height: number };
}

export const useTownStore = create<TownStore>((set, get) => ({
  season: Season.SPRING,
  particleCount: 20,
  particles: [],
  smokeParticles: [],
  houses: initialHouses,
  trees: initialTrees,
  frame: 0,

  setSeason: (season) => set({ season }),

  setParticleCount: (particleCount) => set({ particleCount }),

  setParticles: (particles) => set({ particles }),

  setSmokeParticles: (smokeParticles) => set({ smokeParticles }),

  addSmokeParticle: (smoke) =>
    set((state) => ({ smokeParticles: [...state.smokeParticles, smoke] })),

  incrementFrame: () => set((state) => ({ frame: state.frame + 1 })),

  setHouseSmoking: (houseIndex, smoking) =>
    set((state) => ({
      houses: state.houses.map((h, i) =>
        i === houseIndex ? { ...h, smoking, smokeTimer: smoking ? 0 : 0 } : h
      ),
    })),

  updateHouseSmokeTimer: (houseIndex, delta) =>
    set((state) => ({
      houses: state.houses.map((h, i) =>
        i === houseIndex ? { ...h, smokeTimer: h.smokeTimer + delta } : h
      ),
    })),

  getCanvasSize: () => ({ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }),
}));
