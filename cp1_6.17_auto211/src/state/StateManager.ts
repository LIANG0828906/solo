import { create } from 'zustand';
import type {
  PlayerState,
  Plankton,
  Predator,
  Decoy,
  Particle,
  FloatingText,
  TerrainData,
  GameState,
  Vector2,
} from '../types';

type EventCallback = (data?: unknown) => void;

interface GameStore {
  player: PlayerState;
  planktons: Plankton[];
  predators: Predator[];
  decoys: Decoy[];
  particles: Particle[];
  floatingTexts: FloatingText[];
  terrain: TerrainData | null;
  game: GameState;
  keys: Record<string, boolean>;
  eventListeners: Map<string, EventCallback[]>;

  setPlayerPosition: (pos: Vector2) => void;
  setPlayerVelocity: (vel: Vector2) => void;
  setPlayerGlowing: (glowing: boolean) => void;
  damagePlayer: () => void;
  growPlayer: () => void;
  addShield: () => void;
  setDoubleScore: (duration: number) => void;
  incrementCombo: () => void;
  resetCombo: () => void;

  setPlanktons: (planktons: Plankton[]) => void;
  updatePlankton: (id: number, updates: Partial<Plankton>) => void;
  removePlankton: (id: number) => void;

  setPredators: (predators: Predator[]) => void;
  updatePredator: (id: number, updates: Partial<Predator>) => void;
  removePredator: (id: number) => void;

  addDecoy: (decoy: Decoy) => void;
  removeDecoy: (id: number) => void;

  addParticle: (particle: Particle) => void;
  removeParticle: (id: number) => void;
  clearParticles: () => void;

  addFloatingText: (text: FloatingText) => void;
  removeFloatingText: (id: number) => void;

  setTerrain: (terrain: TerrainData) => void;

  addScore: (points: number) => void;
  setTimeRemaining: (time: number) => void;
  incrementTotalCollected: () => void;
  setDifficultyLevel: (level: number) => void;
  setTideActive: (active: boolean, endTime: number) => void;
  triggerScreenFlash: (color: string, duration: number) => void;
  setDarkenScreen: (value: number) => void;
  setGamePhase: (phase: GameState['phase']) => void;
  setMaxSize: (size: number) => void;

  setKey: (key: string, pressed: boolean) => void;

  on: (event: string, callback: EventCallback) => void;
  off: (event: string, callback: EventCallback) => void;
  emit: (event: string, data?: unknown) => void;

  resetGame: () => void;
}

const createInitialPlayer = (): PlayerState => ({
  position: { x: 400, y: 300 },
  velocity: { x: 0, y: 0 },
  health: 3,
  maxHealth: 3,
  shield: 0,
  maxShield: 3,
  size: 1.0,
  isGlowing: false,
  glowStartTime: 0,
  glowCooldownEnd: 0,
  isInvincible: false,
  invincibleEnd: 0,
  hitFlashEnd: 0,
  combo: 0,
  doubleScoreEnd: 0,
});

const createInitialGameState = (): GameState => ({
  phase: 'playing',
  score: 0,
  timeRemaining: 180,
  totalCollected: 0,
  maxSize: 1.0,
  difficultyLevel: 0,
  tideActive: false,
  tideEnd: 0,
  screenFlash: { active: false, endTime: 0, color: '' },
  darkenScreen: 0,
});

let particleIdCounter = 0;
let floatingTextIdCounter = 0;
let planktonIdCounter = 0;
let predatorIdCounter = 0;
let decoyIdCounter = 0;

export const useGameStore = create<GameStore>((set, get) => ({
  player: createInitialPlayer(),
  planktons: [],
  predators: [],
  decoys: [],
  particles: [],
  floatingTexts: [],
  terrain: null,
  game: createInitialGameState(),
  keys: {},
  eventListeners: new Map(),

  setPlayerPosition: (pos) =>
    set((state) => ({ player: { ...state.player, position: pos } })),
  setPlayerVelocity: (vel) =>
    set((state) => ({ player: { ...state.player, velocity: vel } })),
  setPlayerGlowing: (glowing) =>
    set((state) => ({ player: { ...state.player, isGlowing: glowing } })),

  damagePlayer: () =>
    set((state) => {
      const now = Date.now();
      if (state.player.isInvincible) return state;

      let newShield = state.player.shield;
      let newHealth = state.player.health;
      let damaged = false;

      if (state.player.shield > 0) {
        newShield = state.player.shield - 1;
        damaged = true;
      } else if (state.player.health > 0) {
        newHealth = state.player.health - 1;
        damaged = true;
      }

      if (!damaged) return state;

      return {
        player: {
          ...state.player,
          health: newHealth,
          shield: newShield,
          isInvincible: true,
          invincibleEnd: now + 1000,
          hitFlashEnd: now + 500,
          combo: 0,
        },
        game: {
          ...state.game,
          screenFlash: {
            active: true,
            endTime: now + 500,
            color: 'rgba(255,0,0,0.3)',
          },
        },
      };
    }),

  growPlayer: () =>
    set((state) => {
      const newSize = Math.min(state.player.size * 1.01, 1.5);
      return {
        player: { ...state.player, size: newSize },
        game: {
          ...state.game,
          maxSize: Math.max(state.game.maxSize, newSize),
        },
      };
    }),

  addShield: () =>
    set((state) => {
      if (state.player.health < state.player.maxHealth) return state;
      return {
        player: {
          ...state.player,
          shield: Math.min(state.player.shield + 1, state.player.maxShield),
        },
      };
    }),

  setDoubleScore: (duration) =>
    set((state) => ({
      player: {
        ...state.player,
        doubleScoreEnd: Date.now() + duration,
      },
    })),

  incrementCombo: () =>
    set((state) => ({ player: { ...state.player, combo: state.player.combo + 1 } })),
  resetCombo: () =>
    set((state) => ({ player: { ...state.player, combo: 0 } })),

  setPlanktons: (planktons) => set({ planktons }),
  updatePlankton: (id, updates) =>
    set((state) => ({
      planktons: state.planktons.map((p) =>
        p.id === id ? { ...p, ...updates } : p
      ),
    })),
  removePlankton: (id) =>
    set((state) => ({ planktons: state.planktons.filter((p) => p.id !== id) })),

  setPredators: (predators) => set({ predators }),
  updatePredator: (id, updates) =>
    set((state) => ({
      predators: state.predators.map((p) =>
        p.id === id ? { ...p, ...updates } : p
      ),
    })),
  removePredator: (id) =>
    set((state) => ({ predators: state.predators.filter((p) => p.id !== id) })),

  addDecoy: (decoy) =>
    set((state) => ({ decoys: [...state.decoys, { ...decoy, id: ++decoyIdCounter }] })),
  removeDecoy: (id) =>
    set((state) => ({ decoys: state.decoys.filter((d) => d.id !== id) })),

  addParticle: (particle) =>
    set((state) => {
      if (state.particles.length >= 300) {
        return {
          particles: [
            ...state.particles.slice(1),
            { ...particle, id: ++particleIdCounter },
          ],
        };
      }
      return {
        particles: [...state.particles, { ...particle, id: ++particleIdCounter }],
      };
    }),
  removeParticle: (id) =>
    set((state) => ({ particles: state.particles.filter((p) => p.id !== id) })),
  clearParticles: () => set({ particles: [] }),

  addFloatingText: (text) =>
    set((state) => ({
      floatingTexts: [
        ...state.floatingTexts,
        { ...text, id: ++floatingTextIdCounter },
      ],
    })),
  removeFloatingText: (id) =>
    set((state) => ({ floatingTexts: state.floatingTexts.filter((t) => t.id !== id) })),

  setTerrain: (terrain) => set({ terrain }),

  addScore: (points) =>
    set((state) => {
      const isDouble = Date.now() < state.player.doubleScoreEnd;
      const finalPoints = isDouble ? points * 2 : points;
      return { game: { ...state.game, score: state.game.score + finalPoints } };
    }),
  setTimeRemaining: (time) =>
    set((state) => ({ game: { ...state.game, timeRemaining: time } })),
  incrementTotalCollected: () =>
    set((state) => ({
      game: { ...state.game, totalCollected: state.game.totalCollected + 1 },
    })),
  setDifficultyLevel: (level) =>
    set((state) => ({ game: { ...state.game, difficultyLevel: level } })),
  setTideActive: (active, endTime) =>
    set((state) => ({
      game: { ...state.game, tideActive: active, tideEnd: endTime },
    })),
  triggerScreenFlash: (color, duration) =>
    set((state) => ({
      game: {
        ...state.game,
        screenFlash: { active: true, endTime: Date.now() + duration, color },
      },
    })),
  setDarkenScreen: (value) =>
    set((state) => ({ game: { ...state.game, darkenScreen: value } })),
  setGamePhase: (phase) =>
    set((state) => ({ game: { ...state.game, phase } })),
  setMaxSize: (size) =>
    set((state) => ({ game: { ...state.game, maxSize: size } })),

  setKey: (key, pressed) =>
    set((state) => ({ keys: { ...state.keys, [key]: pressed } })),

  on: (event, callback) => {
    const listeners = get().eventListeners;
    if (!listeners.has(event)) {
      listeners.set(event, []);
    }
    listeners.get(event)!.push(callback);
  },
  off: (event, callback) => {
    const listeners = get().eventListeners;
    if (!listeners.has(event)) return;
    const arr = listeners.get(event)!;
    const idx = arr.indexOf(callback);
    if (idx >= 0) arr.splice(idx, 1);
  },
  emit: (event, data) => {
    const listeners = get().eventListeners;
    if (!listeners.has(event)) return;
    for (const cb of listeners.get(event)!) {
      try {
        cb(data);
      } catch (e) {
        console.error('Event listener error:', e);
      }
    }
  },

  resetGame: () =>
    set({
      player: createInitialPlayer(),
      planktons: [],
      predators: [],
      decoys: [],
      particles: [],
      floatingTexts: [],
      terrain: null,
      game: createInitialGameState(),
      keys: {},
    }),
}));

export { particleIdCounter, floatingTextIdCounter, planktonIdCounter, predatorIdCounter, decoyIdCounter };
