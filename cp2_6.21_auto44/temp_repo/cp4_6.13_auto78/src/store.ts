import { create } from 'zustand';

export interface Building {
  id: string;
  height: number;
  position: [number, number, number];
  width: number;
  topLightColor: string;
  createdAt: number;
}

export interface Car {
  id: string;
  angle: number;
  baseSpeed: number;
  speed: number;
  color: string;
  boostEndTime?: number;
  selected: boolean;
}

export const ROAD_RADIUS_X = 80;
export const ROAD_RADIUS_Z = 60;

interface CityState {
  time: number;
  buildings: Building[];
  cars: Car[];
  isAddingBuilding: boolean;
  selectedBuildingId: string | null;
  setTime: (t: number) => void;
  addBuilding: (b: Omit<Building, 'id' | 'createdAt'>) => void;
  updateBuilding: (id: string, updates: Partial<Building>) => void;
  removeBuilding: (id: string) => void;
  generateRandomDistrict: () => void;
  setIsAddingBuilding: (v: boolean) => void;
  setSelectedBuildingId: (id: string | null) => void;
  boostCar: (id: string) => void;
  setCarSelected: (id: string | null) => void;
  updateCars: (delta: number) => void;
  initCars: () => void;
}

const generateId = (): string => Math.random().toString(36).slice(2, 10);

const lerpColor = (a: string, b: string, t: number): string => {
  const ah = parseInt(a.replace('#', ''), 16);
  const bh = parseInt(b.replace('#', ''), 16);
  const ar = (ah >> 16) & 255, ag = (ah >> 8) & 255, ab = ah & 255;
  const br = (bh >> 16) & 255, bg = (bh >> 8) & 255, bb = bh & 255;
  const rr = Math.round(ar + (br - ar) * t);
  const rg = Math.round(ag + (bg - ag) * t);
  const rb = Math.round(ab + (bb - ab) * t);
  return '#' + ((rr << 16) | (rg << 8) | rb).toString(16).padStart(6, '0');
};

const getBuildingColor = (height: number): string => {
  const t = Math.min((height - 10) / 70, 1);
  return lerpColor('#d0d0d0', '#1e3a5f', t);
};

const CAR_COLORS = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6', '#ecf0f1', '#34495e', '#e67e22'];

const createInitialCars = (): Car[] => {
  const cars: Car[] = [];
  for (let i = 0; i < 15; i++) {
    cars.push({
      id: generateId(),
      angle: (i / 15) * Math.PI * 2,
      baseSpeed: 10,
      speed: 10,
      color: CAR_COLORS[Math.floor(Math.random() * CAR_COLORS.length)],
      selected: false,
    });
  }
  return cars;
};

export const useCityStore = create<CityState>((set, get) => ({
  time: 12,
  buildings: [],
  cars: [],
  isAddingBuilding: false,
  selectedBuildingId: null,

  setTime: (t) => set({ time: t }),

  addBuilding: (b) =>
    set((state) => ({
      buildings: [
        ...state.buildings,
        { ...b, id: generateId(), createdAt: performance.now() },
      ],
    })),

  updateBuilding: (id, updates) =>
    set((state) => ({
      buildings: state.buildings.map((b) =>
        b.id === id ? { ...b, ...updates } : b
      ),
    })),

  removeBuilding: (id) =>
    set((state) => ({
      buildings: state.buildings.filter((b) => b.id !== id),
      selectedBuildingId: state.selectedBuildingId === id ? null : state.selectedBuildingId,
    })),

  generateRandomDistrict: () => {
    const buildings: Building[] = [];
    const now = performance.now();
    for (let gx = 0; gx < 5; gx++) {
      for (let gz = 0; gz < 5; gz++) {
        const height = 10 + Math.random() * 70;
        const width = 5 + Math.random() * 5;
        const x = (gx - 2) * 16 + (Math.random() - 0.5) * 4;
        const z = (gz - 2) * 16 + (Math.random() - 0.5) * 4;
        buildings.push({
          id: generateId(),
          height,
          position: [x, 0, z],
          width,
          topLightColor: '#' + Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0'),
          createdAt: now - gx * 100 - gz * 10,
        });
      }
    }
    set({ buildings });
  },

  setIsAddingBuilding: (v) => set({ isAddingBuilding: v }),
  setSelectedBuildingId: (id) => set({ selectedBuildingId: id }),

  boostCar: (id) =>
    set((state) => ({
      cars: state.cars.map((c) =>
        c.id === id
          ? { ...c, speed: 20, boostEndTime: performance.now() + 3000 }
          : c
      ),
    })),

  setCarSelected: (id) =>
    set((state) => ({
      cars: state.cars.map((c) => ({ ...c, selected: c.id === id })),
    })),

  updateCars: (delta) => {
    const now = performance.now();
    set((state) => ({
      cars: state.cars.map((c) => {
        let speed = c.speed;
        if (c.boostEndTime && now >= c.boostEndTime) {
          speed = c.baseSpeed;
        }
        const radiusX = ROAD_RADIUS_X;
        const radiusZ = ROAD_RADIUS_Z;
        const circumference = 2 * Math.PI * Math.sqrt((radiusX * radiusX + radiusZ * radiusZ) / 2);
        const angularSpeed = (speed / circumference) * Math.PI * 2;
        return {
          ...c,
          angle: (c.angle + angularSpeed * delta) % (Math.PI * 2),
          speed: c.boostEndTime && now >= c.boostEndTime ? c.baseSpeed : speed,
          boostEndTime: c.boostEndTime && now >= c.boostEndTime ? undefined : c.boostEndTime,
        };
      }),
    }));
  },

  initCars: () => {
    if (get().cars.length === 0) {
      set({ cars: createInitialCars() });
    }
  },
}));

export { getBuildingColor };
