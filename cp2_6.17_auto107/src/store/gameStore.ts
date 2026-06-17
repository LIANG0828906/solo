import { create } from 'zustand';
import { GameEngine, GameStateSnapshot } from '../engine/GameEngine';

interface GameStore {
  snapshot: GameStateSnapshot | null;
  engine: GameEngine | null;
  initEngine: (width: number, height: number) => void;
  updateGame: (dt: number, keys: Set<string>) => void;
  selectUpgrade: (index: number) => void;
  restartGame: () => void;
  resizeCanvas: (width: number, height: number) => void;
}

const defaultSnapshot: GameStateSnapshot = {
  player: {
    x: 0, y: 0, width: 40, height: 40, speed: 240,
    health: 3, maxHealth: 3, fireRate: 150,
    bulletWidth: 4, bulletHeight: 16,
    invincible: false, invincibleTimer: 0, invincibleBlink: false,
    fireRateLevel: 0, bulletSizeLevel: 0, speedLevel: 0,
  },
  bullets: [],
  asteroids: [],
  enemies: [],
  fragmentDrops: [],
  particles: [],
  stars: [],
  wave: 0,
  score: 0,
  kills: 0,
  fragmentCount: 0,
  gameState: 'playing',
  upgradeOptions: [],
  canvasWidth: 0,
  canvasHeight: 0,
};

export const useGameStore = create<GameStore>((set, get) => ({
  snapshot: defaultSnapshot,
  engine: null,

  initEngine: (width: number, height: number) => {
    const engine = new GameEngine(width, height);
    const snapshot = engine.update(0, new Set());
    set({ engine, snapshot });
  },

  updateGame: (dt: number, keys: Set<string>) => {
    const engine = get().engine;
    if (!engine) return;
    const snapshot = engine.update(dt, keys);
    set({ snapshot });
  },

  selectUpgrade: (index: number) => {
    const engine = get().engine;
    if (!engine) return;
    engine.selectUpgrade(index);
    const snapshot = engine.update(0, new Set());
    set({ snapshot });
  },

  restartGame: () => {
    const engine = get().engine;
    if (!engine) return;
    engine.restart();
    const snapshot = engine.update(0, new Set());
    set({ snapshot });
  },

  resizeCanvas: (width: number, height: number) => {
    const engine = get().engine;
    if (!engine) return;
    engine.resize(width, height);
  },
}));
