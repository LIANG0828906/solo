import { create } from 'zustand';
import {
  GameState,
  Alien,
  Bullet,
  MagicEffect,
  TrajectoryPoint,
  RuneType,
  StarParticle,
  CANVAS_WIDTH,
  GAME_AREA_HEIGHT,
  INITIAL_ENERGY,
  MAX_ENERGY,
} from './types';

interface GameStore {
  gameState: GameState;
  aliens: Alien[];
  bullets: Bullet[];
  magicEffects: MagicEffect[];
  trajectory: TrajectoryPoint[];
  isDrawing: boolean;
  energy: number;
  score: number;
  combo: number;
  escapedCount: number;
  lastWaveTime: number;
  lastEnergyRegenTime: number;
  selectedRune: RuneType | null;
  matchFailFlash: boolean;
  comboBreak: boolean;
  shieldActive: boolean;
  shieldEndTime: number;
  starParticles: StarParticle[];

  startGame: () => void;
  resetGame: () => void;
  addAlien: (alien: Alien) => void;
  removeAlien: (id: string) => void;
  updateAlien: (id: string, updates: Partial<Alien>) => void;
  addBullet: (bullet: Bullet) => void;
  removeBullet: (id: string) => void;
  updateBullet: (id: string, updates: Partial<Bullet>) => void;
  addMagicEffect: (effect: MagicEffect) => void;
  removeMagicEffect: (id: string) => void;
  addTrajectoryPoint: (point: TrajectoryPoint) => void;
  clearTrajectory: () => void;
  setDrawing: (drawing: boolean) => void;
  consumeEnergy: (amount: number) => boolean;
  addEnergy: (amount: number) => void;
  regenerateEnergy: () => void;
  addScore: (amount: number) => void;
  incrementCombo: () => void;
  resetCombo: () => void;
  incrementEscaped: () => void;
  setLastWaveTime: (time: number) => void;
  setLastEnergyRegenTime: (time: number) => void;
  setSelectedRune: (rune: RuneType | null) => void;
  triggerMatchFail: () => void;
  clearMatchFail: () => void;
  triggerComboBreak: () => void;
  clearComboBreak: () => void;
  activateShield: (duration: number) => void;
  deactivateShield: () => void;
  updateStarParticles: () => void;
  setGameOver: () => void;
}

const generateStarParticles = (): StarParticle[] => {
  const particles: StarParticle[] = [];
  for (let i = 0; i < 20; i++) {
    particles.push({
      x: Math.random() * CANVAS_WIDTH,
      y: Math.random() * GAME_AREA_HEIGHT,
      brightness: Math.random(),
    });
  }
  return particles;
};

const getInitialState = () => ({
  gameState: GameState.PLAYING,
  aliens: [],
  bullets: [],
  magicEffects: [],
  trajectory: [],
  isDrawing: false,
  energy: INITIAL_ENERGY,
  score: 0,
  combo: 0,
  escapedCount: 0,
  lastWaveTime: 0,
  lastEnergyRegenTime: Date.now(),
  selectedRune: null,
  matchFailFlash: false,
  comboBreak: false,
  shieldActive: false,
  shieldEndTime: 0,
  starParticles: generateStarParticles(),
});

export const useGameStore = create<GameStore>((set, get) => ({
  ...getInitialState(),

  startGame: () => {
    set({
      ...getInitialState(),
      lastWaveTime: Date.now(),
      lastEnergyRegenTime: Date.now(),
    });
  },

  resetGame: () => {
    set({
      ...getInitialState(),
      lastWaveTime: Date.now(),
      lastEnergyRegenTime: Date.now(),
    });
  },

  addAlien: (alien) => set((state) => ({ aliens: [...state.aliens, alien] })),

  removeAlien: (id) => set((state) => ({
    aliens: state.aliens.filter((a) => a.id !== id),
  })),

  updateAlien: (id, updates) => set((state) => ({
    aliens: state.aliens.map((a) =>
      a.id === id ? { ...a, ...updates } : a
    ),
  })),

  addBullet: (bullet) => set((state) => ({ bullets: [...state.bullets, bullet] })),

  removeBullet: (id) => set((state) => ({
    bullets: state.bullets.filter((b) => b.id !== id),
  })),

  updateBullet: (id, updates) => set((state) => ({
    bullets: state.bullets.map((b) =>
      b.id === id ? { ...b, ...updates } : b
    ),
  })),

  addMagicEffect: (effect) => set((state) => ({
    magicEffects: [...state.magicEffects, effect],
  })),

  removeMagicEffect: (id) => set((state) => ({
    magicEffects: state.magicEffects.filter((e) => e.id !== id),
  })),

  addTrajectoryPoint: (point) => set((state) => ({
    trajectory: [...state.trajectory, point],
  })),

  clearTrajectory: () => set({ trajectory: [] }),

  setDrawing: (drawing) => set({ isDrawing: drawing }),

  consumeEnergy: (amount) => {
    const state = get();
    if (state.energy >= amount) {
      set({ energy: state.energy - amount });
      return true;
    }
    return false;
  },

  addEnergy: (amount) => set((state) => ({
    energy: Math.min(MAX_ENERGY, state.energy + amount),
  })),

  regenerateEnergy: () => set((state) => ({
    energy: Math.min(MAX_ENERGY, state.energy + 1),
  })),

  addScore: (amount) => set((state) => ({ score: state.score + amount })),

  incrementCombo: () => set((state) => ({ combo: state.combo + 1 })),

  resetCombo: () => set({ combo: 0 }),

  incrementEscaped: () => set((state) => {
    const newCount = state.escapedCount + 1;
    if (newCount >= 3) {
      return { escapedCount: newCount, gameState: GameState.GAME_OVER };
    }
    return { escapedCount: newCount };
  }),

  setLastWaveTime: (time) => set({ lastWaveTime: time }),

  setLastEnergyRegenTime: (time) => set({ lastEnergyRegenTime: time }),

  setSelectedRune: (rune) => set({ selectedRune: rune }),

  triggerMatchFail: () => set({ matchFailFlash: true }),

  clearMatchFail: () => set({ matchFailFlash: false }),

  triggerComboBreak: () => set({ comboBreak: true }),

  clearComboBreak: () => set({ comboBreak: false }),

  activateShield: (duration) => set({
    shieldActive: true,
    shieldEndTime: Date.now() + duration,
  }),

  deactivateShield: () => set({ shieldActive: false }),

  updateStarParticles: () => set((state) => ({
    starParticles: state.starParticles.map((p) => ({
      ...p,
      brightness: 0.3 + Math.random() * 0.7,
    })),
  })),

  setGameOver: () => set({ gameState: GameState.GAME_OVER }),
}));
