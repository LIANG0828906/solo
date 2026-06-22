import { create } from 'zustand';
import type { GameState, CargoType, EventLogEntry } from '../types';
import { v4 as uuid } from 'uuid';

function randomCargo(): CargoType[] {
  const types: CargoType[] = ['crystal', 'ore', 'biosample'];
  for (let i = types.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [types[i], types[j]] = [types[j], types[i]];
  }
  return types;
}

export const initialGameState: GameState = {
  phase: 'menu',
  score: 0,
  distance: 0,
  maxDistance: 5000,
  difficulty: 1,
  shield: 100,
  energy: 100,
  maxEnergy: 100,
  lives: 3,
  maxLives: 3,
  shieldActive: false,
  shieldCooldown: 0,
  shieldCooldownMax: 2,
  shieldDuration: 0,
  shieldDurationMax: 3,
  cargo: randomCargo().map((t) => ({ type: t, integrity: 100 })),
  shipX: 0,
  shipY: 0,
  shipVx: 0,
  shipVy: 0,
  shipSpeed: 300,
  escapeProgress: { progress: 0, active: false },
  asteroids: [],
  debris: [],
  pirates: [],
  pirateLasers: [],
  gravityWells: [],
  energyOrbs: [],
  particles: [],
  stars: [],
  eventLog: [],
  shieldHit: { timer: 0 },
  screenDamage: { timer: 0, lifeLost: 0 },
  pirateSpawnTimer: 10,
  frameCount: 0,
};

interface GameStore extends GameState {
  reset: () => void;
  setPhase: (phase: GameState['phase']) => void;
  updateState: (partial: Partial<GameState>) => void;
  addEvent: (text: string, color: string) => void;
  damageCargo: () => void;
  setShipPosition: (x: number, y: number) => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  ...initialGameState,

  reset: () => {
    const fresh = {
      ...initialGameState,
      cargo: randomCargo().map((t) => ({ type: t, integrity: 100 })),
      phase: 'playing' as const,
    };
    set(fresh);
  },

  setPhase: (phase) => set({ phase }),

  updateState: (partial) => set(partial),

  addEvent: (text, color) => {
    const entry: EventLogEntry = { id: uuid(), text, color, timestamp: Date.now() };
    set((s) => ({
      eventLog: [...s.eventLog.slice(-19), entry],
    }));
  },

  damageCargo: () => {
    set((s) => {
      const cargo = s.cargo.map((c) => ({ ...c }));
      const idx = Math.floor(Math.random() * cargo.length);
      cargo[idx].integrity = Math.max(0, cargo[idx].integrity - 10);
      return { cargo };
    });
  },

  setShipPosition: (x, y) => set({ shipX: x, shipY: y }),
}));
