import { create } from 'zustand';
import type { Vec3 } from './physicsEngine';

export interface Asteroid {
  id: string;
  label: string;
  mass: number;
  position: Vec3;
  velocity: Vec3;
  orbitColor: string;
}

export interface Params {
  mass: number;
  speed: number;
  angle: number;
}

interface StoreState {
  asteroids: Asteroid[];
  selectedId: string | null;
  params: Params;
  addAsteroid: (asteroid: Asteroid) => void;
  updateAsteroid: (id: string, data: Partial<Asteroid>) => void;
  removeAsteroid: (id: string) => void;
  selectAsteroid: (id: string | null) => void;
  setParam: <K extends keyof Params>(key: K, value: Params[K]) => void;
}

export const ORBIT_COLORS = ['#ff4466', '#44ff88', '#44aaff'];
export const LABELS = ['A01', 'A02', 'A03'];
export const MAX_ASTEROIDS = 3;

export const useStore = create<StoreState>((set) => ({
  asteroids: [],
  selectedId: null,
  params: {
    mass: 10,
    speed: 2,
    angle: 90,
  },
  addAsteroid: (asteroid) =>
    set((state) => ({
      asteroids: [...state.asteroids, asteroid],
    })),
  updateAsteroid: (id, data) =>
    set((state) => ({
      asteroids: state.asteroids.map((a) =>
        a.id === id ? { ...a, ...data } : a
      ),
    })),
  removeAsteroid: (id) =>
    set((state) => ({
      asteroids: state.asteroids.filter((a) => a.id !== id),
      selectedId: state.selectedId === id ? null : state.selectedId,
    })),
  selectAsteroid: (id) =>
    set(() => ({
      selectedId: id,
    })),
  setParam: (key, value) =>
    set((state) => ({
      params: { ...state.params, [key]: value },
    })),
}));
