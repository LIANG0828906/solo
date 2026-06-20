import { create } from 'zustand';

export interface EnemyShip {
  id: string;
  type: 'mengchong' | 'doujian';
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  speed: number;
  direction: 1 | -1;
  isSinking: boolean;
  isGrappling: boolean;
}

export interface Particle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
}

export interface ReedBoat {
  id: string;
  x: number;
  speed: number;
}

interface BattleState {
  score: number;
  combo: number;
  maxCombo: number;
  morale: number;
  battleTime: number;
  enemies: EnemyShip[];
  particles: Particle[];
  reedBoats: ReedBoat[];
  playerShipAngle: number;
  isPlayerHit: boolean;
  lastKillTime: number;
  comboTimer: number;
  addScore: (points: number) => void;
  addCombo: () => void;
  resetCombo: () => void;
  setMorale: (value: number) => void;
  addEnemy: (enemy: EnemyShip) => void;
  removeEnemy: (id: string) => void;
  updateEnemy: (id: string, updates: Partial<EnemyShip>) => void;
  addParticle: (particle: Particle) => void;
  removeParticle: (id: string) => void;
  addReedBoat: (boat: ReedBoat) => void;
  removeReedBoat: (id: string) => void;
  setPlayerShipAngle: (angle: number) => void;
  setIsPlayerHit: (value: boolean) => void;
  updateBattleTime: (delta: number) => void;
  resetBattle: () => void;
  updateComboTimer: (delta: number) => void;
}

const generateId = () => Math.random().toString(36).substr(2, 9);

export const useBattleState = create<BattleState>((set) => ({
  score: 0,
  combo: 0,
  maxCombo: 0,
  morale: 100,
  battleTime: 0,
  enemies: [],
  particles: [],
  reedBoats: [],
  playerShipAngle: 0,
  isPlayerHit: false,
  lastKillTime: 0,
  comboTimer: 0,

  addScore: (points) => set((state) => {
    const comboBonus = state.combo > 2 ? Math.floor(points * 0.5 * (state.combo - 2)) : 0;
    return { score: state.score + points + comboBonus };
  }),

  addCombo: () => set((state) => {
    const newCombo = state.combo + 1;
    return {
      combo: newCombo,
      maxCombo: Math.max(state.maxCombo, newCombo),
      lastKillTime: Date.now(),
      comboTimer: 3,
    };
  }),

  resetCombo: () => set({ combo: 0, comboTimer: 0 }),

  setMorale: (value) => set({ morale: Math.max(0, Math.min(100, value)) }),

  addEnemy: (enemy) => set((state) => ({
    enemies: [...state.enemies, { ...enemy, id: generateId() }],
  })),

  removeEnemy: (id) => set((state) => ({
    enemies: state.enemies.filter((e) => e.id !== id),
  })),

  updateEnemy: (id, updates) => set((state) => ({
    enemies: state.enemies.map((e) =>
      e.id === id ? { ...e, ...updates } : e
    ),
  })),

  addParticle: (particle) => set((state) => ({
    particles: [...state.particles, { ...particle, id: generateId() }].slice(-20),
  })),

  removeParticle: (id) => set((state) => ({
    particles: state.particles.filter((p) => p.id !== id),
  })),

  addReedBoat: (boat) => set((state) => ({
    reedBoats: [...state.reedBoats, { ...boat, id: generateId() }],
  })),

  removeReedBoat: (id) => set((state) => ({
    reedBoats: state.reedBoats.filter((b) => b.id !== id),
  })),

  setPlayerShipAngle: (angle) => set({ playerShipAngle: angle }),

  setIsPlayerHit: (value) => set({ isPlayerHit: value }),

  updateBattleTime: (delta) => set((state) => ({
    battleTime: state.battleTime + delta,
  })),

  updateComboTimer: (delta) => set((state) => {
    if (state.comboTimer <= 0) return { comboTimer: 0 };
    const newTimer = state.comboTimer - delta;
    if (newTimer <= 0) {
      return { comboTimer: 0, combo: 0 };
    }
    return { comboTimer: newTimer };
  }),

  resetBattle: () => set({
    score: 0,
    combo: 0,
    maxCombo: 0,
    morale: 100,
    battleTime: 0,
    enemies: [],
    particles: [],
    reedBoats: [],
    playerShipAngle: 0,
    isPlayerHit: false,
    lastKillTime: 0,
    comboTimer: 0,
  }),
}));
